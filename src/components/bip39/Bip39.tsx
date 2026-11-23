import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import iconKey from '../../assets/icons/icon-key.svg';
import cowIconBlue from '../../assets/bitpolito/cow-icon-blue.svg';
import cowIconWhite from '../../assets/bitpolito/cow-icon-white.svg';
import {
  generateHdWallet,
  translateHdWallet,
  deriveHdWalletFromMnemonic,
  validateUserMnemonic,
} from './utils/derivationLogic';
import type {
  BipStandard,
  CoinId,
  ChangeIndex,
  DerivationParams,
  MnemonicLanguage,
  IntermediateNodeData,
} from './utils/interface';
import type {
  Bip39Props,
  LanguageWalletCache,
  LanguageWalletEntry,
} from './utils/interfaceUI';
import {
  BIP_SPECS,
  CONTENT,
  MNEMONIC_LANGUAGE_OPTIONS,
  STANDARD_OPTIONS,
  getBranchKey,
} from './utils/utilsBip39';
import DerivationTree from './DerivationTree';
import { CheckIcon, CopyIcon } from './IntermediateNodes';
import MnemonicPhrase from './MnemonicPhrase';

function ShieldIcon() {
  return (
    <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4 fill-none stroke-current shrink-0" viewBox="0 0 24 24" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 fill-none stroke-current pointer-events-none ${className}`}
      viewBox="0 0 24 24"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function Bip39({ lang, onBack }: Bip39Props) {
  const t = CONTENT[lang];

  // Number input state (12 or 24)
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [mnemonicLanguage, setMnemonicLanguage] = useState<MnemonicLanguage>('english');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const [standard, setStandard] = useState<BipStandard>('bip44');
  const [coin, setCoin] = useState<CoinId>('btc');
  const [account, setAccount] = useState<number>(0);
  const [change, setChange] = useState<ChangeIndex>(0);
  const [walletCache, setWalletCache] = useState<LanguageWalletCache>({});
  const [addressOffset, setAddressOffset] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showWipedToast, setShowWipedToast] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [hidePrivateInfo, setHidePrivateInfo] = useState<boolean>(false);
  const [isCustomMnemonic, setIsCustomMnemonic] = useState<boolean>(false);
  const [customWords, setCustomWords] = useState<string[]>(() => Array<string>(24).fill(''));
  const customWordInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Keep a reference to all cached language wallet instances for cleanup
  const walletCacheRef = useRef<LanguageWalletCache>({});

  const activeEntry = walletCache[mnemonicLanguage] ?? null;
  const wallet = activeEntry?.wallet ?? null;
  const branchCache = useMemo(() => activeEntry?.branchCache ?? {}, [activeEntry]);

  const selectedLanguageOption = useMemo(
    () =>
      MNEMONIC_LANGUAGE_OPTIONS.find((option) => option.id === mnemonicLanguage) ??
      MNEMONIC_LANGUAGE_OPTIONS[0],
    [mnemonicLanguage],
  );

  const customValidation = useMemo(
    () => validateUserMnemonic(customWords.slice(0, wordCount), mnemonicLanguage),
    [customWords, wordCount, mnemonicLanguage],
  );

  const filledCustomWordsCount = useMemo(
    () => customWords.slice(0, wordCount).filter((w) => w.trim() !== '').length,
    [customWords, wordCount],
  );

  // Close language dropdown on outside click or Escape key
  useEffect(() => {
    if (!isLangMenuOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isLangMenuOpen]);

  /**
   * Ensures a language entry has intermediate nodes and addresses for the given branch and offset cached.
   * When `fromDepth` (3 or 4) and `previousNodes` are provided, keeps earlier depths untouched
   * and recalculates only from `fromDepth` downward.
   */
  const ensureBranchDerived = (
    entry: LanguageWalletEntry,
    targetStandard: BipStandard,
    targetCoin: CoinId,
    targetAccount: number,
    targetChange: ChangeIndex,
    targetOffset: number,
    incremental?: { fromDepth: 3 | 4; previousNodes: IntermediateNodeData[] },
  ): LanguageWalletEntry => {
    const key = getBranchKey(targetStandard, targetCoin, targetAccount, targetChange);
    const existing = entry.branchCache[key];
    if (existing?.addressesByOffset[targetOffset]) {
      return entry;
    }

    const params: DerivationParams = {
      coin: targetCoin,
      account: targetAccount,
      change: targetChange,
    };

    let intermediateNodes: IntermediateNodeData[];
    if (existing?.intermediateNodes) {
      intermediateNodes = existing.intermediateNodes;
    } else if (incremental && incremental.previousNodes.length === 5) {
      if (incremental.fromDepth === 4) {
        intermediateNodes = [
          ...incremental.previousNodes.slice(0, 4),
          entry.wallet.getIntermediateNodeAtDepth(targetStandard, 4, params),
        ];
      } else {
        intermediateNodes = [
          ...incremental.previousNodes.slice(0, 3),
          entry.wallet.getIntermediateNodeAtDepth(targetStandard, 3, params),
          entry.wallet.getIntermediateNodeAtDepth(targetStandard, 4, params),
        ];
      }
    } else {
      intermediateNodes = entry.wallet.getIntermediateNodes(targetStandard, params);
    }

    const nextAddresses =
      existing?.addressesByOffset[targetOffset] ??
      entry.wallet.getAddresses(targetStandard, targetOffset, 10, params);

    return {
      wallet: entry.wallet,
      branchCache: {
        ...entry.branchCache,
        [key]: {
          intermediateNodes,
          addressesByOffset: {
            ...existing?.addressesByOffset,
            [targetOffset]: nextAddresses,
          },
        },
      },
    };
  };

  /**
   * Requirement 7: Call wipe() when closing the page to remove all data from cache.
   */
  const wipe = useCallback(() => {
    for (const entry of Object.values(walletCacheRef.current)) {
      entry?.wallet.wipe();
    }
    walletCacheRef.current = {};
    setWalletCache({});
    setAddressOffset(0);
    setCopiedId(null);
    setCustomWords(Array<string>(24).fill(''));
    setIsCustomMnemonic(false);
  }, []);

  // Cleanup on unmount (e.g. navigation, modal close, escape key)
  useEffect(() => {
    return () => {
      wipe();
    };
  }, [wipe]);

  // Cleanup on window/tab close or refresh
  useEffect(() => {
    const handlePageExit = () => {
      wipe();
    };
    window.addEventListener('beforeunload', handlePageExit);
    window.addEventListener('pagehide', handlePageExit);
    return () => {
      window.removeEventListener('beforeunload', handlePageExit);
      window.removeEventListener('pagehide', handlePageExit);
    };
  }, [wipe]);

  // Safely exit and trigger wipe
  const handleExit = () => {
    wipe();
    onBack();
  };

  const handleManualWipe = () => {
    wipe();
    setShowWipedToast(true);
    setTimeout(() => setShowWipedToast(false), 3000);
  };

  const applyCustomMnemonicToWallet = (
    nextWords: string[],
    targetWordCount: 12 | 24,
    targetLanguage: MnemonicLanguage,
  ) => {
    const validation = validateUserMnemonic(nextWords.slice(0, targetWordCount), targetLanguage);
    for (const entry of Object.values(walletCacheRef.current)) {
      entry?.wallet.wipe();
    }
    walletCacheRef.current = {};

    if (!validation.valid) {
      setWalletCache({});
      setAddressOffset(0);
      return;
    }

    const customWallet = deriveHdWalletFromMnemonic(validation.normalizedMnemonic, targetLanguage);
    const initialEntry = ensureBranchDerived(
      { wallet: customWallet, branchCache: {} },
      standard,
      coin,
      account,
      change,
      0,
    );
    const nextCache: LanguageWalletCache = {
      [targetLanguage]: initialEntry,
    };
    walletCacheRef.current = nextCache;
    setWalletCache(nextCache);
    setAddressOffset(0);
  };

  const handleToggleCustomMnemonic = () => {
    const nextActive = !isCustomMnemonic;
    setIsCustomMnemonic(nextActive);
    if (nextActive) {
      applyCustomMnemonicToWallet(customWords, wordCount, mnemonicLanguage);
    } else {
      for (const entry of Object.values(walletCacheRef.current)) {
        entry?.wallet.wipe();
      }
      walletCacheRef.current = {};
      setWalletCache({});
      setAddressOffset(0);
    }
  };

  const handleClearCustomMnemonic = () => {
    const emptyWords = Array<string>(24).fill('');
    setCustomWords(emptyWords);
    if (isCustomMnemonic) {
      for (const entry of Object.values(walletCacheRef.current)) {
        entry?.wallet.wipe();
      }
      walletCacheRef.current = {};
      setWalletCache({});
      setAddressOffset(0);
      setIsCustomMnemonic(false);
    }
  };

  const handleWordCountChange = (nextCount: 12 | 24) => {
    if (nextCount === wordCount) return;
    setWordCount(nextCount);
    if (isCustomMnemonic) {
      applyCustomMnemonicToWallet(customWords, nextCount, mnemonicLanguage);
    }
  };

  const handleCustomWordChange = (index: number, rawValue: string) => {
    const nextWords = [...customWords];
    let nextWordCount = wordCount;
    let focusIndex: number | null = null;

    if (/\s/.test(rawValue)) {
      const tokens = rawValue.trim().split(/\s+/).filter(Boolean);
      if (tokens.length > 1) {
        const startIdx = index === 0 || tokens.length >= 12 ? 0 : index;
        if (startIdx + tokens.length > 12) {
          nextWordCount = 24;
        } else if (startIdx === 0 && tokens.length === 12) {
          nextWordCount = 12;
        }
        tokens.slice(0, 24 - startIdx).forEach((token, offset) => {
          nextWords[startIdx + offset] = token;
        });
        const nextEmpty = nextWords
          .slice(0, nextWordCount)
          .findIndex((w, idx) => idx >= startIdx && w.trim() === '');
        focusIndex = nextEmpty !== -1 ? nextEmpty : Math.min(nextWordCount - 1, startIdx + tokens.length - 1);
      } else {
        nextWords[index] = tokens[0] ?? '';
        if (tokens.length === 1 && index + 1 < nextWordCount) {
          focusIndex = index + 1;
        }
      }
    } else {
      nextWords[index] = rawValue;
    }

    if (nextWordCount !== wordCount) {
      setWordCount(nextWordCount);
    }
    setCustomWords(nextWords);
    setIsCustomMnemonic(true);
    applyCustomMnemonicToWallet(nextWords, nextWordCount, mnemonicLanguage);

    if (focusIndex !== null) {
      requestAnimationFrame(() => {
        customWordInputRefs.current[focusIndex]?.focus();
      });
    }
  };

  /**
   * Derive only the currently selected language, standard, coin, account & change on Generate;
   * alternate branches are computed lazily on first switch and kept cached until wipe/regenerate.
   */
  const handleGenerate = () => {
    setIsCalculating(true);
    setIsCustomMnemonic(false);
    setCustomWords(Array<string>(24).fill(''));
    const activeStandard = standard;
    const activeLanguage = mnemonicLanguage;
    const activeCoin = coin;
    const activeAccount = account;
    const activeChange = change;
    // Microtask to allow UI to show calculation state
    setTimeout(() => {
      for (const entry of Object.values(walletCacheRef.current)) {
        entry?.wallet.wipe();
      }
      walletCacheRef.current = {};

      const newWallet = generateHdWallet(wordCount, activeLanguage);
      const initialEntry = ensureBranchDerived(
        { wallet: newWallet, branchCache: {} },
        activeStandard,
        activeCoin,
        activeAccount,
        activeChange,
        0,
      );

      const nextCache: LanguageWalletCache = {
        [activeLanguage]: initialEntry,
      };
      walletCacheRef.current = nextCache;
      setWalletCache(nextCache);
      setAddressOffset(0);
      setIsCalculating(false);
    }, 20);
  };

  /**
   * Switch between mnemonic languages: reuse cached mnemonic, seed, and derivation tree if already computed,
   * otherwise translate from the active mnemonic (same entropy) lazily on first switch and keep previous entries cached.
   */
  const handleMnemonicLanguageChange = (nextLanguage: MnemonicLanguage) => {
    setIsLangMenuOpen(false);
    if (nextLanguage === mnemonicLanguage) return;

    const sourceEntry = walletCacheRef.current[mnemonicLanguage];
    setMnemonicLanguage(nextLanguage);
    if (!sourceEntry) {
      if (isCustomMnemonic) {
        applyCustomMnemonicToWallet(customWords, wordCount, nextLanguage);
      }
      return;
    }

    const existingTarget = walletCacheRef.current[nextLanguage];
    if (existingTarget) {
      const updatedTarget = ensureBranchDerived(
        existingTarget,
        standard,
        coin,
        account,
        change,
        addressOffset,
      );
      if (updatedTarget !== existingTarget) {
        const nextCache: LanguageWalletCache = {
          ...walletCacheRef.current,
          [nextLanguage]: updatedTarget,
        };
        walletCacheRef.current = nextCache;
        setWalletCache(nextCache);
      }
      if (isCustomMnemonic) {
        const translatedWords = existingTarget.wallet.mnemonic.split(/\s+/);
        setCustomWords([...translatedWords, ...Array<string>(24 - translatedWords.length).fill('')]);
      }
      return;
    }

    const translatedWallet = translateHdWallet(
      sourceEntry.wallet.mnemonic,
      mnemonicLanguage,
      nextLanguage,
      sourceEntry.wallet.wordCount,
    );
    const nextEntry = ensureBranchDerived(
      { wallet: translatedWallet, branchCache: {} },
      standard,
      coin,
      account,
      change,
      addressOffset,
    );
    const nextCache: LanguageWalletCache = {
      ...walletCacheRef.current,
      [nextLanguage]: nextEntry,
    };
    walletCacheRef.current = nextCache;
    setWalletCache(nextCache);
    if (isCustomMnemonic) {
      const translatedWords = translatedWallet.mnemonic.split(/\s+/);
      setCustomWords([...translatedWords, ...Array<string>(24 - translatedWords.length).fill('')]);
    }
  };

  const updateCurrentBranchCache = (
    targetStandard: BipStandard,
    targetCoin: CoinId,
    targetAccount: number,
    targetChange: ChangeIndex,
    targetOffset: number,
    incremental?: { fromDepth: 3 | 4; previousNodes: IntermediateNodeData[] },
  ) => {
    const currentEntry = walletCacheRef.current[mnemonicLanguage];
    if (!currentEntry) return;

    const updatedEntry = ensureBranchDerived(
      currentEntry,
      targetStandard,
      targetCoin,
      targetAccount,
      targetChange,
      targetOffset,
      incremental,
    );
    if (updatedEntry === currentEntry) return;

    const nextCache: LanguageWalletCache = {
      ...walletCacheRef.current,
      [mnemonicLanguage]: updatedEntry,
    };
    walletCacheRef.current = nextCache;
    setWalletCache(nextCache);
  };

  /**
   * Switch between BIP44, BIP84, and BIP86: reuse cached derivation if already computed,
   * otherwise derive the newly selected standard lazily and keep previous results cached.
   */
  const handleStandardChange = (nextStandard: BipStandard) => {
    setStandard(nextStandard);
    updateCurrentBranchCache(nextStandard, coin, account, change, addressOffset);
  };

  /**
   * Switch coin type at Depth 2: recalculates Depth 2 and subsequent depths (Depth 3, 4, 5).
   */
  const handleCoinChange = (nextCoin: CoinId) => {
    if (nextCoin === coin) return;
    setCoin(nextCoin);
    setAddressOffset(0);
    updateCurrentBranchCache(standard, nextCoin, account, change, 0);
  };

  /**
   * Switch account index at Depth 3: preserves Depth 0..2 and recalculates only Depth 3, 4, and 5.
   */
  const handleAccountChange = (nextAccount: number) => {
    const clamped = Math.max(0, Math.min(0x7fffffff, Math.floor(nextAccount)));
    if (clamped === account) return;
    const prevNodes =
      walletCacheRef.current[mnemonicLanguage]?.branchCache[
        getBranchKey(standard, coin, account, change)
      ]?.intermediateNodes;
    setAccount(clamped);
    setAddressOffset(0);
    updateCurrentBranchCache(
      standard,
      coin,
      clamped,
      change,
      0,
      prevNodes ? { fromDepth: 3, previousNodes: prevNodes } : undefined,
    );
  };

  /**
   * Switch external/internal chain at Depth 4: preserves Depth 0..3 and recalculates only Depth 4 and 5.
   */
  const handleChangeIndexChange = (nextChange: ChangeIndex) => {
    if (nextChange === change) return;
    const prevNodes =
      walletCacheRef.current[mnemonicLanguage]?.branchCache[
        getBranchKey(standard, coin, account, change)
      ]?.intermediateNodes;
    setChange(nextChange);
    setAddressOffset(0);
    updateCurrentBranchCache(
      standard,
      coin,
      account,
      nextChange,
      0,
      prevNodes ? { fromDepth: 4, previousNodes: prevNodes } : undefined,
    );
  };

  const deriveOffsetIfMissing = (targetOffset: number) => {
    setAddressOffset(targetOffset);
    updateCurrentBranchCache(standard, coin, account, change, targetOffset);
  };

  const handleNext10 = () => {
    deriveOffsetIfMissing(addressOffset + 10);
  };

  const handleReset10 = () => {
    deriveOffsetIfMissing(0);
  };

  // Memorize active tree nodes and addresses for the selected branch and offset
  const activeTreeData = useMemo(() => {
    if (!wallet) return null;
    const entry = branchCache[getBranchKey(standard, coin, account, change)];
    if (!entry) return null;
    return {
      intermediateNodes: entry.intermediateNodes,
      addresses: entry.addressesByOffset[addressOffset] ?? [],
    };
  }, [wallet, branchCache, standard, coin, account, change, addressOffset]);

  // Clipboard copy handler with feedback
  const handleCopy = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <main className="flex-1 flex flex-col py-8 sm:py-10 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleExit}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-white/10 border border-bitpolito/25 dark:border-white/40 shadow-sm hover:bg-bitpolito hover:text-white hover:border-bitpolito dark:hover:bg-white dark:hover:text-bitpolito dark:hover:border-white transition-all duration-200 cursor-pointer group"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
          <span>{t.back}</span>
        </button>

        <button
          type="button"
          onClick={handleExit}
          aria-label={t.close}
          className="p-1.5 rounded-lg hover:bg-bitpolito/10 dark:hover:bg-white/15 text-bitpolito dark:text-white transition-colors duration-150 cursor-pointer text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Security Warning Banner */}
      <div
        role="alert"
        className="mb-6 flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/50 dark:bg-red-500/15 dark:border-red-400/60 text-red-800 dark:text-red-200 shadow-sm transition-colors duration-250"
      >
        <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-red-500/15 dark:bg-red-400/20 text-red-600 dark:text-red-400">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 1540 1540" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M840 0H700V140H560V420H420V700H280L280 980H140V1260H0V1400H140V1540H1400V1400H1540V1260H1400V980H1260L1260 700H1120V420H980V140H840V0ZM840 140V420H980V700H1120V980H1260V1260H1400V1400H140V1260H280V980H420V700H560V420H700V140H840ZM840 560H700V980H840V560ZM840 1120H700V1260H840V1120Z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-red-700 dark:text-red-300">
            {t.warningTitle}
          </h3>
          <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-red-900/90 dark:text-red-100/90">
            {t.warningMessage}
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full bg-white dark:bg-white/10 border-2 border-bitpolito dark:border-white rounded-3xl p-6 sm:p-10 shadow-lg text-bitpolito dark:text-white transition-colors duration-250 flex flex-col">
        {/* Title & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-bitpolito/10 dark:bg-white/15">
              <img
                src={iconKey}
                alt="Key icon"
                className="w-6 h-6 object-contain dark:brightness-0 dark:invert"
              />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-bitpolito dark:text-white">
                {t.title}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-bitpolito/70 dark:text-white/80">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div>
            <span className="inline-flex flex-wrap items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-full bg-bitpolito/10 text-bitpolito border border-bitpolito/20 dark:bg-white/15 dark:text-white dark:border-white/30">
              {BIP_SPECS.map((bip) => (
                <span key={bip.label} className="inline-flex items-center gap-1">
                  <a
                    href={bip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t.bipLinkTitle(bip.label)}
                    className="underline decoration-bitpolito/40 dark:decoration-white/40 hover:decoration-current underline-offset-2 transition-colors focus:outline-none focus:decoration-current"
                  >
                    {bip.label}
                  </a>
                  {bip.separatorAfter && (
                    <span aria-hidden="true" className="opacity-70">
                      {bip.separatorAfter}
                    </span>
                  )}
                </span>
              ))}
            </span>
          </div>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-bitpolito/80 dark:text-white/90 mb-6">
          {t.desc}
        </p>

        {showWipedToast && (
          <div className="mb-5 p-3 rounded-xl bg-green-500/15 border border-green-500/40 text-green-800 dark:text-green-200 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckIcon />
            <span>{t.wipedNotice}</span>
          </div>
        )}

        {/* Input of numbers (12/24) with generate button beside it */}
        <div className="p-5 sm:p-6 rounded-2xl bg-bitpolito/5 dark:bg-white/5 border-2 border-bitpolito/30 dark:border-white/30 mb-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4">
            {/* Word count label, input, and preset buttons */}
            <div>
              <label
                htmlFor="wordCountInput"
                className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 text-bitpolito/80 dark:text-white/90"
              >
                {t.wordCountLabel}
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Number input for 12 / 24 */}
                <div className="relative flex items-center shrink-0">
                  <input
                    id="wordCountInput"
                    type="number"
                    min="12"
                    max="24"
                    step="12"
                    value={wordCount}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value, 10);
                      if (val === 24) handleWordCountChange(24);
                      else handleWordCountChange(12);
                    }}
                    className="w-20 sm:w-24 px-2.5 py-2 rounded-xl font-mono text-sm font-extrabold text-center bg-white dark:bg-black/30 border-2 border-bitpolito/50 dark:border-white/50 text-bitpolito dark:text-white focus:outline-none focus:border-bitpolito dark:focus:border-white shadow-xs"
                  />
                  <span className="ml-2 font-mono text-xs font-bold text-bitpolito/60 dark:text-white/60">
                    words
                  </span>
                </div>

                {/* Quick preset selector buttons for 12 / 24 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleWordCountChange(12)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      wordCount === 12
                        ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-sm'
                        : 'bg-white/80 dark:bg-white/10 text-bitpolito/80 dark:text-white/80 border border-bitpolito/25 dark:border-white/25 hover:border-bitpolito dark:hover:border-white'
                    }`}
                  >
                    {t.words12}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWordCountChange(24)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      wordCount === 24
                        ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-sm'
                        : 'bg-white/80 dark:bg-white/10 text-bitpolito/80 dark:text-white/80 border border-bitpolito/25 dark:border-white/25 hover:border-bitpolito dark:hover:border-white'
                    }`}
                  >
                    {t.words24}
                  </button>
                </div>
              </div>
            </div>

            {/* Mnemonic Language Dropdown above Action Buttons */}
            <div className="lg:ml-auto flex flex-col items-stretch lg:items-end gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <label
                  id="mnemonicLanguageLabel"
                  htmlFor="mnemonicLanguageSelect"
                  className="text-xs font-bold uppercase tracking-wider text-bitpolito/80 dark:text-white/90 whitespace-nowrap"
                >
                  {t.mnemonicLangLabel}
                </label>
                <div className="relative" ref={langMenuRef}>
                  <button
                    id="mnemonicLanguageSelect"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isLangMenuOpen}
                    aria-labelledby="mnemonicLanguageLabel mnemonicLanguageSelect"
                    onClick={() => setIsLangMenuOpen((prev) => !prev)}
                    className="w-full sm:w-auto min-w-[235px] flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-bitpolito border-2 border-bitpolito/40 dark:border-white/40 text-bitpolito dark:text-white hover:border-bitpolito dark:hover:border-white focus:outline-none focus:border-bitpolito dark:focus:border-white shadow-xs cursor-pointer transition-colors"
                  >
                    <span className="truncate">{selectedLanguageOption.label}</span>
                    <ChevronDownIcon
                      className={`shrink-0 text-bitpolito/70 dark:text-white/70 transition-transform duration-150 ${
                        isLangMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isLangMenuOpen && (
                    <ul
                      role="listbox"
                      aria-labelledby="mnemonicLanguageLabel"
                      className="absolute right-0 mt-1.5 w-full sm:w-64 z-50 rounded-xl overflow-hidden py-1 bg-white dark:bg-bitpolito border-2 border-bitpolito/40 dark:border-white/40 shadow-xl"
                    >
                      {MNEMONIC_LANGUAGE_OPTIONS.map((option) => {
                        const isSelected = option.id === mnemonicLanguage;
                        return (
                          <li key={option.id} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleMnemonicLanguageChange(option.id)}
                              className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito'
                                  : 'text-bitpolito hover:bg-bitpolito/10 dark:text-white dark:hover:bg-white/15'
                              }`}
                            >
                              <span className="truncate">{option.label}</span>
                              {isSelected && <CheckIcon />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Action Buttons: BIP44/BIP84/BIP86 Toggle, Wipe & Generate */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* BIP44 / BIP84 / BIP86 Standard Toggle */}
                <div
                  role="group"
                  aria-label={t.standardToggleAria}
                  className="inline-flex items-center bg-white dark:bg-black/30 border border-bitpolito/30 dark:border-white/30 rounded-xl p-0.5 shadow-2xs shrink-0"
                >
                  {STANDARD_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleStandardChange(option.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                        standard === option.id
                          ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-xs'
                          : 'text-bitpolito/75 dark:text-white/75 hover:text-bitpolito dark:hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Wipe Cache button: visible only once generate has been clicked and calculations are finished */}
                {wallet && !isCalculating && (
                  <button
                    type="button"
                    onClick={handleManualWipe}
                    title={t.wipeBtn}
                    className="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border-2 border-red-500/50 text-red-700 dark:text-red-300 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all duration-200 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5 animate-in fade-in"
                  >
                    <ShieldIcon />
                    <span>{t.wipeBtn}</span>
                  </button>
                )}

                {/* Generate Button */}
                <button
                  type="button"
                  disabled={isCalculating}
                  onClick={handleGenerate}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap shrink-0 bg-bitpolito text-white hover:bg-bitpolito/90 dark:bg-white dark:text-bitpolito dark:hover:bg-white/90 transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>{isCalculating ? t.generating : t.generateBtn}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hide All Private Info Toggle */}
          <div className="mt-4 pt-4 border-t border-bitpolito/15 dark:border-white/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-bitpolito/10 dark:bg-white/15 text-bitpolito dark:text-white shrink-0">
                <EyeOffIcon />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-bitpolito dark:text-white">
                  {t.hidePrivateInfo}
                </span>
                <p className="text-[11px] text-bitpolito/70 dark:text-white/70">
                  {t.hidePrivateInfoDesc}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={hidePrivateInfo}
              aria-label={t.hidePrivateInfo}
              onClick={() => setHidePrivateInfo((prev) => !prev)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors duration-200 cursor-pointer focus:outline-none ${
                hidePrivateInfo
                  ? 'bg-bitpolito border-bitpolito dark:bg-white dark:border-white'
                  : 'bg-white border-bitpolito/40 dark:bg-white/15 dark:border-white/40'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-200 shadow-sm ${
                  hidePrivateInfo
                    ? 'translate-x-5 bg-white dark:bg-bitpolito'
                    : 'translate-x-0.5 bg-bitpolito dark:bg-white'
                }`}
              />
            </button>
          </div>

          {/* Custom Seed Phrase Input Box */}
          <MnemonicPhrase
            lang={lang}
            wordCount={wordCount}
            languageLabel={selectedLanguageOption.label}
            customWords={customWords}
            filledCustomWordsCount={filledCustomWordsCount}
            isCustomMnemonic={isCustomMnemonic}
            hidePrivateInfo={hidePrivateInfo}
            customValidation={customValidation}
            inputRefs={customWordInputRefs}
            onWordCountChange={handleWordCountChange}
            onClear={handleClearCustomMnemonic}
            onToggleCustomMnemonic={handleToggleCustomMnemonic}
            onCustomWordChange={handleCustomWordChange}
          />
        </div>

        {/* Empty state before first generation */}
        {!wallet && !isCalculating && (
          <div className="p-8 sm:p-12 border-2 border-dashed border-bitpolito/30 dark:border-white/30 rounded-3xl bg-bitpolito/5 dark:bg-white/5 flex flex-col items-center justify-center text-center my-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-bitpolito/10 dark:bg-white/15 mb-3">
              <img
                src={cowIconBlue}
                alt="BitPolito Cow"
                className="w-7 h-7 object-contain dark:hidden"
              />
              <img
                src={cowIconWhite}
                alt="BitPolito Cow"
                className="w-7 h-7 object-contain hidden dark:block"
              />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-bitpolito dark:text-white mb-1">
              {t.emptyTitle}
            </h4>
            <p className="max-w-md text-xs sm:text-sm text-bitpolito/70 dark:text-white/70">
              {t.emptyDesc}
            </p>
          </div>
        )}

        {/* Display Generated Mnemonic, Seed and Root Key */}
        {wallet && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {hidePrivateInfo ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-bitpolito/5 dark:bg-white/10 border border-bitpolito/25 dark:border-white/25 flex items-center gap-3 text-bitpolito dark:text-white">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-bitpolito/10 dark:bg-white/15 shrink-0">
                  <EyeOffIcon />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">{t.privateInfoHiddenTitle}</h4>
                  <p className="text-xs text-bitpolito/75 dark:text-white/75">
                    {t.privateInfoHiddenDesc}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* BIP39 Mnemonic Phrase Section (disabled when user supplies a custom mnemonic) */}
                {!isCustomMnemonic && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-white/70 dark:bg-white/5 border border-bitpolito/30 dark:border-white/30 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-base font-extrabold text-bitpolito dark:text-white">
                          {t.mnemonicTitle} ({wallet.wordCount} words)
                        </h4>
                        <p className="text-xs text-bitpolito/70 dark:text-white/70">
                          {t.mnemonicDesc(selectedLanguageOption.label)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(wallet.mnemonic, 'mnemonic')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-bitpolito/10 dark:bg-white/15 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        {copiedId === 'mnemonic' ? (
                          <>
                            <CheckIcon />
                            <span>{t.copied}</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon />
                            <span>{t.copyMnemonic}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Numbered words grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                      {wallet.mnemonic.split(/\s+/).map((word, idx) => (
                        <div
                          key={`${idx}-${word}`}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-black/30 border border-bitpolito/20 dark:border-white/20 shadow-2xs"
                        >
                          <span className="w-5 text-right font-mono text-[10px] font-black text-bitpolito/50 dark:text-white/50 select-none">
                            {idx + 1}.
                          </span>
                          <span className="font-mono text-xs sm:text-sm font-bold text-bitpolito dark:text-white select-all">
                            {word}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BIP39 Seed (512-bit) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/70 dark:bg-white/5 border border-bitpolito/30 dark:border-white/30 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-base font-extrabold text-bitpolito dark:text-white">
                        {t.seedTitle}
                      </h4>
                      <p className="text-xs text-bitpolito/70 dark:text-white/70">
                        {t.seedDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(wallet.seedHex, 'seed')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-bitpolito/10 dark:bg-white/15 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      {copiedId === 'seed' ? (
                        <>
                          <CheckIcon />
                          <span>{t.copied}</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon />
                          <span>{t.copySeed}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-bitpolito/20 dark:border-white/20 overflow-x-auto">
                    <p className="font-mono text-xs break-all text-bitpolito dark:text-white select-all">
                      {wallet.seedHex}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* The BIP44 / BIP84 / BIP86 HD Wallet Tree Graph Component */}
            {activeTreeData && (
              <DerivationTree
                key={`${hidePrivateInfo ? 'hidden' : 'visible'}-${standard}-${mnemonicLanguage}`}
                lang={lang}
                standard={standard}
                coin={coin}
                account={account}
                change={change}
                onCoinChange={handleCoinChange}
                onAccountChange={handleAccountChange}
                onChangeIndexChange={handleChangeIndexChange}
                intermediateNodes={activeTreeData.intermediateNodes}
                addresses={activeTreeData.addresses}
                addressOffset={addressOffset}
                onNext10={handleNext10}
                onReset10={handleReset10}
                copiedId={copiedId}
                onCopy={handleCopy}
                hidePrivateInfo={hidePrivateInfo}
              />
            )}
          </div>
        )}

        {/* Bottom Close Button */}
        <div className="flex justify-end mt-8 pt-4 border-t border-bitpolito/20 dark:border-white/20">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-bitpolito text-white hover:bg-bitpolito/90 dark:bg-white dark:text-bitpolito dark:hover:bg-white/90 transition-all duration-200 cursor-pointer shadow-md"
            onClick={handleExit}
          >
            {t.close}
          </button>
        </div>
      </div>
    </main>
  );
}
