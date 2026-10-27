import { useState, useEffect } from 'react';
import './App.css';

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
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <div className="header-brand">
          <img
            src={isDark ? '/bitpolito/cow-icon-white.svg' : '/bitpolito/cow-icon-blue.svg'}
            alt="BitPolito"
            className="brand-icon"
          />
          <h1 className="brand-title">{t.siteTitle}</h1>
        </div>

        <div className="header-controls">
          {/* Language Toggle */}
          <div
            className="lang-toggle-group"
            role="group"
            aria-label={t.langToggleAria}
          >
            <button
              type="button"
              className={`lang-btn ${lang === 'it' ? 'active' : ''}`}
              onClick={() => setLang('it')}
              aria-pressed={lang === 'it'}
            >
              IT
            </button>
            <button
              type="button"
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
          </div>

          {/* Dark Mode Toggle (Blue & White Inverted) */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? t.lightModeAria : t.darkModeAria}
            title={isDark ? t.lightModeAria : t.darkModeAria}
          >
            <img
              src={isDark ? '/icons/icon-sun.svg' : '/icons/icon-moon.svg'}
              alt={isDark ? 'Sun icon' : 'Moon icon'}
              className="theme-icon"
            />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT - Simply Two Buttons */}
      <main className="main-content">
        <div className="buttons-container">
          <button
            type="button"
            className="tool-card-btn"
            onClick={() => setActiveModal('entropy')}
          >
            <div className="tool-btn-icon-wrapper">
              <img
                src="/icons/icon-microscope.svg"
                alt="Microscope icon"
                className="tool-btn-icon"
              />
            </div>
            <div className="tool-btn-text">
              <span className="tool-btn-title">{t.entropyVisualizer}</span>
              <span className="tool-btn-subtitle">{t.entropySubtitle}</span>
            </div>
          </button>

          <button
            type="button"
            className="tool-card-btn"
            onClick={() => setActiveModal('ian-coleman')}
          >
            <div className="tool-btn-icon-wrapper">
              <img
                src="/icons/icon-key.svg"
                alt="Key icon"
                className="tool-btn-icon"
              />
            </div>
            <div className="tool-btn-text">
              <span className="tool-btn-title">{t.ianColemanTool}</span>
              <span className="tool-btn-subtitle">{t.ianColemanSubtitle}</span>
            </div>
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        {/* Cows Symbol */}
        <div className="footer-cows" aria-label={t.cowsAria}>
          <img
            src={isDark ? '/bitpolito/cow-bull-white.svg' : '/bitpolito/cow-bull-blue.svg'}
            alt="BitPolito Cows"
            className="cows-symbol-img"
          />
        </div>

        {/* Social Links */}
        <div className="social-links-row" role="navigation" aria-label="BitPolito Socials">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn"
              aria-label={social.name}
              title={social.name}
            >
              <img
                src={social.icon}
                alt={social.name}
                className="social-icon"
              />
            </a>
          ))}
        </div>

        <p className="footer-credits">
          <a
            href="https://bitpolito.it"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            {t.footerTeam}
          </a>
        </p>
      </footer>

      {/* INTERACTIVE MODAL */}
      {activeModal && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {activeModal === 'entropy' ? t.modalEntropyTitle : t.modalIanColemanTitle}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
                aria-label={t.close}
              >
                ✕
              </button>
            </div>
            <p className="modal-desc">
              {activeModal === 'entropy' ? t.modalEntropyDesc : t.modalIanColemanDesc}
            </p>
            <div className="modal-badge-container">
              <span className="modal-badge">{t.statusNotice}</span>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-action-btn"
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
