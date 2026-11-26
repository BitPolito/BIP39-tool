import type {
  BipStandard,
  ChangeIndex,
  CoinId,
  MnemonicLanguage,
} from './interface';
import type { BranchKey } from './interfaceUI';

export function getBranchKey(
  standard: BipStandard,
  coin: CoinId,
  account: number,
  change: ChangeIndex,
): BranchKey {
  return `${standard}:${coin}:${account}:${change}`;
}

export const MNEMONIC_LANGUAGE_OPTIONS: { id: MnemonicLanguage; label: string }[] = [
  { id: 'english', label: 'English' },
  { id: 'japanese', label: '日本語 (Japanese)' },
  { id: 'spanish', label: 'Español' },
  { id: 'simplified-chinese', label: '中文(简体) (Simplified Chinese)' },
  { id: 'traditional-chinese', label: '中文(繁體) (Traditional Chinese)' },
  { id: 'french', label: 'Français' },
  { id: 'italian', label: 'Italiano' },
  { id: 'korean', label: '한국어 (Korean)' },
  { id: 'czech', label: 'Čeština' },
  { id: 'portuguese', label: 'Português' },
];

export const STANDARD_OPTIONS: { id: BipStandard; label: string }[] = [
  { id: 'bip44', label: 'BIP44' },
  { id: 'bip84', label: 'BIP84 (SegWit)' },
  { id: 'bip86', label: 'BIP86 (Taproot)' },
];

export const BIP_SPECS: { label: string; url: string; separatorAfter?: string }[] = [
  {
    label: 'BIP39',
    url: 'https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki',
    separatorAfter: '•',
  },
  {
    label: 'BIP32',
    url: 'https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki',
    separatorAfter: '•',
  },
  {
    label: 'BIP44',
    url: 'https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki',
    separatorAfter: '/',
  },
  {
    label: 'BIP84',
    url: 'https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki',
    separatorAfter: '/',
  },
  {
    label: 'BIP86',
    url: 'https://github.com/bitcoin/bips/blob/master/bip-0086.mediawiki',
  },
];

