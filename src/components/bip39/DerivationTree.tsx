import { useState } from 'react';
import QRCode from 'react-qr-code';
import { COIN_CONFIG } from './utils/derivationLogic';
import type { BipStandard } from './utils/interface';
import type { DerivationTreeProps } from './utils/interfaceUI';
import IntermediateNodes, { CheckIcon, NodeJunctionDot } from './IntermediateNodes';

const TREE_STRINGS = {
  it: {
    treeTitle: (std: string) => `Grafico ad Albero Gerarchico ${std} (HD Wallet)`,
    treeDesc: (std: string) =>
      `Ogni livello dell'albero corrisponde ad un livello di profondità dell'HD wallet. In ogni nodo è indicato il path secondo lo standard ${std}.`,
    expandAll: 'Espandi tutti i nodi',
    collapseAll: 'Comprimi tutti i nodi',
    depthBadge: 'Profondità',
    copied: 'Copiato!',
    showQr: 'Mostra QR',
    hideQr: 'Nascondi QR',
    qrTitle: 'QR Code Indirizzo',
    doubleClickToCopy: 'Doppio click per copiare l’indirizzo',
    terminalLeavesTitle: (coinName: string, std: string, typeLabel: string) =>
      `Foglie Terminali: Indirizzi ${coinName} (${std} ${typeLabel})`,
    terminalLeavesDesc: (std: string) =>
      `Le ultime foglie dell'albero contengono solo gli indirizzi finali derivati e l'intestazione con il percorso ${std}.`,
    showingRange: 'Mostrando indirizzi:',
    refreshNext10: 'Refresh (Genera altri 10)',
    resetFirst10: 'Torna ai primi 10 (0 - 9)',
    addressLabel: (coinName: string) => `Indirizzo ${coinName}`,
    pathHeader: (std: string) => `Percorso ${std}:`,
  },
  en: {
    treeTitle: (std: string) => `${std} Hierarchical Deterministic Tree Graph`,
    treeDesc: (std: string) =>
      `Each level of the tree corresponds to a depth level of the HD wallet. Each node displays its derivation path according to the ${std} standard.`,
    expandAll: 'Expand all nodes',
    collapseAll: 'Collapse all nodes',
    depthBadge: 'Depth',
    copied: 'Copied!',
    showQr: 'Show QR',
    hideQr: 'Hide QR',
    qrTitle: 'Address QR Code',
    doubleClickToCopy: 'Double-click to copy address',
    terminalLeavesTitle: (coinName: string, std: string, typeLabel: string) =>
      `Terminal Leaves: ${coinName} Addresses (${std} ${typeLabel})`,
    terminalLeavesDesc: (std: string) =>
      `The final leaves of the tree contain only the derived addresses and the ${std} path heading.`,
    showingRange: 'Showing addresses:',
    refreshNext10: 'Refresh (Generate next 10)',
    resetFirst10: 'Reset to first 10 (0 - 9)',
    addressLabel: (coinName: string) => `${coinName} Address`,
    pathHeader: (std: string) => `${std} Path:`,
  },
};

const STANDARD_UI_META: Record<BipStandard, { label: string; addressType: string }> = {
  bip44: { label: 'BIP44', addressType: 'Legacy' },
  bip84: { label: 'BIP84', addressType: 'Native SegWit' },
  bip86: { label: 'BIP86', addressType: 'Taproot' },
};

function QrIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2" />
    </svg>
  );
}

