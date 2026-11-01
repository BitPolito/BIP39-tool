import { useState, useEffect } from 'react';

type Language = 'it' | 'en';
type Theme = 'light' | 'dark';

interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'Telegram',
    url: 'https://t.me/bitpolito',
    icon: '/icons/icon-telegram.svg',
  },
  {
    name: 'X',
    url: 'https://www.x.com/bitpolito',
    icon: '/icons/icon-x.svg',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/bitpolito/',
    icon: '/icons/icon-instagram.svg',
  },
  {
    name: 'GitHub',
    url: 'https://github.com/BitPolito',
    icon: '/icons/icon-github.svg',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/bitpolito/?originalSubdomain=it',
    icon: '/icons/icon-linkedin.svg',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@BitPolito',
    icon: '/icons/icon-youtube.svg',
  },
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/show/3xXqSrkyLloGhTozWMnuhH',
    icon: '/icons/icon-spotify.svg',
  },
  {
    name: 'Email',
    url: 'mailto:info@bitpolito.it',
    icon: '/icons/icon-email.svg',
  },
];

const CONTENT = {
  it: {
    siteTitle: 'bip39 tool',
    entropyVisualizer: 'visualizzatore di entropia',
    ianColemanTool: 'strumento ian coleman',
    entropySubtitle: "Generatore ed esploratore dell'entropia BIP39",
    ianColemanSubtitle: 'Conversione mnemonica e derivazione chiavi',
    darkModeAria: 'Attiva modalità scura (blu e bianco)',
    lightModeAria: 'Attiva modalità chiara (bianco e blu)',
    langToggleAria: 'Cambia lingua',
    modalEntropyTitle: 'Visualizzatore di Entropia',
    modalEntropyDesc:
      "Modulo interattivo per comprendere e visualizzare l'entropia BIP39 attraverso lanci di monete, tiri di dadi e dati crittografici pseudocasuali.",
    modalIanColemanTitle: 'Strumento Ian Coleman',
    modalIanColemanDesc:
      'Strumento standalone completo per la generazione di frasi seed BIP39 e il calcolo dei percorsi di derivazione per chiavi private e indirizzi.',
    statusNotice: 'Modulo in fase di sviluppo',
    close: 'Chiudi',
    footerTeam: 'BitPolito • Team Studentesco Bitcoin @ Politecnico di Torino',
    cowsAria: 'Simbolo delle mucche BitPolito',
  },
  en: {
    siteTitle: 'bip39 tool',
    entropyVisualizer: 'entropy visualizer',
    ianColemanTool: 'ian coleman tool',
    entropySubtitle: 'BIP39 entropy generator and visualizer',
    ianColemanSubtitle: 'BIP39 mnemonic and key derivation tool',
    darkModeAria: 'Switch to dark mode (blue & white)',
    lightModeAria: 'Switch to light mode (white & blue)',
    langToggleAria: 'Switch language',
    modalEntropyTitle: 'Entropy Visualizer',
    modalEntropyDesc:
      'Interactive module to visualize and generate BIP39 entropy using coin flips, dice rolls, and cryptographic pseudorandom data.',
    modalIanColemanTitle: 'Ian Coleman Tool',
    modalIanColemanDesc:
      'Comprehensive standalone tool for BIP39 mnemonic seed generation, derivation paths, and address calculation.',
    statusNotice: 'Module under development',
    close: 'Close',
    footerTeam: 'BitPolito • Bitcoin Student Team @ Politecnico di Torino',
    cowsAria: 'BitPolito Cows Symbol',
  },
};

