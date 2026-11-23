import type { HDKey } from '@scure/bip32';

export type BipStandard = 'bip44' | 'bip84' | 'bip86';

export type CoinId = 'btc' | 'btc-regtest' | 'ltc';

export type ChangeIndex = 0 | 1;

export type MnemonicLanguage =
  | 'english'
  | 'japanese'
  | 'spanish'
  | 'simplified-chinese'
  | 'traditional-chinese'
  | 'french'
  | 'italian'
  | 'korean'
  | 'czech'
  | 'portuguese';

export interface CoinNetwork {
  bech32: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
}

export interface CoinConfig {
  id: CoinId;
  coinType: number;
  labelIt: string;
  labelEn: string;
  addressCoinLabelIt: string;
  addressCoinLabelEn: string;
  descIt: string;
  descEn: string;
  network: CoinNetwork;
  versionsByStandard: Record<BipStandard, { private: number; public: number }>;
}

export interface DerivationParams {
  coin?: CoinId;
  coinType?: number;
  account?: number;
  change?: ChangeIndex;
}

export interface ResolvedDerivationParams {
  coin: CoinId;
  coinType: number;
  account: number;
  change: ChangeIndex;
}

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
  getIntermediateNodes: (standard: BipStandard, params?: DerivationParams) => IntermediateNodeData[];
  getIntermediateNodeAtDepth: (
    standard: BipStandard,
    depth: 0 | 1 | 2 | 3 | 4,
    params?: DerivationParams,
  ) => IntermediateNodeData;
  getAddresses: (
    standard: BipStandard,
    offset: number,
    count: number,
    params?: DerivationParams,
  ) => AddressLeafData[];
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

export type LevelDefinition = Omit<
  IntermediateNodeData,
  'privateKeyHex' | 'wif' | 'chainCodeHex' | 'xprv' | 'xpub' | 'publicKeyHex'
>;

export interface StandardConfig {
  purposeIndex: number;
  purposeSegment: string;
  purposeDescIt: string;
  purposeDescEn: string;
  deriveAddress: (pubKey: Uint8Array, network: CoinNetwork) => string;
}

export interface MnemonicValidationResult {
  valid: boolean;
  normalizedMnemonic: string;
  wordCount: 12 | 24 | null;
  invalidWordIndices: number[];
  errorCode?: 'word_count' | 'invalid_word' | 'checksum';
}