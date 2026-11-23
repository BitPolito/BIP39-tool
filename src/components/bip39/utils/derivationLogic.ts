import {
  entropyToMnemonic,
  generateMnemonic,
  mnemonicToEntropy,
  mnemonicToSeedSync,
  validateMnemonic,
} from '@scure/bip39';
import { wordlist as englishWordlist } from '@scure/bip39/wordlists/english.js';
import { wordlist as japaneseWordlist } from '@scure/bip39/wordlists/japanese.js';
import { wordlist as spanishWordlist } from '@scure/bip39/wordlists/spanish.js';
import { wordlist as simplifiedChineseWordlist } from '@scure/bip39/wordlists/simplified-chinese.js';
import { wordlist as traditionalChineseWordlist } from '@scure/bip39/wordlists/traditional-chinese.js';
import { wordlist as frenchWordlist } from '@scure/bip39/wordlists/french.js';
import { wordlist as italianWordlist } from '@scure/bip39/wordlists/italian.js';
import { wordlist as koreanWordlist } from '@scure/bip39/wordlists/korean.js';
import { wordlist as czechWordlist } from '@scure/bip39/wordlists/czech.js';
import { wordlist as portugueseWordlist } from '@scure/bip39/wordlists/portuguese.js';
import { HDKey } from '@scure/bip32';
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import type {
  BipStandard,
  CoinConfig,
  CoinId,
  ChangeIndex,
  DerivationParams,
  ResolvedDerivationParams,
  MnemonicLanguage,
  IntermediateNodeData,
  AddressLeafData,
  HdWallet,
  Bip44Wallet,
  LevelDefinition,
  StandardConfig,
  MnemonicValidationResult
} from './interface';

const HARDENED_OFFSET = 0x80000000;

export const WORDLISTS: Record<MnemonicLanguage, string[]> = {
  english: englishWordlist,
  japanese: japaneseWordlist,
  spanish: spanishWordlist,
  'simplified-chinese': simplifiedChineseWordlist,
  'traditional-chinese': traditionalChineseWordlist,
  french: frenchWordlist,
  italian: italianWordlist,
  korean: koreanWordlist,
  czech: czechWordlist,
  portuguese: portugueseWordlist,
};

export const COIN_CONFIG: Record<CoinId, CoinConfig> = {
  btc: {
    id: 'btc',
    coinType: 0,
    labelIt: 'BTC — Bitcoin',
    labelEn: 'BTC — Bitcoin',
    addressCoinLabelIt: 'Bitcoin',
    addressCoinLabelEn: 'Bitcoin',
    descIt: "identifica la blockchain Bitcoin Mainnet (secondo SLIP-0044).",
    descEn: 'identifies the Bitcoin Mainnet blockchain (per SLIP-0044).',
    network: {
      bech32: btc.NETWORK.bech32,
      pubKeyHash: btc.NETWORK.pubKeyHash,
      scriptHash: btc.NETWORK.scriptHash,
      wif: btc.NETWORK.wif,
    },
    versionsByStandard: {
      bip44: { private: 0x0488ade4, public: 0x0488b21e },
      bip84: { private: 0x04b2430c, public: 0x04b24746 },
      bip86: { private: 0x0488ade4, public: 0x0488b21e },
    },
  },
  'btc-regtest': {
    id: 'btc-regtest',
    coinType: 1,
    labelIt: 'BTC regtest',
    labelEn: 'BTC regtest',
    addressCoinLabelIt: 'Bitcoin Regtest',
    addressCoinLabelEn: 'Bitcoin Regtest',
    descIt:
      "identifica l'ambiente Bitcoin Regtest / Testnet (secondo SLIP-0044, prefisso Bech32 'bcrt').",
    descEn:
      "identifies the Bitcoin Regtest / Testnet environment (per SLIP-0044, Bech32 prefix 'bcrt').",
    network: {
      bech32: 'bcrt',
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef,
    },
    versionsByStandard: {
      bip44: { private: 0x04358394, public: 0x043587cf },
      bip84: { private: 0x045f18bc, public: 0x045f1cf6 },
      bip86: { private: 0x04358394, public: 0x043587cf },
    },
  },
  ltc: {
    id: 'ltc',
    coinType: 2,
    labelIt: 'Litecoin (LTC)',
    labelEn: 'Litecoin (LTC)',
    addressCoinLabelIt: 'Litecoin',
    addressCoinLabelEn: 'Litecoin',
    descIt: 'identifica la blockchain Litecoin Mainnet (secondo SLIP-0044).',
    descEn: 'identifies the Litecoin Mainnet blockchain (per SLIP-0044).',
    network: {
      bech32: 'ltc',
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0,
    },
    versionsByStandard: {
      bip44: { private: 0x0488ade4, public: 0x0488b21e },
      bip84: { private: 0x04b2430c, public: 0x04b24746 },
      bip86: { private: 0x0488ade4, public: 0x0488b21e },
    },
  },
};

