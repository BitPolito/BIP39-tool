import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';

export type BipStandard = 'bip44' | 'bip84';

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

export interface HdWallet {
  wordCount: 12 | 24;
  mnemonic: string;
  seedHex: string;
  rootNode: HDKey;
  getIntermediateNodes: (standard: BipStandard) => IntermediateNodeData[];
  getAddresses: (standard: BipStandard, offset: number, count: number) => AddressLeafData[];
  wipe: () => void;
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

type LevelDefinition = Omit<
  IntermediateNodeData,
  'privateKeyHex' | 'wif' | 'chainCodeHex' | 'xprv' | 'xpub' | 'publicKeyHex'
>;

function getLevelDefinitions(standard: BipStandard): LevelDefinition[] {
  const purposeSegment = standard === 'bip84' ? "84'" : "44'";
  const purposeDescIt =
    standard === 'bip84'
      ? "Livello Purpose: 84' specifica che la derivazione segue lo standard BIP-0084 per indirizzi Native SegWit (P2WPKH / Bech32)."
      : "Livello Purpose: 44' specifica che la derivazione segue la struttura dello standard BIP-0044 (Legacy P2PKH).";
  const purposeDescEn =
    standard === 'bip84'
      ? "Purpose level: 84' specifies that derivation follows the BIP-0084 standard for Native SegWit (P2WPKH / Bech32) addresses."
      : "Purpose level: 44' specifies that derivation follows the BIP-0044 standard structure (Legacy P2PKH).";

  return [
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
      path: `m/${purposeSegment}`,
      isHardened: true,
      descIt: purposeDescIt,
      descEn: purposeDescEn,
    },
    {
      depth: 2,
      nameKey: 'coinType',
      path: `m/${purposeSegment}/0'`,
      isHardened: true,
      descIt: "Livello Coin Type: 0' identifica la blockchain Bitcoin Mainnet (secondo SLIP-0044).",
      descEn: "Coin Type level: 0' identifies the Bitcoin Mainnet blockchain (per SLIP-0044).",
    },
    {
      depth: 3,
      nameKey: 'account',
      path: `m/${purposeSegment}/0'/0'`,
      isHardened: true,
      descIt: "Livello Account: 0' separa il portafoglio in account logici indipendenti (primo account).",
      descEn: "Account level: 0' separates the wallet into independent logical accounts (primary account).",
    },
    {
      depth: 4,
      nameKey: 'change',
      path: `m/${purposeSegment}/0'/0'/0`,
      isHardened: false,
      descIt: 'Livello Change: 0 indica la catena esterna per gli indirizzi pubblici di ricezione.',
      descEn: 'Change level: 0 indicates the external chain for public receiving addresses.',
    },
  ];
}

function getChangePath(standard: BipStandard): string {
  return standard === 'bip84' ? "m/84'/0'/0'/0" : "m/44'/0'/0'/0";
}

// SLIP-0132 version bytes for mainnet extended keys (xprv/xpub for BIP44, zprv/zpub for BIP84)
const STANDARD_VERSIONS: Record<BipStandard, { private: number; public: number }> = {
  bip44: { private: 0x0488ade4, public: 0x0488b21e },
  bip84: { private: 0x04b2430c, public: 0x04b24746 },
};

function deriveAddressFromPublicKey(standard: BipStandard, pubKey: Uint8Array): string {
  return standard === 'bip84'
    ? (btc.p2wpkh(pubKey, btc.NETWORK).address ?? '')
    : (btc.p2pkh(pubKey, btc.NETWORK).address ?? '');
}

/**
 * Creates a lazy HD wallet supporting both BIP44 (Legacy) and BIP84 (Native SegWit).
 * Each standard's branch is only derived on demand and tracked for memory wiping.
 */
export function generateHdWallet(wordCount: 12 | 24 = 12): HdWallet {
  const strength = wordCount === 24 ? 256 : 128;
  const mnemonic = generateMnemonic(wordlist, strength);
  const seedBytes = mnemonicToSeedSync(mnemonic, '');
  const seedHex = hex.encode(seedBytes);

  const rootNode = HDKey.fromMasterSeed(seedBytes, STANDARD_VERSIONS.bip44);
  const nodesToWipe: HDKey[] = [rootNode];
  const rootNodes: Partial<Record<BipStandard, HDKey>> = { bip44: rootNode };
  const changeNodes: Partial<Record<BipStandard, HDKey>> = {};

  const getOrCreateRootNode = (standard: BipStandard): HDKey => {
    const existing = rootNodes[standard];
    if (existing) return existing;
    const created = HDKey.fromMasterSeed(seedBytes, STANDARD_VERSIONS[standard]);
    rootNodes[standard] = created;
    nodesToWipe.push(created);
    return created;
  };

  const getOrCreateChangeNode = (standard: BipStandard): HDKey => {
    const existing = changeNodes[standard];
    if (existing) return existing;
    const derived = getOrCreateRootNode(standard).derive(getChangePath(standard));
    changeNodes[standard] = derived;
    nodesToWipe.push(derived);
    return derived;
  };

  const getIntermediateNodes = (standard: BipStandard): IntermediateNodeData[] => {
    const standardRoot = getOrCreateRootNode(standard);
    return getLevelDefinitions(standard).map((def) => {
      const derived = def.path === 'm' ? standardRoot : standardRoot.derive(def.path);
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
  };

  const getAddresses = (standard: BipStandard, offset: number, count: number): AddressLeafData[] => {
    const leaves: AddressLeafData[] = [];
    const safeOffset = Math.max(0, offset);
    const changePath = getChangePath(standard);
    const changeNode = getOrCreateChangeNode(standard);

    for (let i = 0; i < count; i++) {
      const index = safeOffset + i;
      const child = changeNode.deriveChild(index);
      const pubKey = child.publicKey;
      const address = pubKey ? deriveAddressFromPublicKey(standard, pubKey) : '';
      // Wipe the child private key immediately after deriving the address to keep memory minimal
      try {
        child.wipePrivateData();
      } catch {
        // ignore
      }
      leaves.push({
        index,
        path: `${changePath}/${index}`,
        address,
      });
    }
    return leaves;
  };

  const wipe = () => {
    try {
      seedBytes.fill(0);
    } catch {
      // ignore
    }

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
    getIntermediateNodes,
    getAddresses,
    wipe,
  };
}

/**
 * Backwards-compatible BIP44 wallet helper built on top of generateHdWallet.
 */
export function generateBip44Wallet(wordCount: 12 | 24 = 12): Bip44Wallet {
  const wallet = generateHdWallet(wordCount);
  const intermediateNodes = wallet.getIntermediateNodes('bip44');
  const changeNode = wallet.rootNode.derive(getChangePath('bip44'));

  return {
    wordCount: wallet.wordCount,
    mnemonic: wallet.mnemonic,
    seedHex: wallet.seedHex,
    rootNode: wallet.rootNode,
    changeNode,
    intermediateNodes,
    getAddresses: (offset: number, count: number) => wallet.getAddresses('bip44', offset, count),
    wipe: () => {
      try {
        changeNode.wipePrivateData();
      } catch {
        // ignore
      }
      wallet.wipe();
    },
  };
}