export const CONTENT = {
  it: {
    back: 'Torna alla home',
    close: 'Chiudi',
    title: 'Strumento Ian Coleman',
    subtitle: 'BIP39 Seed e Derivazione Albero BIP44 / BIP84 / BIP86',
    desc: 'Strumento didattico e standalone per la generazione di frasi seed BIP39, il calcolo della root BIP32 e la visualizzazione ad albero gerarchico deterministico (BIP44 Legacy / BIP84 SegWit / BIP86 Taproot).',
    bipLinkTitle: (label: string) => `Specifica ${label} su GitHub`,
    standardToggleAria: 'Seleziona standard di derivazione indirizzi (BIP44, BIP84 o BIP86)',
    warningTitle: 'Avvertimento di sicurezza: non usare con fondi reali',
    warningMessage:
      'Non utilizzare gli indirizzi o le chiavi generati da questo strumento: la diffusione o condivisione dei dati presenti in questa pagina (chiavi private, seed phrase) comporterà la perdita irrecuperabile dei propri coins. Questo strumento è pensato unicamente a scopo didattico e dimostrativo.',
    wordCountLabel: 'Lunghezza frase mnemonica (12 o 24 parole):',
    mnemonicLangLabel: 'Lingua mnemonica:',
    words12: '12 parole (128 bit)',
    words24: '24 parole (256 bit)',
    generateBtn: 'Genera',
    generating: 'Calcolo in corso...',
    wipeBtn: 'Pulisci Cache (Wipe)',
    wipedNotice: 'Cache e dati privati azzerati con successo.',
    hidePrivateInfo: 'Nascondi tutte le informazioni private',
    hidePrivateInfoDesc: 'Nasconde mnemonica, seed e impedisce di espandere i passi da depth 0 a 4.',
    customMnemonicTitle: 'Inserisci Seed Phrase personalizzata',
    customMnemonicDesc: (count: number, langLabel: string) =>
      `Inserisci ${count} parole del dizionario ${langLabel} nei campi separati (puoi anche incollare l’intera frase nel primo campo).`,
    customMnemonicToggle: 'Usa seed phrase personalizzata',
    customMnemonicClear: 'Svuota',
    customMnemonicGenerateEntropy: 'Genera entropia',
    customMnemonicWords12: '12 parole',
    customMnemonicWords24: '24 parole',
    customMnemonicWordPlaceholder: (idx: number) => `Parola ${idx + 1}`,
    customMnemonicStatusCount: (filled: number, total: number) => `${filled} / ${total} parole`,
    customMnemonicStatusIncomplete: (filled: number, total: number) =>
      `Inserisci tutte le ${total} parole per calcolare il portafoglio (${filled}/${total}).`,
    customMnemonicStatusInvalidWords: (indices: number[]) =>
      `Parole non presenti nel dizionario BIP39: #${indices.map((i) => i + 1).join(', #')}.`,
    customMnemonicStatusBadChecksum:
      'Checksum BIP39 non valido: controlla l’ordine o le parole inserite.',
    customMnemonicStatusValid:
      'Seed phrase BIP39 valida — usata nei calcoli al posto della frase generata.',
    privateInfoHiddenTitle: 'Informazioni private nascoste',
    privateInfoHiddenDesc:
      'Frase mnemonica, seed BIP39 e chiavi nei passi depth 0–4 sono nascosti. Sono visibili solo gli indirizzi finali.',
    mnemonicTitle: 'Frase Mnemonica BIP39 Generata',
    mnemonicDesc: (langLabel: string) =>
      `12 o 24 parole conformi al dizionario standard BIP39 (${langLabel}).`,
    copyMnemonic: 'Copia Mnemonica',
    seedTitle: 'BIP39 Seed (512-bit Hex)',
    seedDesc: 'Derivato dalla mnemonica tramite HMAC-SHA512 con 2048 iterazioni di PBKDF2.',
    copySeed: 'Copia Seed',
    rootXprvTitle: 'BIP32 Root Extended Private Key (xprv)',
    rootXpubTitle: 'BIP32 Root Extended Public Key (xpub)',
    copyXprv: 'Copia xprv',
    copyXpub: 'Copia xpub',
    copy: 'Copia',
    copied: 'Copiato!',
    emptyTitle: 'Genera un nuovo portafoglio deterministico',
    emptyDesc:
      'Imposta la lunghezza desiderata (12 o 24 parole) e premi "Genera" per calcolare il seed BIP39, la root BIP32 e visualizzare il grafico ad albero gerarchico BIP44 / BIP84 / BIP86.',
  },
  en: {
    back: 'Back to home',
    close: 'Close',
    title: 'Ian Coleman Tool',
    subtitle: 'BIP39 Seed and BIP44 / BIP84 / BIP86 Tree Derivation',
    desc: 'Educational and standalone tool for BIP39 mnemonic generation, BIP32 root key calculation, and hierarchical deterministic tree visualization per BIP44 (Legacy), BIP84 (Native SegWit), and BIP86 (Taproot).',
    bipLinkTitle: (label: string) => `${label} specification on GitHub`,
    standardToggleAria: 'Select address derivation standard (BIP44, BIP84, or BIP86)',
    warningTitle: 'Security Warning: do not use with real funds',
    warningMessage:
      'Do not use the addresses or keys generated by this tool: any exposure or disclosure of the data on this page (private keys, seed phrase) will result in the permanent loss of your coins. This tool is intended solely for educational and testing purposes.',
    wordCountLabel: 'Mnemonic length (12 or 24 words):',
    mnemonicLangLabel: 'Mnemonic language:',
    words12: '12 words (128 bits)',
    words24: '24 words (256 bits)',
    generateBtn: 'Generate',
    generating: 'Calculating...',
    wipeBtn: 'Wipe Cache',
    wipedNotice: 'Cache and private data wiped successfully.',
    hidePrivateInfo: 'Hide all private info',
    hidePrivateInfoDesc: 'Hides mnemonic, seed, and prevents expanding steps from depth 0 to 4.',
    customMnemonicTitle: 'Enter Custom Seed Phrase',
    customMnemonicDesc: (count: number, langLabel: string) =>
      `Enter ${count} words from the ${langLabel} wordlist in the separate fields (you can also paste the full phrase into the first field).`,
    customMnemonicToggle: 'Use custom seed phrase',
    customMnemonicClear: 'Clear',
    customMnemonicGenerateEntropy: 'Generate entropy',
    customMnemonicWords12: '12 words',
    customMnemonicWords24: '24 words',
    customMnemonicWordPlaceholder: (idx: number) => `Word ${idx + 1}`,
    customMnemonicStatusCount: (filled: number, total: number) => `${filled} / ${total} words`,
    customMnemonicStatusIncomplete: (filled: number, total: number) =>
      `Enter all ${total} words to derive the wallet (${filled}/${total}).`,
    customMnemonicStatusInvalidWords: (indices: number[]) =>
      `Words not in BIP39 wordlist: #${indices.map((i) => i + 1).join(', #')}.`,
    customMnemonicStatusBadChecksum:
      'Invalid BIP39 checksum: check word order or spelling.',
    customMnemonicStatusValid:
      'Valid BIP39 seed phrase — used in calculations instead of the generated phrase.',
    privateInfoHiddenTitle: 'Private information hidden',
    privateInfoHiddenDesc:
      'Mnemonic phrase, BIP39 seed, and keys in depth 0–4 steps are hidden. Only the final addresses are shown.',
    mnemonicTitle: 'Generated BIP39 Mnemonic Phrase',
    mnemonicDesc: (langLabel: string) =>
      `12 or 24 words conforming to the standard BIP39 dictionary (${langLabel}).`,
    copyMnemonic: 'Copy Mnemonic',
    seedTitle: 'BIP39 Seed (512-bit Hex)',
    seedDesc: 'Derived from mnemonic using PBKDF2 HMAC-SHA512 with 2048 iterations.',
    copySeed: 'Copy Seed',
    rootXprvTitle: 'BIP32 Root Extended Private Key (xprv)',
    rootXpubTitle: 'BIP32 Root Extended Public Key (xpub)',
    copyXprv: 'Copy xprv',
    copyXpub: 'Copy xpub',
    copy: 'Copy',
    copied: 'Copied!',
    emptyTitle: 'Generate a new hierarchical wallet',
    emptyDesc:
      'Choose the mnemonic length (12 or 24 words) and click "Generate" to compute the BIP39 seed, BIP32 root, and render the BIP44 / BIP84 / BIP86 tree graph.',
  },
};
