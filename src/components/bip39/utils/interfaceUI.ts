import type { RefObject } from 'react';
import type { Language } from '../../../App';
import type { WordCountTarget } from '../../../utils/entropyUtils';
import type {
  AddressLeafData,
  BipStandard,
  ChangeIndex,
  CoinId,
  HdWallet,
  IntermediateNodeData,
  MnemonicLanguage,
  MnemonicValidationResult,
} from './interface';

export type BranchKey = `${BipStandard}:${CoinId}:${number}:${ChangeIndex}`;

export type BranchCache = Partial<
  Record<
    BranchKey,
    {
      intermediateNodes: IntermediateNodeData[];
      addressesByOffset: Record<number, AddressLeafData[]>;
    }
  >
>;

export interface LanguageWalletEntry {
  wallet: HdWallet;
  branchCache: BranchCache;
}

export type LanguageWalletCache = Partial<Record<MnemonicLanguage, LanguageWalletEntry>>;

export interface Bip39Props {
  lang: Language;
  onBack: () => void;
  onOpenEntropyVisualizer: () => void;
}

export interface Bip39StepVisualizerProps {
  lang?: Language;
  bits: string;
  targetWords: WordCountTarget;
}

export interface DerivationTreeProps {
  lang: Language;
  standard: BipStandard;
  coin: CoinId;
  account: number;
  change: ChangeIndex;
  onCoinChange: (coin: CoinId) => void;
  onAccountChange: (account: number) => void;
  onChangeIndexChange: (change: ChangeIndex) => void;
  intermediateNodes: IntermediateNodeData[];
  addresses: AddressLeafData[];
  addressOffset: number;
  onNext10: () => void;
  onReset10: () => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  hidePrivateInfo?: boolean;
}

export interface IntermediateNodesProps {
  lang: Language;
  standard: BipStandard;
  coin: CoinId;
  account: number;
  change: ChangeIndex;
  onCoinChange: (coin: CoinId) => void;
  onAccountChange: (account: number) => void;
  onChangeIndexChange: (change: ChangeIndex) => void;
  intermediateNodes: IntermediateNodeData[];
  expandedNodes: Record<number, boolean>;
  onToggleNode: (depth: number) => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  hidePrivateInfo?: boolean;
}

export interface CopyableKeyFieldProps {
  label: string;
  value: string;
  copyKey: string;
  copiedId: string | null;
  copyLabel: string;
  copiedLabel: string;
  onCopy: (text: string, id: string) => void;
  compact?: boolean;
}

export interface MnemonicPhraseProps {
  lang: Language;
  wordCount: 12 | 24;
  languageLabel: string;
  customWords: string[];
  filledCustomWordsCount: number;
  isCustomMnemonic: boolean;
  hidePrivateInfo: boolean;
  customValidation: MnemonicValidationResult;
  inputRefs: RefObject<Array<HTMLInputElement | null>>;
  onWordCountChange: (count: 12 | 24) => void;
  onClear: () => void;
  onToggleCustomMnemonic: () => void;
  onCustomWordChange: (index: number, value: string) => void;
  onOpenEntropyVisualizer: () => void;
}
