import { useState } from 'react';
import type { Language } from '../../App';
import {
  computeBip39FromEntropyBits,
  binaryStringToHex,
  type WordCountTarget,
} from '../../utils/entropyUtils';

interface Bip39StepVisualizerProps {
  lang?: Language;
  bits: string;
  targetWords: WordCountTarget;
}

const TEXT = {
  title: 'Interactive BIP-39 Mnemonic Conversion',
  subtitle: 'How raw entropy bits transform step-by-step into a secret seed phrase',
  step1Title: '1. Raw Entropy (ENT)',
  step1Desc: 'User-provided entropy bits (128 bits for 12 words, 256 bits for 24 words).',
  step2Title: '2. Checksum Calculation (CS)',
  step2Desc: 'The checksum is the first ENT/32 bits of the SHA-256 hash of the entropy bytes.',
  step3Title: '3. Splitting into 11-Bit Chunks',
  step3Desc:
    'The 132 (or 264) combined bits are sliced into 11-bit chunks (2¹¹ = 2048 possibilities).',
  step4Title: '4. BIP-39 Wordlist Lookup (Index 0 - 2047)',
  step4Desc: 'Each 11-bit chunk directly indexes into the official 2048-word English dictionary.',
  mnemonicCardTitle: 'Generated Mnemonic Phrase',
  copyMnemonic: 'Copy Mnemonic',
  copyBits: 'Copy Binary Bits',
  copied: 'Copied to clipboard!',
  bitsNeededWarning: 'More bits needed to complete the mnemonic phrase for',
  words: 'words',
  checksumBitsLabel: 'Checksum Bits',
  entropyBitsLabel: 'Entropy Bits',
  hexEntropy: 'Entropy in Hexadecimal (HEX):',
};

export default function Bip39StepVisualizer({
  bits,
  targetWords,
}: Bip39StepVisualizerProps) {
  const t = TEXT;
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const reqBits = targetWords === 12 ? 128 : 256;
  const bip39Data = computeBip39FromEntropyBits(bits, targetWords);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (!bip39Data) {
    const remaining = reqBits - bits.length;
    return (
      <div className="p-6 rounded-2xl bg-bitpolito/5 dark:bg-white/5 border border-dashed border-bitpolito/30 dark:border-white/30 text-center text-xs sm:text-sm text-bitpolito/80 dark:text-white/80">
        <span className="font-semibold block mb-1">
          {t.bitsNeededWarning} {targetWords} {t.words}:
        </span>
        <span className="font-mono text-sm font-bold text-bitpolito dark:text-white">
          {bits.length} / {reqBits} bits ({remaining > 0 ? `${remaining} remaining` : 'processing'})
        </span>
      </div>
    );
  }

  const hexEntropy = binaryStringToHex(bip39Data.entropyBitsUsed);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-bitpolito dark:text-white flex items-center gap-2">
          <span>🔐</span>
          <span>{t.title}</span>
        </h3>
        <p className="text-xs text-bitpolito/70 dark:text-white/70">{t.subtitle}</p>
      </div>

      {/* Mathematical Breakdown Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Step 1 */}
        <div className="p-3.5 rounded-xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/15 dark:border-white/15">
          <div className="font-bold text-bitpolito dark:text-white mb-1 flex items-center justify-between">
            <span>{t.step1Title}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bitpolito/10 dark:bg-white/10">
              {reqBits} bits
            </span>
          </div>
          <p className="text-[11px] text-bitpolito/70 dark:text-white/70">{t.step1Desc}</p>
        </div>

        {/* Step 2 */}
        <div className="p-3.5 rounded-xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/15 dark:border-white/15">
          <div className="font-bold text-bitpolito dark:text-white mb-1 flex items-center justify-between">
            <span>{t.step2Title}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
              +{bip39Data.checksumBits.length} bits (CS)
            </span>
          </div>
          <p className="text-[11px] text-bitpolito/70 dark:text-white/70">{t.step2Desc}</p>
          <div className="mt-2 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            CS: {bip39Data.checksumBits}
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-3.5 rounded-xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/15 dark:border-white/15">
          <div className="font-bold text-bitpolito dark:text-white mb-1 flex items-center justify-between">
            <span>{t.step3Title}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bitpolito/10 dark:bg-white/10">
              {bip39Data.fullBits.length} = {targetWords} × 11
            </span>
          </div>
          <p className="text-[11px] text-bitpolito/70 dark:text-white/70">{t.step3Desc}</p>
        </div>
      </div>

      {/* Hex representation */}
      <div className="p-3.5 rounded-xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/15 dark:border-white/15 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-bitpolito dark:text-white">{t.hexEntropy}</span>
          <span className="font-mono text-[11px] opacity-70">
            {hexEntropy.length} hex chars ({hexEntropy.length * 4} bits)
          </span>
        </div>
        <div className="font-mono text-xs break-all tracking-wider text-bitpolito dark:text-white">
          {hexEntropy}
        </div>
      </div>

      {/* Word Grid Display */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-bitpolito dark:text-white">
            {t.step4Title}
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-bitpolito dark:bg-white inline-block" />
              <span>{t.entropyBitsLabel}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {t.checksumBitsLabel}
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {bip39Data.words.map((item, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl border-2 transition-all duration-150 flex flex-col justify-between ${
                item.isChecksumWord
                  ? 'border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-500/10'
                  : 'border-bitpolito/20 dark:border-white/20 bg-white dark:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-bitpolito/60 dark:text-white/60 mb-1">
                <span className="font-bold font-mono">#{index + 1}</span>
                <span className="font-mono text-[10px]">Idx: {item.index}</span>
              </div>

              {/* Word Name */}
              <div className="font-extrabold text-base sm:text-lg text-bitpolito dark:text-white my-1 capitalize">
                {item.word}
              </div>

              {/* 11 bits representation */}
              <div className="font-mono text-[11px] tracking-wider mt-1 break-all">
                <span>{item.entropyBits}</span>
                {item.checksumBits && (
                  <span
                    className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-0.5 rounded"
                    title="Checksum bits"
                  >
                    {item.checksumBits}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Mnemonic Phrase Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-bitpolito dark:bg-white/10 text-white border-2 border-bitpolito dark:border-white shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest font-bold opacity-80">
            {t.mnemonicCardTitle} ({targetWords} {t.words})
          </span>
          {copiedType && (
            <span className="text-xs font-bold text-emerald-300 animate-in fade-in">
              ✓ {t.copied}
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white/10 dark:bg-black/20 font-mono text-sm sm:text-base leading-relaxed break-words tracking-wide select-all">
          {bip39Data.mnemonic}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => copyToClipboard(bip39Data.mnemonic, 'mnemonic')}
            className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white text-bitpolito dark:bg-white dark:text-bitpolito hover:opacity-90 transition-all duration-150 cursor-pointer shadow-sm text-center"
          >
            📋 {t.copyMnemonic}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(bip39Data.fullBits, 'bits')}
            className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white/15 hover:bg-white/25 text-white transition-all duration-150 cursor-pointer text-center"
          >
            0101 {t.copyBits}
          </button>
        </div>
      </div>
    </div>
  );
}