export const COIN_OPTIONS: CoinConfig[] = [
  COIN_CONFIG['btc'],
  COIN_CONFIG['btc-regtest'],
  COIN_CONFIG['ltc'],
];

const STANDARD_CONFIG: Record<BipStandard, StandardConfig> = {
  bip44: {
    purposeIndex: 44,
    purposeSegment: "44'",
    purposeDescIt:
      "Livello Purpose: 44' specifica che la derivazione segue la struttura dello standard BIP-0044 (Legacy P2PKH).",
    purposeDescEn:
      "Purpose level: 44' specifies that derivation follows the BIP-0044 standard structure (Legacy P2PKH).",
    deriveAddress: (pubKey, network) => btc.p2pkh(pubKey, network).address ?? '',
  },
  bip84: {
    purposeIndex: 84,
    purposeSegment: "84'",
    purposeDescIt:
      "Livello Purpose: 84' specifica che la derivazione segue lo standard BIP-0084 per indirizzi Native SegWit (P2WPKH / Bech32).",
    purposeDescEn:
      "Purpose level: 84' specifies that derivation follows the BIP-0084 standard for Native SegWit (P2WPKH / Bech32) addresses.",
    deriveAddress: (pubKey, network) => btc.p2wpkh(pubKey, network).address ?? '',
  },
  bip86: {
    purposeIndex: 86,
    purposeSegment: "86'",
    purposeDescIt:
      "Livello Purpose: 86' specifica che la derivazione segue lo standard BIP-0086 per indirizzi Taproot (P2TR / Bech32m).",
    purposeDescEn:
      "Purpose level: 86' specifies that derivation follows the BIP-0086 standard for Taproot (P2TR / Bech32m) addresses.",
    deriveAddress: (pubKey, network) =>
      btc.p2tr(pubKey.subarray(1, 33), undefined, network).address ?? '',
  },
};

export function resolveDerivationParams(params?: DerivationParams): ResolvedDerivationParams {
  const coin: CoinId = params?.coin && params.coin in COIN_CONFIG ? params.coin : 'btc';
  const coinConfig = COIN_CONFIG[coin];
  const rawCoinType = params?.coinType ?? coinConfig.coinType;
  const coinType =
    Number.isInteger(rawCoinType) && rawCoinType >= 0 && rawCoinType <= 0x7fffffff
      ? rawCoinType
      : coinConfig.coinType;
  const rawAccount = params?.account ?? 0;
  const account =
    Number.isInteger(rawAccount) && rawAccount >= 0 && rawAccount <= 0x7fffffff
      ? rawAccount
      : 0;
  const change: ChangeIndex = params?.change === 1 ? 1 : 0;

  return { coin, coinType, account, change };
}

export function buildDerivationPaths(
  standard: BipStandard,
  params?: DerivationParams,
): {
  root: string;
  purpose: string;
  coinType: string;
  account: string;
  change: string;
  address: (index: number) => string;
} {
  const { purposeSegment } = STANDARD_CONFIG[standard];
  const { coinType, account, change } = resolveDerivationParams(params);
  const root = 'm';
  const purpose = `${root}/${purposeSegment}`;
  const coinTypePath = `${purpose}/${coinType}'`;
  const accountPath = `${coinTypePath}/${account}'`;
  const changePath = `${accountPath}/${change}`;

  return {
    root,
    purpose,
    coinType: coinTypePath,
    account: accountPath,
    change: changePath,
    address: (index: number) => `${changePath}/${index}`,
  };
}

