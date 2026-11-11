import { useState } from 'react';
import type { Language } from '../../App';
import { vonNeumannExtractor } from '../../utils/entropyUtils';

interface EntropyCoinsProps {
  lang?: Language;
  targetBits: number;
  onBitsGenerated: (bits: string, sourceInfo: string) => void;
}

const TEXT = {
  title: '1. Coins (Coin Flips)',
  desc: 'Write down the results of flipping a physical coin. Each independent flip provides 1 bit of entropy.',
  rawInputLabel: 'Write down your coin flip results (H = Heads / 0, T = Tails / 1):',
  inputPlaceholder: 'E.g.: HHTTHTHT or 0110101...',
  btnQuickH: '+ Heads (H)',
  btnQuickT: '+ Tails (T)',
  btnClear: 'Clear',
  btnUndo: 'Undo',
  btnSample: 'Load Sample',
  vonNeumannTitle: 'Von Neumann Extractor (Unbiasing)',
  vonNeumannDesc:
    'If your coin has a physical bias (e.g. 55% Heads), John von Neumann’s algorithm inspects consecutive pairs: HT yields 0, TH yields 1, while HH and TT are discarded. The resulting stream is mathematically unbiased.',
  useVonNeumann: 'Enable Von Neumann Extractor',
  statsRaw: 'Flips entered',
  statsExtracted: 'Entropy bits provided',
  discardedPairs: 'Discarded pairs',
  efficiency: 'Efficiency',
  targetReached: '✓ Target reached',
  moreNeeded: 'more bits needed',
  biasAdviceTitle: 'Detecting and preventing bias:',
  biasAdviceText:
    'Do not always start flipping from the same side. Spin the coin vigorously and let it bounce freely on a table, or alternate starting faces between flips.',
};

