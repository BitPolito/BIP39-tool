import { useState } from 'react';
import type { Language } from '../../App';
import type { IntermediateNodeData, AddressLeafData } from '../../crypto/bip44';

interface Bip44TreeProps {
  lang: Language;
  intermediateNodes: IntermediateNodeData[];
  addresses: AddressLeafData[];
  addressOffset: number;
  onNext10: () => void;
  onReset10: () => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}

const TREE_STRINGS = {
  it: {
    treeTitle: 'Grafico ad Albero Gerarchico BIP44 (HD Wallet)',
    treeDesc:
      'Ogni livello dell\'albero corrisponde ad un livello di profondità dell\'HD wallet. In ogni nodo è indicato il path secondo lo standard BIP44.',
    expandNode: 'Espandi (Chiave Privata & Chain Code)',
    collapseNode: 'Nascondi dettagli',
    expandAll: 'Espandi tutti i nodi',
    collapseAll: 'Comprimi tutti i nodi',
    depthBadge: 'Profondità',
    privKeyHex: 'Chiave Privata (Hex)',
    privKeyWif: 'Chiave Privata (WIF)',
    chainCode: 'Chain Code (Hex)',
    xprv: 'Chiave Estesa Privata (xprv)',
    xpub: 'Chiave Estesa Pubblica (xpub)',
    copy: 'Copia',
    copied: 'Copiato!',
    terminalLeavesTitle: 'Foglie Terminali: Indirizzi Bitcoin (BIP44)',
    terminalLeavesDesc:
      'Le ultime foglie dell\'albero contengono solo gli indirizzi Bitcoin finali derivati e l\'intestazione con il percorso BIP44.',
    showingRange: 'Mostrando indirizzi:',
    refreshNext10: 'Refresh (Genera altri 10)',
    resetFirst10: 'Torna ai primi 10 (0 - 9)',
    addressLabel: 'Indirizzo Bitcoin',
    pathHeader: 'Percorso BIP44:',
    levelNames: {
      root: 'Radice Master (m)',
      purpose: "Purpose (44')",
      coinType: "Coin Type (0' Bitcoin)",
      account: "Account (0' Primario)",
      change: 'Change (0 Ricezione Esterna)',
    },
  },
  en: {
    treeTitle: 'BIP44 Hierarchical Deterministic Tree Graph',
    treeDesc:
      'Each level of the tree corresponds to a depth level of the HD wallet. Each node displays its derivation path according to the BIP44 standard.',
    expandNode: 'Expand (Private Key & Chain Code)',
    collapseNode: 'Hide details',
    expandAll: 'Expand all nodes',
    collapseAll: 'Collapse all nodes',
    depthBadge: 'Depth',
    privKeyHex: 'Private Key (Hex)',
    privKeyWif: 'Private Key (WIF)',
    chainCode: 'Chain Code (Hex)',
    xprv: 'Extended Private Key (xprv)',
    xpub: 'Extended Public Key (xpub)',
    copy: 'Copy',
    copied: 'Copied!',
    terminalLeavesTitle: 'Terminal Leaves: Bitcoin Addresses (BIP44)',
    terminalLeavesDesc:
      'The final leaves of the tree contain only the derived Bitcoin addresses and the BIP44 path heading.',
    showingRange: 'Showing addresses:',
    refreshNext10: 'Refresh (Generate next 10)',
    resetFirst10: 'Reset to first 10 (0 - 9)',
    addressLabel: 'Bitcoin Address',
    pathHeader: 'BIP44 Path:',
    levelNames: {
      root: 'Master Root (m)',
      purpose: "Purpose (44')",
      coinType: "Coin Type (0' Bitcoin)",
      account: "Account (0' Primary)",
      change: 'Change (0 External / Receive)',
    },
  },
};

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Bip44Tree({
  lang,
  intermediateNodes,
  addresses,
  addressOffset,
  onNext10,
  onReset10,
  copiedId,
  onCopy,
}: Bip44TreeProps) {
  const t = TREE_STRINGS[lang];
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const toggleNode = (depth: number) => {
    setExpandedNodes((prev) => ({ ...prev, [depth]: !prev[depth] }));
  };

  const expandAll = () => {
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
              {t.treeTitle}
            </h3>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-bitpolito/70 dark:text-white/80">
            {t.treeDesc}
          </p>
        </div>

        {/* Global Expand/Collapse buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-bitpolito/30 dark:border-white/30 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
          >
            {t.expandAll}
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-bitpolito/30 dark:border-white/30 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
          >
            {t.collapseAll}
          </button>
        </div>
      </div>

      {/* Hierarchical Tree Container with Branching Guide */}
      <div className="relative pl-3 sm:pl-6 space-y-6">
        {/* Continuous vertical trunk line connecting intermediate levels */}
        <div className="absolute left-[19px] sm:left-[31px] top-4 bottom-24 w-0.5 bg-gradient-to-b from-bitpolito/40 via-bitpolito/30 to-bitpolito/20 dark:from-white/40 dark:via-white/30 dark:to-white/20" />

        {/* Intermediate Levels (Depth 0 to 4) */}
        {intermediateNodes.map((node) => {
          const isExpanded = !!expandedNodes[node.depth];
          const levelName = t.levelNames[node.nameKey];
          const desc = lang === 'it' ? node.descIt : node.descEn;

          return (
            <div key={node.depth} className="relative flex items-start gap-3 sm:gap-4 group">
              {/* Node Junction Dot */}
              <div className="relative z-10 mt-4 -ml-2.5 sm:-ml-2.5 w-5 h-5 rounded-full bg-white dark:bg-bitpolito border-2 border-bitpolito dark:border-white flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110">
                <div className="w-2 h-2 rounded-full bg-bitpolito dark:bg-white" />
              </div>

              {/* Node Card */}
              <div className="flex-1 bg-white/70 dark:bg-white/5 border-2 border-bitpolito/40 dark:border-white/30 rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-bitpolito dark:hover:border-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Depth Badge */}
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-bitpolito/10 text-bitpolito dark:bg-white/20 dark:text-white">
                      {t.depthBadge} {node.depth}
                    </span>

                    {/* Level Name */}
                    <span className="text-sm sm:text-base font-extrabold text-bitpolito dark:text-white">
                      {levelName}
                    </span>

                    {/* BIP44 Path Tag */}
                    <span className="font-mono text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-md bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-xs">
                      {node.path}
                    </span>

                    {node.isHardened && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/30">
                        Hardened
                      </span>
                    )}
                  </div>

                  {/* Expand/Collapse Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleNode(node.depth)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-white/10 border border-bitpolito/30 dark:border-white/30 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-all cursor-pointer shadow-xs self-start sm:self-auto"
                  >
                    <span>{isExpanded ? t.collapseNode : t.expandNode}</span>
                    <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                </div>

                {/* Level Educational Description */}
                <p className="mt-2 text-xs sm:text-sm text-bitpolito/70 dark:text-white/70 leading-relaxed">
                  {desc}
                </p>

                {/* Expanded Details: Private Key & Chain Code (Requirement 5) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-bitpolito/20 dark:border-white/20 space-y-3 animate-in fade-in duration-200">
                    {/* Private Key (Hex) */}
                    {node.privateKeyHex && (
                      <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-bitpolito/20 dark:border-white/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-bitpolito/80 dark:text-white/80">
                            {t.privKeyHex}
                          </span>
                          <button
                            type="button"
                            onClick={() => onCopy(node.privateKeyHex, `priv-${node.depth}`)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-bitpolito/10 dark:bg-white/15 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
                          >
                            {copiedId === `priv-${node.depth}` ? (
                              <>
                                <CheckIcon />
                                <span>{t.copied}</span>
                              </>
                            ) : (
                              <>
                                <CopyIcon />
                                <span>{t.copy}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="font-mono text-xs break-all text-bitpolito dark:text-white select-all">
                          {node.privateKeyHex}
                        </p>
                      </div>
                    )}

                    {/* Private Key (WIF) */}
                    {node.wif && (
                      <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-bitpolito/20 dark:border-white/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-bitpolito/80 dark:text-white/80">
                            {t.privKeyWif}
                          </span>
                          <button
                            type="button"
                            onClick={() => onCopy(node.wif, `wif-${node.depth}`)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-bitpolito/10 dark:bg-white/15 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
                          >
                            {copiedId === `wif-${node.depth}` ? (
                              <>
                                <CheckIcon />
                                <span>{t.copied}</span>
                              </>
                            ) : (
                              <>
                                <CopyIcon />
                                <span>{t.copy}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="font-mono text-xs break-all text-bitpolito dark:text-white select-all">
                          {node.wif}
                        </p>
                      </div>
                    )}

                    {/* Chain Code (Hex) */}
                    {node.chainCodeHex && (
                      <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-bitpolito/20 dark:border-white/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-bitpolito/80 dark:text-white/80">
                            {t.chainCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => onCopy(node.chainCodeHex, `chain-${node.depth}`)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-bitpolito/10 dark:bg-white/15 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
                          >
                            {copiedId === `chain-${node.depth}` ? (
                              <>
                                <CheckIcon />
                                <span>{t.copied}</span>
                              </>
                            ) : (
                              <>
                                <CopyIcon />
                                <span>{t.copy}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="font-mono text-xs break-all text-bitpolito dark:text-white select-all">
                          {node.chainCodeHex}
                        </p>
                      </div>
                    )}

                    {/* Extended Keys (xprv / xpub) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {node.xprv && (
                        <div className="bg-white dark:bg-black/20 p-2.5 rounded-xl border border-bitpolito/20 dark:border-white/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-bitpolito/70 dark:text-white/70">
                              {t.xprv}
                            </span>
                            <button
                              type="button"
                              onClick={() => onCopy(node.xprv, `xprv-${node.depth}`)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-bitpolito/10 dark:bg-white/15 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
                            >
                              {copiedId === `xprv-${node.depth}` ? (
                                <>
                                  <CheckIcon />
                                  <span>{t.copied}</span>
                                </>
                              ) : (
                                <>
                                  <CopyIcon />
                                  <span>{t.copy}</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="font-mono text-[11px] break-all text-bitpolito dark:text-white select-all">
                            {node.xprv}
                          </p>
                        </div>
                      )}

                      {node.xpub && (
                        <div className="bg-white dark:bg-black/20 p-2.5 rounded-xl border border-bitpolito/20 dark:border-white/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-bitpolito/70 dark:text-white/70">
                              {t.xpub}
                            </span>
                            <button
                              type="button"
                              onClick={() => onCopy(node.xpub, `xpub-${node.depth}`)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-bitpolito/10 dark:bg-white/15 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
                            >
                              {copiedId === `xpub-${node.depth}` ? (
                                <>
                                  <CheckIcon />
                                  <span>{t.copied}</span>
                                </>
                              ) : (
                                <>
                                  <CopyIcon />
                                  <span>{t.copy}</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="font-mono text-[11px] break-all text-bitpolito dark:text-white select-all">
                            {node.xpub}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Level 5: Address Leaves Section */}
        <div className="relative flex items-start gap-3 sm:gap-4 pt-2">
          {/* Node Junction Dot for Leaves Branch */}
          <div className="relative z-10 mt-5 -ml-2.5 sm:-ml-2.5 w-5 h-5 rounded-full bg-bitpolito dark:bg-white border-2 border-white dark:border-bitpolito flex items-center justify-center shrink-0 shadow-md">
            <span className="text-[10px] text-white dark:text-bitpolito font-black">5</span>
          </div>

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
                    {t.terminalLeavesTitle}
                  </h4>
                </div>
                <p className="mt-1 text-xs text-bitpolito/70 dark:text-white/70">
                  {t.terminalLeavesDesc}
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
                return (
                  <div
                    key={leaf.index}
                    className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-black/25 border border-bitpolito/25 dark:border-white/20 hover:border-bitpolito dark:hover:border-white transition-all shadow-xs"
                  >
                    {/* Left: BIP44 Header and Index */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-bitpolito/10 text-bitpolito dark:bg-white/20 dark:text-white">
                          #{leaf.index}
                        </span>
                        <span className="text-xs font-medium text-bitpolito/70 dark:text-white/70">
                          {t.pathHeader}
                        </span>
                        <span className="font-mono text-xs font-bold text-bitpolito dark:text-white">
                          {leaf.path}
                        </span>
                      </div>

                      {/* Right/Bottom: Bitcoin Address (only address + header, requirement 6) */}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs font-bold text-bitpolito/80 dark:text-white/80 shrink-0">
                          {t.addressLabel}:
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-extrabold text-bitpolito dark:text-white break-all select-all">
                          {leaf.address}
                        </span>
                      </div>
                    </div>

                    {/* Copy Address Button */}
                    <div className="self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => onCopy(leaf.address, copyId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-white/10 border border-bitpolito/30 dark:border-white/30 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        {copiedId === copyId ? (
                          <>
                            <CheckIcon />
                            <span>{t.copied}</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon />
                            <span>{t.copy}</span>
                          </>
                        )}
                      </button>
                    </div>
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
