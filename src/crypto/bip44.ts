import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';

export interface Bip44LevelInfo {
  depth: number;
  nameKey: 'root' | 'purpose' | 'coinType' | 'account' | 'change' | 'address';
  path: string;
  isHardened: boolean;
  descIt: string;
  descEn: string;
}

export interface IntermediateNodeData {
  depth: number;
  nameKey: 'root' | 'purpose' | 'coinType' | 'account' | 'change';
  path: string;
  isHardened: boolean;
  descIt: string;
  descEn: string;
  privateKeyHex: string;
  wif: string;
  chainCodeHex: string;
  xprv: string;
  xpub: string;
  publicKeyHex: string;
}

export interface AddressLeafData {
  index: number;
  path: string;
  address: string;
}

export interface Bip44Wallet {
  wordCount: 12 | 24;
  mnemonic: string;
  seedHex: string;
  rootNode: HDKey;
  changeNode: HDKey;
  intermediateNodes: IntermediateNodeData[];
  getAddresses: (offset: number, count: number) => AddressLeafData[];
  wipe: () => void;
}

const LEVEL_DEFINITIONS: Omit<IntermediateNodeData, 'privateKeyHex' | 'wif' | 'chainCodeHex' | 'xprv' | 'xpub' | 'publicKeyHex'>[] = [
  {
    depth: 0,
    nameKey: 'root',
    path: 'm',
    isHardened: false,
    descIt: 'Radice BIP32 derivata dal seed BIP39 (512 bit) tramite HMAC-SHA512 ("Bitcoin seed").',
    descEn: 'BIP32 root node derived from the 512-bit BIP39 seed via HMAC-SHA512 ("Bitcoin seed").',
  },
  {
    depth: 1,
    nameKey: 'purpose',
    path: "m/44'",
    isHardened: true,
    descIt: 'Livello Purpose: 44\' specifica che la derivazione segue la struttura dello standard BIP-0044.',
    descEn: 'Purpose level: 44\' specifies that derivation follows the BIP-0044 standard structure.',
  },
  {
    depth: 2,
    nameKey: 'coinType',
    path: "m/44'/0'",
    isHardened: true,
    descIt: 'Livello Coin Type: 0\' identifica la blockchain Bitcoin Mainnet (secondo SLIP-0044).',
    descEn: 'Coin Type level: 0\' identifies the Bitcoin Mainnet blockchain (per SLIP-0044).',
  },
  {
    depth: 3,
    nameKey: 'account',
    path: "m/44'/0'/0'",
    isHardened: true,
    descIt: 'Livello Account: 0\' separa il portafoglio in account logici indipendenti (primo account).',
    descEn: 'Account level: 0\' separates the wallet into independent logical accounts (primary account).',
  },
  {
    depth: 4,
    nameKey: 'change',
    path: "m/44'/0'/0'/0",
    isHardened: false,
    descIt: 'Livello Change: 0 indica la catena esterna per gli indirizzi pubblici di ricezione.',
    descEn: 'Change level: 0 indicates the external chain for public receiving addresses.',
  },
];

/**
 * Creates a BIP32/BIP44 wallet structure from word count (12 or 24).
 * Uses @scure/bip39, @scure/bip32, and @scure/btc-signer.
 */
export function generateBip44Wallet(wordCount: 12 | 24 = 12): Bip44Wallet {
  const strength = wordCount === 24 ? 256 : 128;
  const mnemonic = generateMnemonic(wordlist, strength);
  const seedBytes = mnemonicToSeedSync(mnemonic, '');
  const seedHex = hex.encode(seedBytes);

  const rootNode = HDKey.fromMasterSeed(seedBytes);

  // Derive intermediate nodes
  const nodesToWipe: HDKey[] = [rootNode];

  const intermediateNodes: IntermediateNodeData[] = LEVEL_DEFINITIONS.map((def) => {
    const derived = def.path === 'm' ? rootNode : rootNode.derive(def.path);
    if (def.path !== 'm') {
      nodesToWipe.push(derived);
    }

    const privateKeyHex = derived.privateKey ? hex.encode(derived.privateKey) : '';
    const wif = derived.privateKey ? btc.WIF(btc.NETWORK).encode(derived.privateKey) : '';
    const chainCodeHex = derived.chainCode ? hex.encode(derived.chainCode) : '';
    const xprv = derived.privateExtendedKey ?? '';
    const xpub = derived.publicExtendedKey ?? '';
    const publicKeyHex = derived.publicKey ? hex.encode(derived.publicKey) : '';

    return {
      ...def,
      privateKeyHex,
      wif,
      chainCodeHex,
      xprv,
      xpub,
      publicKeyHex,
    };
  });

  // Change node is level 4 (m/44'/0'/0'/0)
  const changeNode = rootNode.derive("m/44'/0'/0'/0");
  nodesToWipe.push(changeNode);

  const getAddresses = (offset: number, count: number): AddressLeafData[] => {
    const leaves: AddressLeafData[] = [];
    const safeOffset = Math.max(0, offset);
    for (let i = 0; i < count; i++) {
      const index = safeOffset + i;
      const child = changeNode.deriveChild(index);
      const pubKey = child.publicKey;
      const address = pubKey ? (btc.p2pkh(pubKey, btc.NETWORK).address ?? '') : '';
      // Wipe the child private key immediately after deriving the address to keep memory minimal
      try {
        child.wipePrivateData();
      } catch {
        // ignore
      }
      leaves.push({
        index,
        path: `m/44'/0'/0'/0/${index}`,
        address,
      });
    }
    return leaves;
  };

  const wipe = () => {
    // Zero out seed bytes
    try {
      seedBytes.fill(0);
    } catch {
      // ignore
    }

    // Wipe all HDKey nodes
    for (const node of nodesToWipe) {
      try {
        node.wipePrivateData();
      } catch {
        // ignore
      }
    }
    nodesToWipe.length = 0;
  };

  return {
    wordCount,
    mnemonic,
    seedHex,
    rootNode,
    changeNode,
    intermediateNodes,
    getAddresses,
    wipe,
  };
}