export default function EntropyCoins({ targetBits, onBitsGenerated }: EntropyCoinsProps) {
  const t = TEXT;
  const [rawFlips, setRawFlips] = useState<string>('');
  const [useVonNeumann, setUseVonNeumann] = useState<boolean>(false);

  const cleanInputToBinary = (str: string): string => {
    const upper = str.toUpperCase();
    let bin = '';
    for (const ch of upper) {
      if (ch === 'H' || ch === '0') bin += '0';
      else if (ch === 'T' || ch === '1') bin += '1';
    }
    return bin;
  };

  const rawBits = cleanInputToBinary(rawFlips);
  const vnResult = vonNeumannExtractor(rawBits);
  const activeBits = useVonNeumann ? vnResult.extracted : rawBits;

  const handleUpdate = (newRaw: string, vnActive: boolean) => {
    setRawFlips(newRaw);
    const bits = cleanInputToBinary(newRaw);
    const finalBits = vnActive ? vonNeumannExtractor(bits).extracted : bits;
    const info = vnActive
      ? `Coins (Von Neumann debiased: ${newRaw.length} flips -> ${finalBits.length} bits)`
      : `Coins (${newRaw.length} flips -> ${finalBits.length} bits)`;
    onBitsGenerated(finalBits, info);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleUpdate(e.target.value, useVonNeumann);
  };

  const handleToggleVn = (checked: boolean) => {
    setUseVonNeumann(checked);
    handleUpdate(rawFlips, checked);
  };

  const addQuickChar = (char: 'H' | 'T') => {
    handleUpdate(rawFlips + char, useVonNeumann);
  };

  const handleUndo = () => {
    if (rawFlips.length > 0) {
      handleUpdate(rawFlips.slice(0, -1), useVonNeumann);
    }
  };

  const handleClear = () => {
    handleUpdate('', useVonNeumann);
  };

  const handleLoadSample = () => {
    const sample = 'HTTHHTHHTTHTHTHHHTTTHTHHTTTHHTHTHTTHHTTHHTTHTHTHHHTTTHTHHTTTHHTHT';
    handleUpdate(sample, useVonNeumann);
  };

  const progressPercent = Math.min(100, (activeBits.length / targetBits) * 100);

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/15 dark:border-white/20">
        <div>
          <h3 className="text-base font-bold text-bitpolito dark:text-white flex items-center gap-2">
            <span>🪙</span>
            <span>{t.title}</span>
          </h3>
          <p className="text-xs sm:text-sm text-bitpolito/80 dark:text-white/80 mt-0.5">
            {t.desc}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-semibold text-bitpolito/70 dark:text-white/70">
            {t.statsExtracted}:{' '}
            <span className="text-sm font-bold text-bitpolito dark:text-white font-mono">
              {activeBits.length} / {targetBits}
            </span>
          </div>
          <div className="w-32 h-2 bg-bitpolito/20 dark:bg-white/20 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                activeBits.length >= targetBits ? 'bg-emerald-500' : 'bg-bitpolito dark:bg-white'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Textarea for writing down coin results */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-bitpolito dark:text-white">
            {t.rawInputLabel}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addQuickChar('H')}
              className="text-xs font-bold px-2.5 py-1 rounded-lg border border-bitpolito/30 dark:border-white/30 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito cursor-pointer transition-colors"
            >
              {t.btnQuickH}
            </button>
            <button
              type="button"
              onClick={() => addQuickChar('T')}
              className="text-xs font-bold px-2.5 py-1 rounded-lg border border-bitpolito/30 dark:border-white/30 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito cursor-pointer transition-colors"
            >
              {t.btnQuickT}
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={rawFlips.length === 0}
              className="text-xs px-2.5 py-1 rounded-lg border border-bitpolito/20 dark:border-white/20 hover:bg-bitpolito/10 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              {t.btnUndo}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={rawFlips.length === 0}
              className="text-xs px-2.5 py-1 rounded-lg border border-red-400/50 text-red-600 dark:text-red-300 hover:bg-red-500/10 disabled:opacity-40 cursor-pointer"
            >
              {t.btnClear}
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs px-2.5 py-1 rounded-lg border border-bitpolito/20 dark:border-white/20 hover:bg-bitpolito/10 dark:hover:bg-white/10 cursor-pointer"
            >
              {t.btnSample}
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={rawFlips}
          onChange={handleInputChange}
          placeholder={t.inputPlaceholder}
          className="w-full font-mono text-sm p-3.5 rounded-xl bg-white dark:bg-white/5 border-2 border-bitpolito/30 dark:border-white/30 focus:border-bitpolito dark:focus:border-white focus:outline-none transition-colors duration-150 text-bitpolito dark:text-white break-all tracking-wider resize-y"
        />

        <div className="flex items-center justify-between text-xs text-bitpolito/70 dark:text-white/70 mt-1">
          <span>
            {t.statsRaw}: <b className="font-mono text-bitpolito dark:text-white">{rawFlips.length}</b> ({rawBits.split('0').length - 1}H / {rawBits.split('1').length - 1}T)
          </span>
          <span>
            {activeBits.length >= targetBits
              ? t.targetReached
              : `${targetBits - activeBits.length} ${t.moreNeeded}`}
          </span>
        </div>
      </div>

      {/* Von Neumann Extractor Feature */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-bitpolito dark:text-white">
        <div className="flex items-start sm:items-center justify-between gap-4 mb-2">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useVonNeumann}
              onChange={(e) => handleToggleVn(e.target.checked)}
              className="w-5 h-5 rounded text-bitpolito dark:text-white accent-bitpolito cursor-pointer"
            />
            <span className="font-bold text-sm sm:text-base">{t.vonNeumannTitle}</span>
          </label>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold">
            Debiasing
          </span>
        </div>

        <p className="text-xs leading-relaxed text-bitpolito/80 dark:text-white/80 mb-3">
          {t.vonNeumannDesc}
        </p>

        {useVonNeumann && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-amber-500/20 text-xs">
            <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
              <span className="text-bitpolito/70 dark:text-white/70 block">{t.statsRaw}:</span>
              <span className="font-mono font-bold text-sm">{rawFlips.length}</span>
            </div>
            <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
              <span className="text-bitpolito/70 dark:text-white/70 block">Bits Kept:</span>
              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {vnResult.keptPairs}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
              <span className="text-bitpolito/70 dark:text-white/70 block">{t.discardedPairs}:</span>
              <span className="font-mono font-bold text-sm text-red-500">{vnResult.discardedPairs}</span>
            </div>
            <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
              <span className="text-bitpolito/70 dark:text-white/70 block">{t.efficiency}:</span>
              <span className="font-mono font-bold text-sm">{vnResult.efficiency.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Bias Advice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/20 dark:border-white/20 text-xs">
        <span className="text-base shrink-0">💡</span>
        <div>
          <span className="font-bold text-bitpolito dark:text-white">{t.biasAdviceTitle} </span>
          <span className="text-bitpolito/80 dark:text-white/80">{t.biasAdviceText}</span>
        </div>
      </div>
    </div>
  );
}
