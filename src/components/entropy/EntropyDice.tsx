import { useState } from 'react';
import type { Language } from '../../App';
import { extractEntropyFromDice, type DiceExtractionMethod } from '../../utils/entropyUtils';

interface EntropyDiceProps {
  lang?: Language;
  targetBits: number;
  onBitsGenerated: (bits: string, sourceInfo: string) => void;
}

const CONTENT = {
  it: {
    title: '2. Dadi a 6 Facce (Lanci D6)',
    desc: 'Annota i risultati del lancio di un dado fisico a 6 facce (D6).',
    rawInputLabel: 'Annota la sequenza dei lanci del dado (cifre da 1 a 6):',
    inputPlaceholder: 'Es.: 164235612453...',
    methodLabel: 'Metodo di estrazione dell’entropia (Il problema dei bit del D6):',
    methodSha256Title: 'Hash SHA-256',
    methodStandardBadge: 'Standard',
    methodSha256Desc:
      'Ogni lancio di un D6 contiene log₂(6) ≈ 2,585 bit di entropia. Bastano ~50 lanci per 128 bit, o ~100 lanci per 256 bit. L’hashing SHA-256 distribuisce uniformemente l’entropia su 256 bit.',
    methodSha256RollsNeeded: (rolls: number) => `~${rolls} lanci necessari`,
    methodModulo2Title: 'Modulo 2 (Pari/Dispari)',
    methodModulo2Desc:
      'Lanci dispari (1, 3, 5) = 0, lanci pari (2, 4, 6) = 1. Ogni lancio produce esattamente 1 bit (necessari 128 o 256 lanci).',
    methodModulo2RollsNeeded: (rolls: number) => `${rolls} lanci necessari`,
    methodRejectionTitle: 'Campionamento per Rigetto',
    methodRejectionDesc:
      'Un dado a 6 facce non è una potenza di 2. Mappando 1=00, 2=01, 3=10, 4=11 e SCARTANDO i lanci 5 e 6, il bias matematico viene eliminato con un’efficienza del 66,7%.',
    methodRejectionRollsNeeded: (rolls: number) => `~${rolls} lanci necessari`,
    btnClear: 'Cancella',
    btnUndo: 'Annulla',
    btnSample: 'Carica Esempio',
    statsRolls: 'Lanci inseriti',
    statsBits: 'Bit di entropia forniti',
    statsRawEntropy: 'Entropia fisica stimata',
    discardedRolls: 'Lanci scartati (5 e 6)',
    hashPreview: 'Hash SHA-256 dei lanci:',
    statusLabel: 'Stato:',
    statusTargetReached: 'Target raggiunto',
    statusCollecting: 'Raccolta lanci',
    biasAdviceTitle: 'Rilevamento del bias dei dadi:',
    biasAdviceText:
      'I normali dadi da gioco con puntini incisi possono presentare un bias fisico (la faccia 6 è più leggera della faccia 1). Usa dadi di precisione da casinò o registra almeno 50-100 lanci combinati con SHA-256.',
    sourceInfo: (method: string, rolls: number, bits: number) =>
      `Dadi (${method}: ${rolls} lanci -> ${bits} bit)`,
  },
  en: {
    title: '2. Six-Sided Dice (D6 Rolls)',
    desc: 'Write down the results of rolling a physical 6-sided die (D6).',
    rawInputLabel: 'Write down your dice roll sequence (digits 1 to 6):',
    inputPlaceholder: 'E.g.: 164235612453...',
    methodLabel: 'Entropy Extraction Method (The D6 Bits Problem):',
    methodSha256Title: 'SHA-256 Hash',
    methodStandardBadge: 'Standard',
    methodSha256Desc:
      'Each D6 roll contains log₂(6) ≈ 2.585 bits of entropy. Only ~50 rolls are needed for 128 bits, or ~100 rolls for 256 bits. SHA-256 hashing uniformly distributes the entropy across 256 bits.',
    methodSha256RollsNeeded: (rolls: number) => `~${rolls} rolls needed`,
    methodModulo2Title: 'Modulo 2 (Even/Odd)',
    methodModulo2Desc:
      'Odd rolls (1, 3, 5) = 0, Even rolls (2, 4, 6) = 1. Each roll produces exactly 1 bit (128 or 256 rolls needed).',
    methodModulo2RollsNeeded: (rolls: number) => `${rolls} rolls needed`,
    methodRejectionTitle: 'Rejection Sampling',
    methodRejectionDesc:
      'A 6-sided die is not a power of 2. By mapping 1=00, 2=01, 3=10, 4=11 and DISCARDING rolls 5 & 6, mathematical bias is eliminated with 66.7% efficiency.',
    methodRejectionRollsNeeded: (rolls: number) => `~${rolls} rolls needed`,
    btnClear: 'Clear',
    btnUndo: 'Undo',
    btnSample: 'Load Sample',
    statsRolls: 'Rolls entered',
    statsBits: 'Entropy bits provided',
    statsRawEntropy: 'Estimated physical entropy',
    discardedRolls: 'Discarded rolls (5 & 6)',
    hashPreview: 'SHA-256 hash of rolls:',
    statusLabel: 'Status:',
    statusTargetReached: 'Target reached',
    statusCollecting: 'Collecting rolls',
    biasAdviceTitle: 'Detecting dice bias:',
    biasAdviceText:
      'Standard hobby dice with drilled pips can have physical bias (face 6 is lighter than face 1). Use precision casino dice or record at least 50-100 rolls combined with SHA-256.',
    sourceInfo: (method: string, rolls: number, bits: number) =>
      `Dice (${method}: ${rolls} rolls -> ${bits} bits)`,
  },
};