function getLevelDefinitions(
  standard: BipStandard,
  params?: DerivationParams,
): LevelDefinition[] {
  const resolved = resolveDerivationParams(params);
  const coinConfig = COIN_CONFIG[resolved.coin];
  const paths = buildDerivationPaths(standard, resolved);
  const { purposeDescIt, purposeDescEn } = STANDARD_CONFIG[standard];

  return [
    {
      depth: 0,
      nameKey: 'root',
      path: paths.root,
      isHardened: false,
      descIt: 'Radice BIP32 derivata dal seed BIP39 (512 bit) tramite HMAC-SHA512 ("Bitcoin seed").',
      descEn: 'BIP32 root node derived from the 512-bit BIP39 seed via HMAC-SHA512 ("Bitcoin seed").',
    },
    {
      depth: 1,
      nameKey: 'purpose',
      path: paths.purpose,
      isHardened: true,
      descIt: purposeDescIt,
      descEn: purposeDescEn,
    },
    {
      depth: 2,
      nameKey: 'coinType',
      path: paths.coinType,
      isHardened: true,
      descIt: `Livello Coin Type: ${resolved.coinType}' ${coinConfig.descIt}`,
      descEn: `Coin Type level: ${resolved.coinType}' ${coinConfig.descEn}`,
    },
    {
      depth: 3,
      nameKey: 'account',
      path: paths.account,
      isHardened: true,
      descIt: `Livello Account: ${resolved.account}' separa il portafoglio in account logici indipendenti (account #${resolved.account}).`,
      descEn: `Account level: ${resolved.account}' separates the wallet into independent logical accounts (account #${resolved.account}).`,
    },
    {
      depth: 4,
      nameKey: 'change',
      path: paths.change,
      isHardened: false,
      descIt:
        resolved.change === 0
          ? 'Livello Change: 0 indica la catena esterna (external / receive) per gli indirizzi pubblici di ricezione.'
          : 'Livello Change: 1 indica la catena interna (internal / change) per gli indirizzi di resto delle transazioni.',
      descEn:
        resolved.change === 0
          ? 'Change level: 0 indicates the external (receive) chain for public receiving addresses.'
          : 'Change level: 1 indicates the internal (change) chain for transaction change addresses.',
    },
  ];
}

function formatIntermediateNode(
  def: LevelDefinition,
  derived: HDKey,
  network: CoinConfig['network'],
): IntermediateNodeData {
  const privateKeyHex = derived.privateKey ? hex.encode(derived.privateKey) : '';
  const wif = derived.privateKey ? btc.WIF(network).encode(derived.privateKey) : '';
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
}

/**
 * Builds a lazy HD wallet from a BIP39 mnemonic string.
 * Each standard/coin/account/change node is derived step-by-step from its parent,
 * cached by versioned path, and tracked for memory wiping.
 */
