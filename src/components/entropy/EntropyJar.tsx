import { useState } from 'react';
import type { Language } from '../../App';
import { extractEntropyFromJar, type JarType } from '../../utils/entropyUtils';

interface EntropyJarProps {
  lang?: Language;
  targetBits: number;
  onBitsGenerated: (bits: string, sourceInfo: string) => void;
}

const CONTENT = {
  it: {
    title: '3. Vaso di Entropia (Modello a Urna)',
    desc: 'Annota gettoni, biglie o tessere numerate estratte da un vaso o un’urna fisica.',
    jarTypeLabel: 'Tipo di gettoni nel vaso fisico:',
    typeHex: 'Gettoni Esadecimali (16 gettoni: 0-F)',
    typeHexBadge: '4 bit/estrazione',
    typeHexDesc: 'Ogni estrazione fornisce esattamente 4 bit (un nibble). Bastano solo 32 estrazioni per 128 bit!',
    typeHexDrawsNeeded: (draws: number, bits: number) => `${draws} estrazioni per ${bits} bit`,
    typeBinary: 'Biglie Binarie (2 colori: 0/1 o Nero/Bianco)',
    typeBinaryBadge: '1 bit/estrazione',
    typeBinaryDesc: 'Ogni estrazione produce esattamente 1 bit (necessarie 128 o 256 estrazioni).',
    typeBinaryDrawsNeeded: (draws: number, bits: number) => `${draws} estrazioni per ${bits} bit`,
    typeDecimal: 'Tessere Decimali (10 tessere: 0-9)',
    typeDecimalBadge: 'SHA-256',
    typeDecimalDesc: 'Ogni estrazione produce log₂(10) ≈ 3,32 bit. Elaborati tramite hash crittografico SHA-256.',
    typeDecimalDrawsNeeded: (draws: number) => `~${draws} estrazioni necessarie`,
    rawInputLabel: 'Annota qui la sequenza dei gettoni estratti:',
    inputPlaceholderHex: 'Es.: A3F82C9E4B...',
    inputPlaceholderBin: 'Es.: 011010011...',
    inputPlaceholderDec: 'Es.: 8492017356...',
    btnClear: 'Cancella',
    btnUndo: 'Annulla',
    btnSample: 'Carica Esempio',
    statsDraws: 'Estrazioni inserite',
    statsBits: 'Bit di entropia forniti',
    statsEntropy: 'Entropia fisica stimata',
    replacementAdviceTitle: 'Regola fondamentale dell’urna:',
    replacementAdviceText:
      'Estrazione con reinserimento: dopo aver estratto e annotato un gettone, rimettilo sempre nel vaso e agita energicamente prima della successiva estrazione, garantendo un’entropia indipendente e identicamente distribuita (IID).',
    sourceInfo: (type: string, count: number, bits: number) =>
      `Vaso di Entropia (${type}: ${count} estrazioni -> ${bits} bit)`,
    sourceInfoEmpty: (type: string) => `Vaso di Entropia (${type})`,
  },
  en: {
    title: '3. Entropy Jar (Urn Model)',
    desc: 'Write down tokens, marbles, or numbered chips drawn from a physical jar or urn.',
    jarTypeLabel: 'Type of tokens in your physical jar:',
    typeHex: 'Hexadecimal Tokens (16 tokens: 0-F)',
    typeHexBadge: '4 bits/draw',
    typeHexDesc: 'Each draw provides exactly 4 bits (one nibble). Only 32 draws needed for 128 bits!',
    typeHexDrawsNeeded: (draws: number, bits: number) => `${draws} draws for ${bits} bits`,
    typeBinary: 'Binary Marbles (2 colors: 0/1 or Black/White)',
    typeBinaryBadge: '1 bit/draw',
    typeBinaryDesc: 'Each draw yields exactly 1 bit (128 or 256 draws needed).',
    typeBinaryDrawsNeeded: (draws: number, bits: number) => `${draws} draws for ${bits} bits`,
    typeDecimal: 'Decimal Chips (10 chips: 0-9)',
    typeDecimalBadge: 'SHA-256',
    typeDecimalDesc: 'Each draw yields log₂(10) ≈ 3.32 bits. Processed via cryptographic SHA-256 hash.',
    typeDecimalDrawsNeeded: (draws: number) => `~${draws} draws needed`,
    rawInputLabel: 'Write down the sequence of drawn tokens here:',
    inputPlaceholderHex: 'E.g.: A3F82C9E4B...',
    inputPlaceholderBin: 'E.g.: 011010011...',
    inputPlaceholderDec: 'E.g.: 8492017356...',
    btnClear: 'Clear',
    btnUndo: 'Undo',
    btnSample: 'Load Sample',
    statsDraws: 'Draws entered',
    statsBits: 'Entropy bits provided',
    statsEntropy: 'Estimated physical entropy',
    replacementAdviceTitle: 'Fundamental urn rule:',
    replacementAdviceText:
      'Drawing with replacement: after drawing and writing down a token, always return it to the jar and shake vigorously before the next draw, ensuring independent and identically distributed (IID) entropy.',
    sourceInfo: (type: string, count: number, bits: number) =>
      `Entropy Jar (${type}: ${count} draws -> ${bits} bits)`,
    sourceInfoEmpty: (type: string) => `Entropy Jar (${type})`,
  },
};