export default function DerivationTree({
  lang,
  standard,
  coin,
  account,
  change,
  onCoinChange,
  onAccountChange,
  onChangeIndexChange,
  intermediateNodes,
  addresses,
  addressOffset,
  onNext10,
  onReset10,
  copiedId,
  onCopy,
  hidePrivateInfo = false,
}: DerivationTreeProps) {
  const t = TREE_STRINGS[lang];
  const { label: stdLabel, addressType } = STANDARD_UI_META[standard];
  const activeCoinConfig = COIN_CONFIG[coin];
  const coinDisplayName =
    lang === 'it' ? activeCoinConfig.addressCoinLabelIt : activeCoinConfig.addressCoinLabelEn;
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
  });
  const [openQrAddresses, setOpenQrAddresses] = useState<Record<string, boolean>>({});

  const toggleQr = (address: string) => {
    setOpenQrAddresses((prev) => ({ ...prev, [address]: !prev[address] }));
  };

  const toggleNode = (depth: number) => {
    if (hidePrivateInfo) return;
    setExpandedNodes((prev) => ({ ...prev, [depth]: !prev[depth] }));
  };

  const expandAll = () => {
    if (hidePrivateInfo) return;
    setExpandedNodes({ 0: true, 1: true, 2: true, 3: true, 4: true });
  };

  const collapseAll = () => {
    setExpandedNodes({ 0: false, 1: false, 2: false, 3: false, 4: false });
  };

  return (
    <div className="w-full mt-8 flex flex-col">
      {/* Tree Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-bitpolito/20 dark:border-white/20">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-bitpolito dark:bg-white animate-pulse" />
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-bitpolito dark:text-white">
              {t.treeTitle(stdLabel)}
            </h3>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-bitpolito/70 dark:text-white/80">
            {t.treeDesc(stdLabel)}
          </p>
        </div>

        {/* Global Expand/Collapse buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            disabled={hidePrivateInfo}
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-bitpolito/30 dark:border-white/30 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
          >
            {t.expandAll}
          </button>
          <button
            type="button"
            disabled={hidePrivateInfo}
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-bitpolito/30 dark:border-white/30 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
          >
            {t.collapseAll}
          </button>
        </div>
      </div>

      {/* Hierarchical Tree Container with Branching Guide */}
      <div className="relative pl-3 sm:pl-6 space-y-6">
        <div className="absolute left-[19px] sm:left-[31px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-bitpolito/40 via-bitpolito/30 to-bitpolito/20 dark:from-white/40 dark:via-white/30 dark:to-white/20" />

        {/* Intermediate Levels (Depth 0 to 4) */}
        <IntermediateNodes
          lang={lang}
          standard={standard}
          coin={coin}
          account={account}
          change={change}
          onCoinChange={onCoinChange}
          onAccountChange={onAccountChange}
          onChangeIndexChange={onChangeIndexChange}
          intermediateNodes={intermediateNodes}
          expandedNodes={expandedNodes}
          onToggleNode={toggleNode}
          copiedId={copiedId}
          onCopy={onCopy}
          hidePrivateInfo={hidePrivateInfo}
        />

        {/* Level 5: Address Leaves Section */}
        <div className="relative flex items-start gap-3 sm:gap-4 pt-2 group">
          {/* Node Junction Dot for Leaves Branch */}
          <NodeJunctionDot marginTopClass="mt-5" />

          {/* Leaves Container Card */}
          <div className="flex-1 bg-white dark:bg-white/10 border-2 border-bitpolito dark:border-white rounded-3xl p-5 sm:p-7 shadow-md">
            {/* Leaves Header & Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bitpolito/20 dark:border-white/20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-bitpolito/10 text-bitpolito dark:bg-white/20 dark:text-white">
                    {t.depthBadge} 5
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-bitpolito dark:text-white">
                    {t.terminalLeavesTitle(coinDisplayName, stdLabel, addressType)}
                  </h4>
                </div>
                <p className="mt-1 text-xs text-bitpolito/70 dark:text-white/70">
                  {t.terminalLeavesDesc(stdLabel)}
                </p>
              </div>

              {/* Controls: Current Range & Refresh Button */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-bitpolito/10 dark:bg-white/15 text-bitpolito dark:text-white border border-bitpolito/20 dark:border-white/20">
                  {t.showingRange} #{addressOffset} — #{addressOffset + addresses.length - 1}
                </span>

                {addressOffset > 0 && (
                  <button
                    type="button"
                    onClick={onReset10}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-bitpolito/30 dark:border-white/30 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
                  >
                    {t.resetFirst10}
                  </button>
                )}

                {/* Refresh button to generate next 10 addresses */}
                <button
                  type="button"
                  onClick={onNext10}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-bitpolito text-white hover:bg-bitpolito/90 dark:bg-white dark:text-bitpolito dark:hover:bg-white/90 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span className="text-sm">↻</span>
                  <span>{t.refreshNext10}</span>
                </button>
              </div>
            </div>

            {/* Address Leaves Grid */}
            <div className="mt-5 grid grid-cols-1 gap-3">
              {addresses.map((leaf) => {
                const copyId = `leaf-addr-${leaf.index}`;
                const isQrOpen = !!openQrAddresses[leaf.address];
                return (
                  <div
                    key={leaf.index}
                    className="relative flex flex-col p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-black/25 border border-bitpolito/25 dark:border-white/20 hover:border-bitpolito dark:hover:border-white transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Path Header and Index */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-bitpolito/10 text-bitpolito dark:bg-white/20 dark:text-white">
                            #{leaf.index}
                          </span>
                          <span className="text-xs font-medium text-bitpolito/70 dark:text-white/70">
                            {t.pathHeader(stdLabel)}
                          </span>
                          <span className="font-mono text-xs font-bold text-bitpolito dark:text-white">
                            {leaf.path}
                          </span>
                        </div>

                        {/* Right/Bottom: Derived Address (double-click to copy) */}
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-bitpolito/80 dark:text-white/80 shrink-0">
                            {t.addressLabel(coinDisplayName)}:
                          </span>
                          <span
                            onDoubleClick={() => onCopy(leaf.address, copyId)}
                            title={t.doubleClickToCopy}
                            className="font-mono text-xs sm:text-sm font-extrabold text-bitpolito dark:text-white break-all select-all cursor-pointer hover:underline decoration-bitpolito/40 dark:decoration-white/40 underline-offset-4"
                          >
                            {leaf.address}
                          </span>
                          {copiedId === copyId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 animate-in fade-in">
                              <CheckIcon />
                              <span>{t.copied}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Show QR Button */}
                      <div className="self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleQr(leaf.address)}
                          aria-expanded={isQrOpen}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-white/10 border border-bitpolito/30 dark:border-white/30 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          <QrIcon />
                          <span>{isQrOpen ? t.hideQr : t.showQr}</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable QR Code panel */}
                    {isQrOpen && (
                      <div className="mt-3 pt-3 border-t border-bitpolito/15 dark:border-white/15 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in duration-150">
                        <div className="p-3 rounded-2xl bg-white border border-bitpolito/20 shadow-xs shrink-0">
                          <QRCode
                            value={leaf.address}
                            size={140}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                            level="M"
                            title={leaf.address}
                          />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xs font-bold text-bitpolito dark:text-white">
                            {t.qrTitle} #{leaf.index} ({leaf.path})
                          </p>
                          <p
                            onDoubleClick={() => onCopy(leaf.address, copyId)}
                            title={t.doubleClickToCopy}
                            className="mt-1 font-mono text-[11px] break-all text-bitpolito/80 dark:text-white/80 select-all cursor-pointer"
                          >
                            {leaf.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