function createHdWalletFromMnemonic(mnemonic: string, wordCount: 12 | 24): HdWallet {
  const seedBytes = mnemonicToSeedSync(mnemonic, '');
  const seedHex = hex.encode(seedBytes);

  const defaultVersions = COIN_CONFIG.btc.versionsByStandard.bip44;
  const rootNode = HDKey.fromMasterSeed(seedBytes, defaultVersions);
  const nodesToWipe: HDKey[] = [rootNode];
  const nodeCache = new Map<string, HDKey>();

  const getVersionKey = (versions: { private: number; public: number }) =>
    `${versions.private}:${versions.public}`;

  nodeCache.set(`${getVersionKey(defaultVersions)}:m`, rootNode);

  const getOrCreateRootNode = (versions: { private: number; public: number }): HDKey => {
    const key = `${getVersionKey(versions)}:m`;
    const existing = nodeCache.get(key);
    if (existing) return existing;

    const created = HDKey.fromMasterSeed(seedBytes, versions);
    nodeCache.set(key, created);
    nodesToWipe.push(created);
    return created;
  };

  const getOrCreateChildNode = (
    parent: HDKey,
    versions: { private: number; public: number },
    childPath: string,
    childIndex: number,
  ): HDKey => {
    const key = `${getVersionKey(versions)}:${childPath}`;
    const existing = nodeCache.get(key);
    if (existing) return existing;

    const derived = parent.deriveChild(childIndex);
    nodeCache.set(key, derived);
    nodesToWipe.push(derived);
    return derived;
  };

  const getNodeUpToDepth = (
    standard: BipStandard,
    depth: 0 | 1 | 2 | 3 | 4,
    params?: DerivationParams,
  ): HDKey => {
    const resolved = resolveDerivationParams(params);
    const coinConfig = COIN_CONFIG[resolved.coin];
    const versions = coinConfig.versionsByStandard[standard];
    const paths = buildDerivationPaths(standard, resolved);

    const depth0 = getOrCreateRootNode(versions);
    if (depth === 0) return depth0;

    const depth1 = getOrCreateChildNode(
      depth0,
      versions,
      paths.purpose,
      STANDARD_CONFIG[standard].purposeIndex + HARDENED_OFFSET,
    );
    if (depth === 1) return depth1;

    const depth2 = getOrCreateChildNode(
      depth1,
      versions,
      paths.coinType,
      resolved.coinType + HARDENED_OFFSET,
    );
    if (depth === 2) return depth2;

    const depth3 = getOrCreateChildNode(
      depth2,
      versions,
      paths.account,
      resolved.account + HARDENED_OFFSET,
    );
    if (depth === 3) return depth3;

    return getOrCreateChildNode(depth3, versions, paths.change, resolved.change);
  };

  const getIntermediateNodeAtDepth = (
    standard: BipStandard,
    depth: 0 | 1 | 2 | 3 | 4,
    params?: DerivationParams,
  ): IntermediateNodeData => {
    const resolved = resolveDerivationParams(params);
    const network = COIN_CONFIG[resolved.coin].network;
    const defs = getLevelDefinitions(standard, resolved);
    const derived = getNodeUpToDepth(standard, depth, resolved);
    return formatIntermediateNode(defs[depth], derived, network);
  };

  const getIntermediateNodes = (
    standard: BipStandard,
    params?: DerivationParams,
  ): IntermediateNodeData[] => {
    const resolved = resolveDerivationParams(params);
    const network = COIN_CONFIG[resolved.coin].network;
    const defs = getLevelDefinitions(standard, resolved);
    return defs.map((def) => {
      const derived = getNodeUpToDepth(standard, def.depth as 0 | 1 | 2 | 3 | 4, resolved);
      return formatIntermediateNode(def, derived, network);
    });
  };

  const getAddresses = (
    standard: BipStandard,
    offset: number,
    count: number,
    params?: DerivationParams,
  ): AddressLeafData[] => {
    const resolved = resolveDerivationParams(params);
    const network = COIN_CONFIG[resolved.coin].network;
    const paths = buildDerivationPaths(standard, resolved);
    const leaves: AddressLeafData[] = [];
    const safeOffset = Math.max(0, offset);
    const changeNode = getNodeUpToDepth(standard, 4, resolved);

    for (let i = 0; i < count; i++) {
      const index = safeOffset + i;
      const child = changeNode.deriveChild(index);
      const pubKey = child.publicKey;
      const address = pubKey ? STANDARD_CONFIG[standard].deriveAddress(pubKey, network) : '';
      // Wipe the child private key immediately after deriving the address to keep memory minimal
      try {
        child.wipePrivateData();
      } catch {
        // ignore
      }
      leaves.push({
        index,
        path: paths.address(index),
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
    nodeCache.clear();
  };

  return {
    wordCount,
    mnemonic,
    seedHex,
    rootNode,
    getIntermediateNodes,
    getIntermediateNodeAtDepth,
    getAddresses,
    wipe,
  };
}

/**
 * Creates a lazy HD wallet supporting BIP44 (Legacy), BIP84 (Native SegWit), and BIP86 (Taproot).
 * Each branch is derived on demand and tracked for memory wiping.
 */
export function generateHdWallet(
  wordCount: 12 | 24 = 12,
  language: MnemonicLanguage = 'english',
): HdWallet {
  const strength = wordCount === 24 ? 256 : 128;
  const mnemonic = generateMnemonic(WORDLISTS[language], strength);
  return createHdWalletFromMnemonic(mnemonic, wordCount);
}

/**
 * Validates a user-supplied BIP39 mnemonic string (12 or 24 words) against the selected wordlist.
 */
export function validateUserMnemonic(
  wordsOrMnemonic: string | string[],
  language: MnemonicLanguage = 'english',
): MnemonicValidationResult {
  const rawWords = Array.isArray(wordsOrMnemonic)
    ? wordsOrMnemonic.map((w) => w.trim().normalize('NFKD').toLowerCase())
    : wordsOrMnemonic
        .trim()
        .normalize('NFKD')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

  const wordlist = WORDLISTS[language];
  const invalidWordIndices: number[] = [];
  rawWords.forEach((word, index) => {
    if (word !== '' && !wordlist.includes(word)) {
      invalidWordIndices.push(index);
    }
  });

  const nonEmptyWords = rawWords.filter(Boolean);
  const wordCount: 12 | 24 | null =
    nonEmptyWords.length === 12 ? 12 : nonEmptyWords.length === 24 ? 24 : null;

  if (
    wordCount === null ||
    (Array.isArray(wordsOrMnemonic) && rawWords.some((w) => w === ''))
  ) {
    return {
      valid: false,
      normalizedMnemonic: nonEmptyWords.join(' '),
      wordCount,
      invalidWordIndices,
      errorCode: invalidWordIndices.length > 0 ? 'invalid_word' : 'word_count',
    };
  }

  if (invalidWordIndices.length > 0) {
    return {
      valid: false,
      normalizedMnemonic: nonEmptyWords.join(' '),
      wordCount,
      invalidWordIndices,
      errorCode: 'invalid_word',
    };
  }

  const normalizedMnemonic = nonEmptyWords.join(' ');
  if (!validateMnemonic(normalizedMnemonic, wordlist)) {
    return {
      valid: false,
      normalizedMnemonic,
      wordCount,
      invalidWordIndices: [],
      errorCode: 'checksum',
    };
  }

  return {
    valid: true,
    normalizedMnemonic,
    wordCount,
    invalidWordIndices: [],
  };
}

/**
 * Builds a lazy HD wallet from a user-provided BIP39 mnemonic string (12 or 24 words).
 */
export function deriveHdWalletFromMnemonic(
  mnemonic: string,
  language: MnemonicLanguage = 'english',
): HdWallet {
  const validation = validateUserMnemonic(mnemonic, language);
  if (!validation.valid || validation.wordCount === null) {
    throw new Error(`Invalid BIP39 mnemonic (${validation.errorCode ?? 'unknown'})`);
  }
  return createHdWalletFromMnemonic(validation.normalizedMnemonic, validation.wordCount);
}

/**
 * Translates an existing mnemonic to another BIP39 wordlist using the same entropy
 * and builds a fresh lazy HD wallet with the corresponding BIP39 seed and BIP32 tree.
 */
export function translateHdWallet(
  sourceMnemonic: string,
  sourceLanguage: MnemonicLanguage,
  targetLanguage: MnemonicLanguage,
  wordCount: 12 | 24,
): HdWallet {
  const entropy = mnemonicToEntropy(sourceMnemonic, WORDLISTS[sourceLanguage]);
  try {
    const targetMnemonic = entropyToMnemonic(entropy, WORDLISTS[targetLanguage]);
    return createHdWalletFromMnemonic(targetMnemonic, wordCount);
  } finally {
    entropy.fill(0);
  }
}

/**
 * Backwards-compatible BIP44 wallet helper built on top of generateHdWallet.
 */
export function generateBip44Wallet(
  wordCount: 12 | 24 = 12,
  params?: DerivationParams,
): Bip44Wallet {
  const resolved = resolveDerivationParams(params);
  const wallet = generateHdWallet(wordCount);
  const intermediateNodes = wallet.getIntermediateNodes('bip44', resolved);
  const changePath = buildDerivationPaths('bip44', resolved).change;
  const changeNode = wallet.rootNode.derive(changePath);

  return {
    wordCount: wallet.wordCount,
    mnemonic: wallet.mnemonic,
    seedHex: wallet.seedHex,
    rootNode: wallet.rootNode,
    changeNode,
    intermediateNodes,
    getAddresses: (offset: number, count: number) =>
      wallet.getAddresses('bip44', offset, count, resolved),
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