const HEX_TOKENS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
const BINARY_TOKENS = ['0', '1'];
const DECIMAL_TOKENS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function EntropyJar({
  lang = 'en',
  targetBits,
  onBitsGenerated,
}: EntropyJarProps) {
  const t = CONTENT[lang];
  const [jarType, setJarType] = useState<JarType>('hex');
  const [tokens, setTokens] = useState<string[]>([]);
  const [rawText, setRawText] = useState<string>('');

  const extraction = extractEntropyFromJar(tokens, jarType, targetBits);
  const availableTokens =
    jarType === 'hex' ? HEX_TOKENS : jarType === 'binary' ? BINARY_TOKENS : DECIMAL_TOKENS;

  const handleUpdate = (newTokens: string[], type: JarType) => {
    setTokens(newTokens);
    setRawText(newTokens.join(''));
    const result = extractEntropyFromJar(newTokens, type, targetBits);
    const info = t.sourceInfo(type.toUpperCase(), result.tokenCount, result.bits.length);
    onBitsGenerated(result.bits, info);
  };

  const addToken = (token: string) => {
    handleUpdate([...tokens, token], jarType);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.toUpperCase();
    setRawText(val);

    let parsed: string[] = [];
    if (jarType === 'hex') {
      parsed = val.replace(/[^0-9A-F]/g, '').split('');
    } else if (jarType === 'binary') {
      parsed = val.replace(/[^01]/g, '').split('');
    } else {
      parsed = val.replace(/[^0-9]/g, '').split('');
    }

    setTokens(parsed);
    const result = extractEntropyFromJar(parsed, jarType, targetBits);
    onBitsGenerated(result.bits, t.sourceInfo(jarType, parsed.length, result.bits.length));
  };

  const handleTypeChange = (newType: JarType) => {
    setJarType(newType);
    setTokens([]);
    setRawText('');
    onBitsGenerated('', t.sourceInfoEmpty(newType));
  };

  const handleUndo = () => {
    if (tokens.length > 0) {
      handleUpdate(tokens.slice(0, -1), jarType);
    }
  };

  const handleClear = () => {
    handleUpdate([], jarType);
  };

  const handleLoadSample = () => {
    let sample: string[] = [];
    if (jarType === 'hex') {
      sample = '7A9F3C1E842D5B0F6A2E9C17483B5D0F'.split('');
    } else if (jarType === 'binary') {
      sample = '1011001011010011100101010110011010110010110100111001010101100110'.split('');
    } else {
      sample = '8492017356281940562819405637281940561234567890'.split('');
    }
    handleUpdate(sample, jarType);
  };

  const progressPercent = Math.min(100, (extraction.bits.length / targetBits) * 100);

  const getPlaceholder = () => {
    if (jarType === 'hex') return t.inputPlaceholderHex;
    if (jarType === 'binary') return t.inputPlaceholderBin;
    return t.inputPlaceholderDec;
  };

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/15 dark:border-white/20">
        <div>
          <h3 className="text-base font-bold text-bitpolito dark:text-white flex items-center gap-2">
            <span>🏺</span>
            <span>{t.title}</span>
          </h3>
          <p className="text-xs sm:text-sm text-bitpolito/80 dark:text-white/80 mt-0.5">
            {t.desc}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-semibold text-bitpolito/70 dark:text-white/70">
            {t.statsBits}:{' '}
            <span className="text-sm font-bold text-bitpolito dark:text-white font-mono">
              {extraction.bits.length} / {targetBits}
            </span>
          </div>
          <div className="w-32 h-2 bg-bitpolito/20 dark:bg-white/20 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                extraction.bits.length >= targetBits ? 'bg-emerald-500' : 'bg-bitpolito dark:bg-white'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Jar Mode Selector */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 border-2 border-bitpolito/25 dark:border-white/25">
        <label className="text-xs font-bold uppercase tracking-wider text-bitpolito dark:text-white block mb-3">
          {t.jarTypeLabel}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('hex')}
            className={`p-3.5 rounded-xl text-left border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
              jarType === 'hex'
                ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                : 'bg-white dark:bg-white/5 border-bitpolito/20 dark:border-white/20 text-bitpolito dark:text-white hover:border-bitpolito/60 dark:hover:border-white/60'
            }`}
          >
            <div>
              <div className="font-bold text-xs sm:text-sm flex items-center justify-between">
                <span>{t.typeHex}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/30 text-emerald-900 dark:text-emerald-200">
                  {t.typeHexBadge}
                </span>
              </div>
              <p
                className={`text-[11px] leading-relaxed mt-2 ${
                  jarType === 'hex' ? 'opacity-90' : 'opacity-70'
                }`}
              >
                {t.typeHexDesc}
              </p>
            </div>
            <div className="text-[11px] font-mono mt-3 font-semibold">
              {t.typeHexDrawsNeeded(targetBits / 4, targetBits)}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('binary')}
            className={`p-3.5 rounded-xl text-left border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
              jarType === 'binary'
                ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                : 'bg-white dark:bg-white/5 border-bitpolito/20 dark:border-white/20 text-bitpolito dark:text-white hover:border-bitpolito/60 dark:hover:border-white/60'
            }`}
          >
            <div>
              <div className="font-bold text-xs sm:text-sm flex items-center justify-between">
                <span>{t.typeBinary}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/30 text-amber-900 dark:text-amber-200">
                  {t.typeBinaryBadge}
                </span>
              </div>
              <p
                className={`text-[11px] leading-relaxed mt-2 ${
                  jarType === 'binary' ? 'opacity-90' : 'opacity-70'
                }`}
              >
                {t.typeBinaryDesc}
              </p>
            </div>
            <div className="text-[11px] font-mono mt-3 font-semibold">
              {t.typeBinaryDrawsNeeded(targetBits, targetBits)}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('decimal')}
            className={`p-3.5 rounded-xl text-left border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
              jarType === 'decimal'
                ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                : 'bg-white dark:bg-white/5 border-bitpolito/20 dark:border-white/20 text-bitpolito dark:text-white hover:border-bitpolito/60 dark:hover:border-white/60'
            }`}
          >
            <div>
              <div className="font-bold text-xs sm:text-sm flex items-center justify-between">
                <span>{t.typeDecimal}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-400/30 text-blue-900 dark:text-blue-200">
                  {t.typeDecimalBadge}
                </span>
              </div>
              <p
                className={`text-[11px] leading-relaxed mt-2 ${
                  jarType === 'decimal' ? 'opacity-90' : 'opacity-70'
                }`}
              >
                {t.typeDecimalDesc}
              </p>
            </div>
            <div className="text-[11px] font-mono mt-3 font-semibold">
              {t.typeDecimalDrawsNeeded(Math.ceil(targetBits / Math.log2(10)))}
            </div>
          </button>
        </div>
      </div>

      {/* Main Textarea for writing down drawn tokens */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-bitpolito dark:text-white">
            {t.rawInputLabel}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={tokens.length === 0}
              className="text-xs px-2.5 py-1 rounded-lg border border-bitpolito/20 dark:border-white/20 hover:bg-bitpolito/10 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              {t.btnUndo}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={tokens.length === 0}
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
          value={rawText}
          onChange={handleTextChange}
          placeholder={getPlaceholder()}
          className="w-full font-mono text-sm p-3.5 rounded-xl bg-white dark:bg-white/5 border-2 border-bitpolito/30 dark:border-white/30 focus:border-bitpolito dark:focus:border-white focus:outline-none transition-colors duration-150 text-bitpolito dark:text-white break-all tracking-wider resize-y"
        />

        {/* Quick click chips */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {availableTokens.map((tok) => (
            <button
              key={tok}
              type="button"
              onClick={() => addToken(tok)}
              className="w-8 h-8 rounded-lg font-mono font-bold text-xs bg-bitpolito/5 dark:bg-white/10 border border-bitpolito/20 dark:border-white/20 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
            >
              {tok}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 text-xs">
          <div className="p-2 rounded-lg bg-bitpolito/5 dark:bg-white/5">
            <span className="text-bitpolito/70 dark:text-white/70 block">{t.statsDraws}:</span>
            <span className="font-mono font-bold text-sm">{tokens.length}</span>
          </div>
          <div className="p-2 rounded-lg bg-bitpolito/5 dark:bg-white/5">
            <span className="text-bitpolito/70 dark:text-white/70 block">{t.statsEntropy}:</span>
            <span className="font-mono font-bold text-sm">
              {extraction.estimatedEntropy.toFixed(1)} bits
            </span>
          </div>
          <div className="p-2 rounded-lg bg-bitpolito/5 dark:bg-white/5">
            <span className="text-bitpolito/70 dark:text-white/70 block">{t.statsBits}:</span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {extraction.bits.length} / {targetBits}
            </span>
          </div>
        </div>
      </div>

      {/* Replacement Advice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/20 dark:border-white/20 text-xs">
        <span className="text-base shrink-0">🏺</span>
        <div>
          <span className="font-bold text-bitpolito dark:text-white">
            {t.replacementAdviceTitle}{' '}
          </span>
          <span className="text-bitpolito/80 dark:text-white/80">{t.replacementAdviceText}</span>
        </div>
      </div>
    </div>
  );
}
