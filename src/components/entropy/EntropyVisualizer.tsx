import { useState } from 'react';
import type { Language } from '../../App';
import iconMicroscope from '../../assets/icons/icon-microscope.svg';
import EntropyCoins from './EntropyCoins';
import EntropyDice from './EntropyDice';
import EntropyJar from './EntropyJar';
import EntropyPhoto from './EntropyPhoto';
import Bip39StepVisualizer from '../bip39/Bip39StepVisualizer';
import type { WordCountTarget } from '../../utils/entropyUtils';

interface EntropyVisualizerProps {
  lang?: Language;
  onBack: () => void;
}

type EntropySource = 'coins' | 'dice' | 'jar' | 'photo';

const CONTENT = {
  it: {
    back: 'Torna alla home',
    close: 'Chiudi',
    title: 'Visualizzatore di Entropia',
    subtitle: 'Generatore ed esploratore dell’entropia fisica BIP39',
    desc: 'Annota i risultati dell’entropia generata nei quattro metodi fisici: monete, dadi a 6 facce, barattolo/urna e foto. Per ciascun metodo, lo strumento visualizza i bit di entropia forniti, guida nell’individuazione del bias e ricava la frase mnemonica BIP-39.',
    words12: '12 Parole (128 bit)',
    words24: '24 Parole (256 bit)',
    tabCoins: '🪙 Monete',
    tabDice: '🎲 Dadi D6',
    tabJar: '🏺 Barattolo',
    tabPhoto: '📷 Foto',
    methodSelectLabel: 'Seleziona la modalità di generazione fisica:',
    streamTitle: 'Stringa di Entropia Binaria Ottenuta',
    streamDesc:
      'La sequenza di bit 0 e 1 generata dai risultati inseriti. Puoi anche modificare direttamente questa stringa binaria.',
    bitsCount: 'Bit accumulati:',
    sourceLabel: 'Metodo attivo:',
    btnCopyBits: 'Copia Bit',
    btnWipe: 'Azzera Entropia',
    wipeNotice: 'Tutti i dati dell’entropia sono stati azzerati con successo.',
    readyNotice: '✓ Pronto per BIP-39',
    moreNeeded: 'bit mancanti',
  },
  en: {
    back: 'Back to home',
    close: 'Close',
    title: 'Entropy Visualizer',
    subtitle: 'BIP39 physical entropy generator and visualizer',
    desc: 'Write down your physical entropy results generated in the four ways: coins, 6-sided dice, entropy jar/urn, and photo. For each selected method, the tool calculates the bits of entropy provided, guides you in detecting bias, and derives the BIP-39 mnemonic phrase.',
    words12: '12 Words (128 bits)',
    words24: '24 Words (256 bits)',
    tabCoins: '🪙 Coins',
    tabDice: '🎲 D6 Dice',
    tabJar: '🏺 Entropy Jar',
    tabPhoto: '📷 Photo',
    methodSelectLabel: 'Choose your physical entropy generation method:',
    streamTitle: 'Resulting Binary Entropy Stream',
    streamDesc:
      'The sequence of 0 and 1 bits produced by your entered results. You can also directly edit or paste into this binary string.',
    bitsCount: 'Accumulated bits:',
    sourceLabel: 'Active source:',
    btnCopyBits: 'Copy Bits',
    btnWipe: 'Wipe Entropy',
    wipeNotice: 'All entropy and cached private data wiped successfully.',
    readyNotice: '✓ Ready for BIP-39',
    moreNeeded: 'more needed',
  },
};

