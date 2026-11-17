import type { HDKey } from '@scure/bip32';

export type BipStandard = 'bip44' | 'bip84' | 'bip86';

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

export type LevelDefinition = Omit<
  IntermediateNodeData,
  'privateKeyHex' | 'wif' | 'chainCodeHex' | 'xprv' | 'xpub' | 'publicKeyHex'
>;

export interface StandardConfig {
  purposeSegment: string;
  changePath: string;
  // SLIP-0132 version bytes for mainnet extended keys (xprv/xpub for BIP44 & BIP86, zprv/zpub for BIP84)
  versions: { private: number; public: number };
  purposeDescIt: string;
  purposeDescEn: string;
  deriveAddress: (pubKey: Uint8Array) => string;
}