const QUICK_DICE = [
  { val: '1', symbol: '⚀' },
  { val: '2', symbol: '⚁' },
  { val: '3', symbol: '⚂' },
  { val: '4', symbol: '⚃' },
  { val: '5', symbol: '⚄' },
  { val: '6', symbol: '⚅' },
];

export default function EntropyDice({
  lang = 'en',
  targetBits,
  onBitsGenerated,
}: EntropyDiceProps) {
  const t = CONTENT[lang];
  const [rawRolls, setRawRolls] = useState<string>('');
  const [method, setMethod] = useState<DiceExtractionMethod>('sha256');

  const extraction = extractEntropyFromDice(rawRolls, method, targetBits);

  const handleUpdate = (rolls: string, selectedMethod: DiceExtractionMethod) => {
    setRawRolls(rolls);
    const result = extractEntropyFromDice(rolls, selectedMethod, targetBits);
    const info = t.sourceInfo(selectedMethod.toUpperCase(), result.rollCount, result.bits.length);
    onBitsGenerated(result.bits, info);
  };

  const addRoll = (val: string) => {
    handleUpdate(rawRolls + val, method);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleUpdate(e.target.value.replace(/[^1-6]/g, ''), method);
  };

  const handleMethodChange = (newMethod: DiceExtractionMethod) => {
    setMethod(newMethod);
    handleUpdate(rawRolls, newMethod);
  };

  const handleUndo = () => {
    if (rawRolls.length > 0) {
      handleUpdate(rawRolls.slice(0, -1), method);
    }
  };

  const handleClear = () => {
    handleUpdate('', method);
  };

  const handleLoadSample = () => {
    const sample = '36215462143561234512436521436512345612345612345612';
    handleUpdate(sample, method);
  };

  const progressPercent = Math.min(100, (extraction.bits.length / targetBits) * 100);

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/15 dark:border-white/20">
        <div>
          <h3 className="text-base font-bold text-bitpolito dark:text-white flex items-center gap-2">
            <span>🎲</span>
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

      {/* Extraction Method Selector (The D6 Bits Problem) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 border-2 border-bitpolito/25 dark:border-white/25">
        <label className="text-xs font-bold uppercase tracking-wider text-bitpolito dark:text-white block mb-3">
          {t.methodLabel}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Method 1: SHA256 */}
          <button
            type="button"
            onClick={() => handleMethodChange('sha256')}
            className={`p-3.5 rounded-xl text-left border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
              method === 'sha256'
                ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                : 'bg-white dark:bg-white/5 border-bitpolito/20 dark:border-white/20 text-bitpolito dark:text-white hover:border-bitpolito/60 dark:hover:border-white/60'
            }`}
          >
            <div>
              <div className="font-bold text-xs sm:text-sm flex items-center justify-between">
                <span>{t.methodSha256Title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/30 text-amber-900 dark:text-amber-200">
                  {t.methodStandardBadge}
                </span>
              </div>
              <p
                className={`text-[11px] leading-relaxed mt-2 ${
                  method === 'sha256' ? 'opacity-90' : 'opacity-70'
                }`}
              >
                {t.methodSha256Desc}
              </p>
            </div>
            <div className="text-[11px] font-mono mt-3 font-semibold">
              {t.methodSha256RollsNeeded(Math.ceil(targetBits / Math.log2(6)))}
            </div>
          </button>

          {/* Method 2: Modulo 2 */}
          <button
            type="button"
            onClick={() => handleMethodChange('modulo2')}
            className={`p-3.5 rounded-xl text-left border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
              method === 'modulo2'
                ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                : 'bg-white dark:bg-white/5 border-bitpolito/20 dark:border-white/20 text-bitpolito dark:text-white hover:border-bitpolito/60 dark:hover:border-white/60'
            }`}
          >
            <div>
              <div className="font-bold text-xs sm:text-sm">{t.methodModulo2Title}</div>
              <p
                className={`text-[11px] leading-relaxed mt-2 ${
                  method === 'modulo2' ? 'opacity-90' : 'opacity-70'
                }`}
              >
                {t.methodModulo2Desc}
              </p>
            </div>
            <div className="text-[11px] font-mono mt-3 font-semibold">
              {t.methodModulo2RollsNeeded(targetBits)}
            </div>
          </button>

          {/* Method 3: Rejection Sampling */}
          <button
            type="button"
            onClick={() => handleMethodChange('rejection')}
            className={`p-3.5 rounded-xl text-left border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
              method === 'rejection'
                ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                : 'bg-white dark:bg-white/5 border-bitpolito/20 dark:border-white/20 text-bitpolito dark:text-white hover:border-bitpolito/60 dark:hover:border-white/60'
            }`}
          >
            <div>
              <div className="font-bold text-xs sm:text-sm">{t.methodRejectionTitle}</div>
              <p
                className={`text-[11px] leading-relaxed mt-2 ${
                  method === 'rejection' ? 'opacity-90' : 'opacity-70'
                }`}
              >
                {t.methodRejectionDesc}
              </p>
            </div>
            <div className="text-[11px] font-mono mt-3 font-semibold">
              {t.methodRejectionRollsNeeded(Math.ceil((targetBits / 2) * 1.5))}
            </div>
          </button>
        </div>
      </div>

      {/* Main Textarea for writing down dice rolls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-bitpolito dark:text-white">
            {t.rawInputLabel}
          </label>
          <div className="flex items-center gap-2">
            {/* Quick click digits for convenience */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              {QUICK_DICE.map((d) => (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => addRoll(d.val)}
                  className="w-7 h-7 text-xs font-mono font-bold rounded border border-bitpolito/20 dark:border-white/20 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito cursor-pointer transition-colors"
                >
                  {d.val}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleUndo}
              disabled={rawRolls.length === 0}
              className="text-xs px-2.5 py-1 rounded-lg border border-bitpolito/20 dark:border-white/20 hover:bg-bitpolito/10 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              {t.btnUndo}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={rawRolls.length === 0}
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
          value={rawRolls}
          onChange={handleInputChange}
          placeholder={t.inputPlaceholder}
          className="w-full font-mono text-sm p-3.5 rounded-xl bg-white dark:bg-white/5 border-2 border-bitpolito/30 dark:border-white/30 focus:border-bitpolito dark:focus:border-white focus:outline-none transition-colors duration-150 text-bitpolito dark:text-white break-all tracking-wider resize-y"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
          <div className="p-2 rounded-lg bg-bitpolito/5 dark:bg-white/5">
            <span className="text-bitpolito/70 dark:text-white/70 block">{t.statsRolls}:</span>
            <span className="font-mono font-bold text-sm">{extraction.rollCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-bitpolito/5 dark:bg-white/5">
            <span className="text-bitpolito/70 dark:text-white/70 block">{t.statsRawEntropy}:</span>
            <span className="font-mono font-bold text-sm">
              {extraction.estimatedRawEntropy.toFixed(1)} bits
            </span>
          </div>
          <div className="p-2 rounded-lg bg-bitpolito/5 dark:bg-white/5">
            <span className="text-bitpolito/70 dark:text-white/70 block">{t.statsBits}:</span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {extraction.bits.length} / {targetBits}
            </span>
          </div>
          {method === 'rejection' ? (
            <div className="p-2 rounded-lg bg-bitpolito/5 dark:bg-white/5">
              <span className="text-bitpolito/70 dark:text-white/70 block">{t.discardedRolls}:</span>
              <span className="font-mono font-bold text-sm text-amber-500">
                {extraction.discardedRolls}
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-bitpolito/5 dark:bg-white/5">
              <span className="text-bitpolito/70 dark:text-white/70 block">{t.statusLabel}</span>
              <span className="font-mono font-bold text-sm">
                {extraction.bits.length >= targetBits ? t.statusTargetReached : t.statusCollecting}
              </span>
            </div>
          )}
        </div>

        {method === 'sha256' && extraction.sha256Hex && (
          <div className="mt-3 p-3 rounded-xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/15 dark:border-white/15 text-xs">
            <span className="font-bold block text-bitpolito dark:text-white mb-1">
              {t.hashPreview}
            </span>
            <span className="font-mono break-all text-[11px] opacity-80">
              {extraction.sha256Hex}
            </span>
          </div>
        )}
      </div>

      {/* Bias Advice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-bitpolito/5 dark:bg-white/5 border border-bitpolito/20 dark:border-white/20 text-xs">
        <span className="text-base shrink-0">🎲</span>
        <div>
          <span className="font-bold text-bitpolito dark:text-white">{t.biasAdviceTitle} </span>
          <span className="text-bitpolito/80 dark:text-white/80">{t.biasAdviceText}</span>
        </div>
      </div>
    </div>
  );
}