export default function EntropyVisualizer({ lang = 'en', onBack }: EntropyVisualizerProps) {
  const t = CONTENT[lang] || CONTENT.en;
  const [activeSource, setActiveSource] = useState<EntropySource>('coins');
  const [targetWords, setTargetWords] = useState<WordCountTarget>(12);
  const [binaryStream, setBinaryStream] = useState<string>('');
  const [sourceInfo, setSourceInfo] = useState<string>('Coins (empty)');
  const [showWipeToast, setShowWipeToast] = useState<boolean>(false);
  const [copiedStream, setCopiedStream] = useState<boolean>(false);

  const targetBits = targetWords === 12 ? 128 : 256;

  const handleBitsGenerated = (bits: string, info: string) => {
    setBinaryStream(bits);
    setSourceInfo(info);
  };

  const handleManualStreamChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const clean = e.target.value.replace(/[^01]/g, '');
    setBinaryStream(clean);
    setSourceInfo(`Manual Binary Input (${clean.length} bits)`);
  };

  const handleWipe = () => {
    setBinaryStream('');
    setSourceInfo('Wiped');
    setShowWipeToast(true);
    setTimeout(() => setShowWipeToast(false), 2500);
  };

  const handleCopyStream = () => {
    if (!binaryStream) return;
    navigator.clipboard.writeText(binaryStream);
    setCopiedStream(true);
    setTimeout(() => setCopiedStream(false), 2000);
  };

  return (
    <main className="flex-1 flex flex-col py-8 sm:py-10 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-white/10 border border-bitpolito/25 dark:border-white/40 shadow-sm hover:bg-bitpolito hover:text-white hover:border-bitpolito dark:hover:bg-white dark:hover:text-bitpolito dark:hover:border-white transition-all duration-200 cursor-pointer group"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
          <span>{t.back}</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          aria-label={t.close}
          className="p-1.5 rounded-lg hover:bg-bitpolito/10 dark:hover:bg-white/15 text-bitpolito dark:text-white transition-colors duration-150 cursor-pointer text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Main card */}
      <div className="w-full bg-white dark:bg-white/10 border-2 border-bitpolito dark:border-white rounded-3xl p-6 sm:p-10 shadow-lg text-bitpolito dark:text-white transition-colors duration-250 flex flex-col space-y-7">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-bitpolito/20 dark:border-white/20 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-bitpolito/10 dark:bg-white/15">
              <img
                src={iconMicroscope}
                alt="Microscope icon"
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

          {/* Mnemonic Target Selector (12 vs 24 words) */}
          <div className="flex items-center gap-2 bg-bitpolito/5 dark:bg-white/5 p-1.5 rounded-2xl border border-bitpolito/20 dark:border-white/20">
            <button
              type="button"
              onClick={() => setTargetWords(12)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                targetWords === 12
                  ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-sm'
                  : 'text-bitpolito/70 dark:text-white/70 hover:bg-bitpolito/10 dark:hover:bg-white/10'
              }`}
            >
              {t.words12}
            </button>
            <button
              type="button"
              onClick={() => setTargetWords(24)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                targetWords === 24
                  ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-sm'
                  : 'text-bitpolito/70 dark:text-white/70 hover:bg-bitpolito/10 dark:hover:bg-white/10'
              }`}
            >
              {t.words24}
            </button>
          </div>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-bitpolito/80 dark:text-white/90">
          {t.desc}
        </p>

        {/* Four Input Methods Tabs */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-bitpolito dark:text-white mb-3">
            {t.methodSelectLabel}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setActiveSource('coins')}
              className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                activeSource === 'coins'
                  ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                  : 'bg-white dark:bg-white/5 border-bitpolito/25 dark:border-white/25 hover:border-bitpolito/60 dark:hover:border-white/60'
              }`}
            >
              <span>{t.tabCoins}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSource('dice')}
              className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                activeSource === 'dice'
                  ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                  : 'bg-white dark:bg-white/5 border-bitpolito/25 dark:border-white/25 hover:border-bitpolito/60 dark:hover:border-white/60'
              }`}
            >
              <span>{t.tabDice}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSource('jar')}
              className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                activeSource === 'jar'
                  ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                  : 'bg-white dark:bg-white/5 border-bitpolito/25 dark:border-white/25 hover:border-bitpolito/60 dark:hover:border-white/60'
              }`}
            >
              <span>{t.tabJar}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSource('photo')}
              className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                activeSource === 'photo'
                  ? 'bg-bitpolito text-white border-bitpolito dark:bg-white dark:text-bitpolito dark:border-white shadow-md'
                  : 'bg-white dark:bg-white/5 border-bitpolito/25 dark:border-white/25 hover:border-bitpolito/60 dark:hover:border-white/60'
              }`}
            >
              <span>{t.tabPhoto}</span>
            </button>
          </div>
        </div>

        {/* Active Source Component */}
        <div className="pt-2">
          {activeSource === 'coins' && (
            <EntropyCoins
              lang={lang}
              targetBits={targetBits}
              onBitsGenerated={handleBitsGenerated}
            />
          )}

          {activeSource === 'dice' && (
            <EntropyDice
              lang={lang}
              targetBits={targetBits}
              onBitsGenerated={handleBitsGenerated}
            />
          )}

          {activeSource === 'jar' && (
            <EntropyJar
              lang={lang}
              targetBits={targetBits}
              onBitsGenerated={handleBitsGenerated}
            />
          )}

          {activeSource === 'photo' && (
            <EntropyPhoto
              lang={lang}
              targetBits={targetBits}
              onBitsGenerated={handleBitsGenerated}
            />
          )}
        </div>

        {/* Active Resulting Binary Entropy Stream */}
        <div className="p-5 sm:p-6 rounded-2xl bg-bitpolito/5 dark:bg-white/5 border-2 border-bitpolito/20 dark:border-white/20 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="font-bold text-xs sm:text-sm uppercase tracking-wider text-bitpolito dark:text-white flex items-center gap-2">
                <span>⚡</span>
                <span>{t.streamTitle}</span>
              </div>
              <p className="text-xs text-bitpolito/70 dark:text-white/70 mt-0.5">{t.streamDesc}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyStream}
                disabled={!binaryStream}
                className="text-xs px-3 py-1.5 rounded-xl border border-bitpolito/30 dark:border-white/30 font-semibold hover:bg-bitpolito/10 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
              >
                {copiedStream ? '✓ Copied' : t.btnCopyBits}
              </button>
              <button
                type="button"
                onClick={handleWipe}
                disabled={!binaryStream}
                className="text-xs px-3 py-1.5 rounded-xl border border-red-400/50 text-red-600 dark:text-red-300 font-semibold hover:bg-red-500/10 disabled:opacity-40 cursor-pointer"
              >
                {t.btnWipe}
              </button>
            </div>
          </div>

          {/* Toast */}
          {showWipeToast && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in">
              ✓ {t.wipeNotice}
            </div>
          )}

          <textarea
            rows={3}
            value={binaryStream}
            onChange={handleManualStreamChange}
            placeholder="01010110..."
            className="w-full font-mono text-xs sm:text-sm p-3.5 rounded-xl bg-white dark:bg-white/10 border-2 border-bitpolito/30 dark:border-white/30 focus:border-bitpolito dark:focus:border-white focus:outline-none transition-colors duration-150 text-bitpolito dark:text-white break-all tracking-wider resize-y"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-bitpolito/70 dark:text-white/70 gap-2">
            <span>
              {t.sourceLabel} <b className="font-mono text-bitpolito dark:text-white">{sourceInfo}</b>
            </span>
            <span>
              {t.bitsCount}{' '}
              <b className="font-mono text-bitpolito dark:text-white">
                {binaryStream.length} / {targetBits}
              </b>
              {binaryStream.length >= targetBits ? (
                <span className="text-emerald-500 font-bold ml-1.5">{t.readyNotice}</span>
              ) : (
                <span className="ml-1.5 opacity-70">
                  ({targetBits - binaryStream.length} {t.moreNeeded})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Step-by-Step BIP-39 Mnemonic Conversion */}
        <div className="pt-2 border-t border-bitpolito/20 dark:border-white/20">
          <Bip39StepVisualizer
            lang={lang}
            bits={binaryStream}
            targetWords={targetWords}
          />
        </div>

        {/* Footer Close Button */}
        <div className="flex justify-end pt-4 border-t border-bitpolito/20 dark:border-white/20">
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-bitpolito text-white hover:bg-bitpolito/90 dark:bg-white dark:text-bitpolito dark:hover:bg-white/90 transition-all duration-200 cursor-pointer shadow-md"
            onClick={onBack}
          >
            {t.close}
          </button>
        </div>
      </div>
    </main>
  );
}
