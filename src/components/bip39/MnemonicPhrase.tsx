import { CheckIcon } from './IntermediateNodes';
import type { MnemonicPhraseProps } from './utils/interfaceUI';
import { CONTENT } from './utils/utilsBip39';

const MASKED_WORD = '••••••••';

/**
 * Custom BIP39 seed phrase input box with 12 or 24 separated word inputs,
 * paste splitting, dictionary/checksum validation, and privacy masking.
 */
export default function MnemonicPhrase({
  lang,
  wordCount,
  languageLabel,
  customWords,
  filledCustomWordsCount,
  isCustomMnemonic,
  hidePrivateInfo,
  customValidation,
  inputRefs,
  onWordCountChange,
  onClear,
  onToggleCustomMnemonic,
  onCustomWordChange,
  onOpenEntropyVisualizer,
}: MnemonicPhraseProps) {
  const t = CONTENT[lang];

  return (
    <div className="mt-4 pt-4 border-t border-bitpolito/15 dark:border-white/15">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-bitpolito dark:text-white">
              {t.customMnemonicTitle}
            </span>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-bitpolito/10 dark:bg-white/15 text-bitpolito dark:text-white">
              {t.customMnemonicStatusCount(filledCustomWordsCount, wordCount)}
            </span>
            <button
              type="button"
              onClick={onOpenEntropyVisualizer}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-bitpolito/30 dark:border-white/30 bg-white dark:bg-white/10 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
            >
              {t.customMnemonicGenerateEntropy}
            </button>
          </div>
          <p className="text-[11px] text-bitpolito/70 dark:text-white/70 mt-0.5">
            {t.customMnemonicDesc(wordCount, languageLabel)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 12 / 24 selector for custom seed phrase */}
          <div className="inline-flex items-center bg-white dark:bg-black/30 border border-bitpolito/30 dark:border-white/30 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onWordCountChange(12)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                wordCount === 12
                  ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-xs'
                  : 'text-bitpolito/75 dark:text-white/75 hover:text-bitpolito dark:hover:text-white'
              }`}
            >
              {t.customMnemonicWords12}
            </button>
            <button
              type="button"
              onClick={() => onWordCountChange(24)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                wordCount === 24
                  ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-xs'
                  : 'text-bitpolito/75 dark:text-white/75 hover:text-bitpolito dark:hover:text-white'
              }`}
            >
              {t.customMnemonicWords24}
            </button>
          </div>

          {(filledCustomWordsCount > 0 || isCustomMnemonic) && (
            <button
              type="button"
              onClick={onClear}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-bitpolito/30 dark:border-white/30 bg-white dark:bg-white/10 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
            >
              {t.customMnemonicClear}
            </button>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={isCustomMnemonic}
            aria-label={t.customMnemonicToggle}
            title={t.customMnemonicToggle}
            onClick={onToggleCustomMnemonic}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors duration-200 cursor-pointer focus:outline-none ${
              isCustomMnemonic
                ? 'bg-bitpolito border-bitpolito dark:bg-white dark:border-white'
                : 'bg-white border-bitpolito/40 dark:bg-white/15 dark:border-white/40'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-200 shadow-sm ${
                isCustomMnemonic
                  ? 'translate-x-5 bg-white dark:bg-bitpolito'
                  : 'translate-x-0.5 bg-bitpolito dark:bg-white'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Separated 12 or 24 word inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {customWords.slice(0, wordCount).map((word, idx) => {
          const isWordInvalid =
            word.trim() !== '' && customValidation.invalidWordIndices.includes(idx);
          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white dark:bg-black/30 border transition-colors shadow-2xs ${
                isWordInvalid
                  ? 'border-red-500 dark:border-red-400'
                  : isCustomMnemonic && customValidation.valid
                    ? 'border-emerald-500/60 dark:border-emerald-400/60'
                    : 'border-bitpolito/25 dark:border-white/25 focus-within:border-bitpolito dark:focus-within:border-white'
              }`}
            >
              <span className="w-5 text-right font-mono text-[10px] font-black text-bitpolito/50 dark:text-white/50 select-none shrink-0">
                {idx + 1}.
              </span>
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                readOnly={hidePrivateInfo}
                tabIndex={hidePrivateInfo ? -1 : undefined}
                value={hidePrivateInfo ? (word.trim() !== '' ? MASKED_WORD : '') : word}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-label={t.customMnemonicWordPlaceholder(idx)}
                placeholder={t.customMnemonicWordPlaceholder(idx)}
                onChange={(e) => {
                  if (hidePrivateInfo) return;
                  onCustomWordChange(idx, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (hidePrivateInfo) return;
                  if (e.key === 'Backspace' && word === '' && idx > 0) {
                    e.preventDefault();
                    inputRefs.current[idx - 1]?.focus();
                  }
                }}
                className={`w-full min-w-0 bg-transparent font-mono text-xs sm:text-sm font-bold text-bitpolito dark:text-white placeholder:text-bitpolito/30 dark:placeholder:text-white/30 focus:outline-none ${
                  hidePrivateInfo ? 'select-none cursor-default' : ''
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Validation feedback when user is entering a custom seed phrase */}
      {(isCustomMnemonic || filledCustomWordsCount > 0) && (
        <div className="mt-2.5 text-xs font-semibold">
          {customValidation.valid ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <CheckIcon />
              <span>{t.customMnemonicStatusValid}</span>
            </span>
          ) : customValidation.errorCode === 'invalid_word' ? (
            <span className="text-red-700 dark:text-red-300">
              {t.customMnemonicStatusInvalidWords(customValidation.invalidWordIndices)}
            </span>
          ) : customValidation.errorCode === 'checksum' ? (
            <span className="text-red-700 dark:text-red-300">
              {t.customMnemonicStatusBadChecksum}
            </span>
          ) : (
            <span className="text-bitpolito/75 dark:text-white/75">
              {t.customMnemonicStatusIncomplete(filledCustomWordsCount, wordCount)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