function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('bitpolito_lang');
    if (saved === 'it' || saved === 'en') return saved;
    return navigator.language.startsWith('it') ? 'it' : 'en';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('bitpolito_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [activeModal, setActiveModal] = useState<'entropy' | 'ian-coleman' | null>(null);

  useEffect(() => {
    localStorage.setItem('bitpolito_lang', lang);
    document.documentElement.lang = lang;
    document.title = `${CONTENT[lang].siteTitle} • BitPolito`;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('bitpolito_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const t = CONTENT[lang];
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen w-full bg-[#F9F9F9] dark:bg-bitpolito text-bitpolito dark:text-white transition-colors duration-250 flex flex-col justify-between">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-6 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="flex items-center justify-between py-6 border-b border-bitpolito/20 dark:border-white/25 transition-colors duration-250">
          <div className="flex items-center gap-3 select-none group cursor-pointer">
            <img
              src={isDark ? '/bitpolito/cow-icon-white.svg' : '/bitpolito/cow-icon-blue.svg'}
              alt="BitPolito"
              className="w-9 h-9 object-contain transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6"
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight lowercase leading-none text-bitpolito dark:text-white transition-colors duration-250">
              {t.siteTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div
              className="inline-flex items-center bg-white dark:bg-white/10 border border-bitpolito/25 dark:border-white/40 rounded-full p-1 shadow-sm transition-all duration-250"
              role="group"
              aria-label={t.langToggleAria}
            >
              <button
                type="button"
                className={`rounded-full px-3.5 py-1 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  lang === 'it'
                    ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-sm'
                    : 'text-bitpolito/70 hover:text-bitpolito dark:text-white/80 dark:hover:text-white'
                }`}
                onClick={() => setLang('it')}
                aria-pressed={lang === 'it'}
              >
                IT
              </button>
              <button
                type="button"
                className={`rounded-full px-3.5 py-1 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  lang === 'en'
                    ? 'bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-sm'
                    : 'text-bitpolito/70 hover:text-bitpolito dark:text-white/80 dark:hover:text-white'
                }`}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
            </div>

            {/* Dark Mode Toggle (Blue & White Inverted) */}
            <button
              type="button"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-white/10 border border-bitpolito/25 dark:border-white/40 shadow-sm cursor-pointer hover:bg-bitpolito hover:border-bitpolito dark:hover:bg-white dark:hover:border-white transition-all duration-200 group"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? t.lightModeAria : t.darkModeAria}
              title={isDark ? t.lightModeAria : t.darkModeAria}
            >
              <img
                src={isDark ? '/icons/icon-sun.svg' : '/icons/icon-moon.svg'}
                alt={isDark ? 'Sun icon' : 'Moon icon'}
                className={`w-5 h-5 object-contain transition-all duration-250 group-hover:rotate-12 ${
                  isDark
                    ? 'brightness-0 invert group-hover:filter-none'
                    : 'group-hover:brightness-0 group-hover:invert'
                }`}
              />
            </button>
          </div>
        </header>

        {/* MAIN CONTENT - Simply Two Buttons */}
        <main className="flex-1 flex flex-col items-center justify-center py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-7 w-full max-w-3xl">
            {/* Entropy Visualizer */}
            <button
              type="button"
              className="group flex-1 w-full sm:w-auto flex items-center justify-center gap-4 sm:gap-5 p-6 sm:p-7 min-h-[96px] sm:min-h-[104px] rounded-2xl bg-white border-2 border-bitpolito shadow-lg hover:bg-bitpolito hover:border-bitpolito hover:-translate-y-1 hover:shadow-xl dark:bg-white/10 dark:border-white dark:hover:bg-white dark:hover:border-white transition-all duration-250 cursor-pointer"
              onClick={() => setActiveModal('entropy')}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-bitpolito/10 group-hover:bg-white/20 dark:bg-white/15 dark:group-hover:bg-bitpolito/10 transition-colors duration-250">
                <img
                  src="/icons/icon-microscope.svg"
                  alt="Microscope icon"
                  className="w-6 h-6 object-contain transition-transform duration-250 group-hover:scale-110 group-hover:brightness-0 group-hover:invert dark:brightness-0 dark:invert dark:group-hover:filter-none"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl sm:text-2xl font-extrabold lowercase text-bitpolito group-hover:text-white dark:text-white dark:group-hover:text-bitpolito transition-colors duration-250 leading-tight">
                  {t.entropyVisualizer}
                </span>
                <span className="text-xs sm:text-sm font-medium mt-1 text-bitpolito/70 group-hover:text-white/90 dark:text-white/80 dark:group-hover:text-bitpolito/80 transition-colors duration-250">
                  {t.entropySubtitle}
                </span>
              </div>
            </button>

            {/* Ian Coleman Tool */}
            <button
              type="button"
              className="group flex-1 w-full sm:w-auto flex items-center justify-center gap-4 sm:gap-5 p-6 sm:p-7 min-h-[96px] sm:min-h-[104px] rounded-2xl bg-white border-2 border-bitpolito shadow-lg hover:bg-bitpolito hover:border-bitpolito hover:-translate-y-1 hover:shadow-xl dark:bg-white/10 dark:border-white dark:hover:bg-white dark:hover:border-white transition-all duration-250 cursor-pointer"
              onClick={() => setActiveModal('ian-coleman')}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-bitpolito/10 group-hover:bg-white/20 dark:bg-white/15 dark:group-hover:bg-bitpolito/10 transition-colors duration-250">
                <img
                  src="/icons/icon-key.svg"
                  alt="Key icon"
                  className="w-6 h-6 object-contain transition-transform duration-250 group-hover:scale-110 group-hover:brightness-0 group-hover:invert dark:brightness-0 dark:invert dark:group-hover:filter-none"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl sm:text-2xl font-extrabold lowercase text-bitpolito group-hover:text-white dark:text-white dark:group-hover:text-bitpolito transition-colors duration-250 leading-tight">
                  {t.ianColemanTool}
                </span>
                <span className="text-xs sm:text-sm font-medium mt-1 text-bitpolito/70 group-hover:text-white/90 dark:text-white/80 dark:group-hover:text-bitpolito/80 transition-colors duration-250">
                  {t.ianColemanSubtitle}
                </span>
              </div>
            </button>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-center py-8 border-t border-bitpolito/20 dark:border-white/25 gap-5 transition-colors duration-250">
          {/* Cows Symbol */}
          <div className="flex items-center justify-center select-none" aria-label={t.cowsAria}>
            <img
              src={isDark ? '/bitpolito/cow-bull-white.svg' : '/bitpolito/cow-bull-blue.svg'}
              alt="BitPolito Cows"
              className="w-36 sm:w-40 h-auto object-contain transition-transform duration-250 hover:scale-105"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Social Links */}
          <div
            className="flex items-center justify-center gap-3 flex-wrap"
            role="navigation"
            aria-label="BitPolito Socials"
          >
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-white/10 border border-bitpolito/25 dark:border-white/40 shadow-sm hover:bg-bitpolito hover:border-bitpolito hover:-translate-y-1 dark:hover:bg-white dark:hover:border-white transition-all duration-200 group"
                aria-label={social.name}
                title={social.name}
              >
                <img
                  src={social.icon}
                  alt={social.name}
                  className="w-4 h-4 object-contain transition-all duration-200 group-hover:scale-110 group-hover:brightness-0 group-hover:invert dark:brightness-0 dark:invert dark:group-hover:filter-none"
                />
              </a>
            ))}
          </div>

          <p className="m-0 text-xs sm:text-sm font-medium text-bitpolito/75 dark:text-white/85 text-center">
            <a
              href="https://bitpolito.it"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-250"
            >
              {t.footerTeam}
            </a>
          </p>
        </footer>
      </div>

      {/* INTERACTIVE MODAL */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-5 z-50 animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-bitpolito border-2 border-bitpolito dark:border-white rounded-3xl p-7 sm:p-8 shadow-2xl text-bitpolito dark:text-white transition-colors duration-250"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-bitpolito dark:text-white">
                {activeModal === 'entropy' ? t.modalEntropyTitle : t.modalIanColemanTitle}
              </h2>
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-bitpolito/10 dark:hover:bg-white/15 text-bitpolito dark:text-white transition-colors duration-150 cursor-pointer"
                onClick={() => setActiveModal(null)}
                aria-label={t.close}
              >
                ✕
              </button>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-bitpolito/80 dark:text-white/90 mb-5">
              {activeModal === 'entropy' ? t.modalEntropyDesc : t.modalIanColemanDesc}
            </p>
            <div className="mb-6">
              <span className="inline-block text-xs font-bold px-3.5 py-1.5 rounded-full bg-bitpolito/10 text-bitpolito border border-bitpolito/20 dark:bg-white/15 dark:text-white dark:border-white/30">
                {t.statusNotice}
              </span>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-bitpolito text-white hover:bg-bitpolito/90 dark:bg-white dark:text-bitpolito dark:hover:bg-white/90 transition-all duration-200 cursor-pointer shadow-md"
                onClick={() => setActiveModal(null)}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
