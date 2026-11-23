import { useState } from 'react';
import { COIN_CONFIG, COIN_OPTIONS } from './utils/derivationLogic';
import type { BipStandard, CoinId, ChangeIndex } from './utils/interface';
import type { CopyableKeyFieldProps, IntermediateNodesProps } from './utils/interfaceUI';

const NODE_STRINGS = {
  it: {
    expandNode: 'Espandi (Chiave Privata & Chain Code)',
    collapseNode: 'Nascondi dettagli',
    privateInfoLocked: 'Bloccato (Info private nascoste)',
    depthBadge: 'Profondità',
    privKeyHex: 'Chiave Privata (Hex)',
    privKeyWif: 'Chiave Privata (WIF)',
    chainCode: 'Chain Code (Hex)',
    xprv: (prefix: string) => `Chiave Estesa Privata (${prefix})`,
    xpub: (prefix: string) => `Chiave Estesa Pubblica (${prefix})`,
    copy: 'Copia',
    copied: 'Copiato!',
    coinFieldLabel: 'Coin:',
    accountFieldLabel: 'Account:',
    decreaseAccountAria: 'Diminuisci indice account',
    increaseAccountAria: 'Aumenta indice account',
    changeFieldLabel: 'Catena:',
    changeExternalOption: '0 — External / Receive (Ricezione)',
    changeInternalOption: '1 — Internal / Change (Resto)',
    levelNames: {
      root: 'Radice Master (m)',
      purpose44: "Purpose (44')",
      purpose84: "Purpose (84')",
      purpose86: "Purpose (86')",
      coinType: (coinType: number, coinLabel: string) => `Coin Type (${coinType}' ${coinLabel})`,
      account: (account: number) =>
        account === 0 ? "Account (0' Primario)" : `Account (${account}' #${account})`,
      change: (change: ChangeIndex) =>
        change === 0 ? 'Change (0 External / Ricezione)' : 'Change (1 Internal / Resto)',
    },
  },
  en: {
    expandNode: 'Expand (Private Key & Chain Code)',
    collapseNode: 'Hide details',
    privateInfoLocked: 'Locked (Private info hidden)',
    depthBadge: 'Depth',
    privKeyHex: 'Private Key (Hex)',
    privKeyWif: 'Private Key (WIF)',
    chainCode: 'Chain Code (Hex)',
    xprv: (prefix: string) => `Extended Private Key (${prefix})`,
    xpub: (prefix: string) => `Extended Public Key (${prefix})`,
    copy: 'Copy',
    copied: 'Copied!',
    coinFieldLabel: 'Coin:',
    accountFieldLabel: 'Account:',
    decreaseAccountAria: 'Decrease account index',
    increaseAccountAria: 'Increase account index',
    changeFieldLabel: 'Chain:',
    changeExternalOption: '0 — External / Receive',
    changeInternalOption: '1 — Internal / Change',
    levelNames: {
      root: 'Master Root (m)',
      purpose44: "Purpose (44')",
      purpose84: "Purpose (84')",
      purpose86: "Purpose (86')",
      coinType: (coinType: number, coinLabel: string) => `Coin Type (${coinType}' ${coinLabel})`,
      account: (account: number) =>
        account === 0 ? "Account (0' Primary)" : `Account (${account}' #${account})`,
      change: (change: ChangeIndex) =>
        change === 0 ? 'Change (0 External / Receive)' : 'Change (1 Internal / Change)',
    },
  },
};

const PURPOSE_KEYS: Record<BipStandard, 'purpose44' | 'purpose84' | 'purpose86'> = {
  bip44: 'purpose44',
  bip84: 'purpose84',
  bip86: 'purpose86',
};

export function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Shared circular junction dot placed on the vertical derivation tree trunk. */
export function NodeJunctionDot({ marginTopClass = 'mt-4' }: { marginTopClass?: string }) {
  return (
    <div
      className={`relative z-10 ${marginTopClass} -ml-2.5 sm:-ml-2.5 w-5 h-5 rounded-full bg-white dark:bg-bitpolito border-2 border-bitpolito dark:border-white flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110`}
    >
      <div className="w-2 h-2 rounded-full bg-bitpolito dark:bg-white" />
    </div>
  );
}

function CopyableKeyField({
  label,
  value,
  copyKey,
  copiedId,
  copyLabel,
  copiedLabel,
  onCopy,
  compact = false,
}: CopyableKeyFieldProps) {
  return (
    <div
      className={`bg-white dark:bg-black/20 ${compact ? 'p-2.5' : 'p-3'} rounded-xl border border-bitpolito/20 dark:border-white/20`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`${compact ? 'text-[10px] text-bitpolito/70 dark:text-white/70' : 'text-[11px] text-bitpolito/80 dark:text-white/80'} font-bold uppercase tracking-wider`}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={() => onCopy(value, copyKey)}
          className={`inline-flex items-center gap-1 ${compact ? 'px-1.5 text-[10px]' : 'px-2 text-[11px]'} py-0.5 rounded font-semibold bg-bitpolito/10 dark:bg-white/15 hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer`}
        >
          {copiedId === copyKey ? (
            <>
              <CheckIcon />
              <span>{copiedLabel}</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>{copyLabel}</span>
            </>
          )}
        </button>
      </div>
      <p
        className={`font-mono ${compact ? 'text-[11px]' : 'text-xs'} break-all text-bitpolito dark:text-white select-all`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Renders intermediate HD wallet derivation nodes (Depth 0 through Depth 4)
 * including per-depth coin, account, and change chain controls and expandable key details.
 */
export default function IntermediateNodes({
  lang,
  standard,
  coin,
  account,
  change,
  onCoinChange,
  onAccountChange,
  onChangeIndexChange,
  intermediateNodes,
  expandedNodes,
  onToggleNode,
  copiedId,
  onCopy,
  hidePrivateInfo = false,
}: IntermediateNodesProps) {
  const t = NODE_STRINGS[lang];
  const purposeKey = PURPOSE_KEYS[standard];
  const activeCoinConfig = COIN_CONFIG[coin];
  const [draftAccountInput, setDraftAccountInput] = useState<string | null>(null);

  return (
    <>
      {intermediateNodes.map((node) => {
        const isExpanded = !hidePrivateInfo && !!expandedNodes[node.depth];
        let levelName: string;
        if (node.nameKey === 'purpose') {
          levelName = t.levelNames[purposeKey];
        } else if (node.nameKey === 'coinType') {
          levelName = t.levelNames.coinType(
            activeCoinConfig.coinType,
            lang === 'it' ? activeCoinConfig.labelIt : activeCoinConfig.labelEn,
          );
        } else if (node.nameKey === 'account') {
          levelName = t.levelNames.account(account);
        } else if (node.nameKey === 'change') {
          levelName = t.levelNames.change(change);
        } else {
          levelName = t.levelNames.root;
        }
        const desc = lang === 'it' ? node.descIt : node.descEn;

        return (
          <div key={node.depth} className="relative flex items-start gap-3 sm:gap-4 group">
            <NodeJunctionDot marginTopClass="mt-4" />

            <div className="flex-1 bg-white/70 dark:bg-white/5 border-2 border-bitpolito/40 dark:border-white/30 rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-bitpolito dark:hover:border-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-bitpolito/10 text-bitpolito dark:bg-white/20 dark:text-white">
                    {t.depthBadge} {node.depth}
                  </span>

                  <span className="text-sm sm:text-base font-extrabold text-bitpolito dark:text-white">
                    {levelName}
                  </span>

                  <span className="font-mono text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-md bg-bitpolito text-white dark:bg-white dark:text-bitpolito shadow-xs">
                    {node.path}
                  </span>

                  {node.isHardened && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/30">
                      Hardened
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={hidePrivateInfo}
                  onClick={() => onToggleNode(node.depth)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs self-start sm:self-auto ${
                    hidePrivateInfo
                      ? 'bg-bitpolito/5 dark:bg-white/5 border-bitpolito/15 dark:border-white/15 text-bitpolito/45 dark:text-white/45 cursor-not-allowed'
                      : 'bg-white dark:bg-white/10 border-bitpolito/30 dark:border-white/30 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito cursor-pointer'
                  }`}
                >
                  <span>
                    {hidePrivateInfo
                      ? t.privateInfoLocked
                      : isExpanded
                        ? t.collapseNode
                        : t.expandNode}
                  </span>
                  {!hidePrivateInfo && (
                    <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  )}
                </button>
              </div>

              {/* Per-depth interactive selector fields (Depth 2: Coin, Depth 3: Account, Depth 4: Change) */}
              {node.nameKey === 'coinType' && (
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <label
                    htmlFor="derivationCoinSelect"
                    className="text-xs font-bold uppercase tracking-wider text-bitpolito/80 dark:text-white/85"
                  >
                    {t.coinFieldLabel}
                  </label>
                  <select
                    id="derivationCoinSelect"
                    value={coin}
                    onChange={(e) => onCoinChange(e.target.value as CoinId)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-bitpolito border-2 border-bitpolito/35 dark:border-white/35 text-bitpolito dark:text-white hover:border-bitpolito dark:hover:border-white focus:outline-none focus:border-bitpolito dark:focus:border-white shadow-2xs cursor-pointer transition-colors"
                  >
                    {COIN_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {lang === 'it' ? opt.labelIt : opt.labelEn} ({opt.coinType}&apos;)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {node.nameKey === 'account' && (
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <label
                    htmlFor="derivationAccountInput"
                    className="text-xs font-bold uppercase tracking-wider text-bitpolito/80 dark:text-white/85"
                  >
                    {t.accountFieldLabel}
                  </label>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={t.decreaseAccountAria}
                      disabled={account <= 0}
                      onClick={() => {
                        setDraftAccountInput(null);
                        onAccountChange(Math.max(0, account - 1));
                      }}
                      className="w-7 h-7 rounded-lg text-xs font-black border border-bitpolito/35 dark:border-white/35 bg-white dark:bg-white/10 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
                    >
                      −
                    </button>
                    <input
                      id="derivationAccountInput"
                      type="number"
                      min={0}
                      max={2147483647}
                      step={1}
                      value={draftAccountInput ?? String(account)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDraftAccountInput(raw);
                        if (raw.trim() === '') return;
                        const parsed = Number(raw);
                        if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 0x7fffffff) {
                          onAccountChange(parsed);
                        }
                      }}
                      onBlur={() => setDraftAccountInput(null)}
                      className="w-20 px-2.5 py-1 rounded-xl font-mono text-xs font-extrabold text-center bg-white dark:bg-black/30 border-2 border-bitpolito/35 dark:border-white/35 text-bitpolito dark:text-white focus:outline-none focus:border-bitpolito dark:focus:border-white shadow-2xs"
                    />
                    <button
                      type="button"
                      aria-label={t.increaseAccountAria}
                      onClick={() => {
                        setDraftAccountInput(null);
                        onAccountChange(Math.min(0x7fffffff, account + 1));
                      }}
                      className="w-7 h-7 rounded-lg text-xs font-black border border-bitpolito/35 dark:border-white/35 bg-white dark:bg-white/10 text-bitpolito dark:text-white hover:bg-bitpolito hover:text-white dark:hover:bg-white dark:hover:text-bitpolito transition-colors cursor-pointer"
                    >
                      +
                    </button>
                    <span className="font-mono text-xs font-bold text-bitpolito/65 dark:text-white/65">
                      ({account}&apos;)
                    </span>
                  </div>
                </div>
              )}

              {node.nameKey === 'change' && (
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <label
                    htmlFor="derivationChangeSelect"
                    className="text-xs font-bold uppercase tracking-wider text-bitpolito/80 dark:text-white/85"
                  >
                    {t.changeFieldLabel}
                  </label>
                  <select
                    id="derivationChangeSelect"
                    value={change}
                    onChange={(e) =>
                      onChangeIndexChange((Number(e.target.value) === 1 ? 1 : 0) as ChangeIndex)
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-bitpolito border-2 border-bitpolito/35 dark:border-white/35 text-bitpolito dark:text-white hover:border-bitpolito dark:hover:border-white focus:outline-none focus:border-bitpolito dark:focus:border-white shadow-2xs cursor-pointer transition-colors"
                  >
                    <option value={0}>{t.changeExternalOption}</option>
                    <option value={1}>{t.changeInternalOption}</option>
                  </select>
                </div>
              )}

              <p className="mt-2 text-xs sm:text-sm text-bitpolito/70 dark:text-white/70 leading-relaxed">
                {desc}
              </p>

              {/* Expanded Details: Private Key, WIF, Chain Code & Extended Keys */}
              {!hidePrivateInfo && isExpanded && (
                <div className="mt-4 pt-4 border-t border-bitpolito/20 dark:border-white/20 space-y-3 animate-in fade-in duration-200">
                  {node.privateKeyHex && (
                    <CopyableKeyField
                      label={t.privKeyHex}
                      value={node.privateKeyHex}
                      copyKey={`priv-${node.depth}`}
                      copiedId={copiedId}
                      copyLabel={t.copy}
                      copiedLabel={t.copied}
                      onCopy={onCopy}
                    />
                  )}

                  {node.wif && (
                    <CopyableKeyField
                      label={t.privKeyWif}
                      value={node.wif}
                      copyKey={`wif-${node.depth}`}
                      copiedId={copiedId}
                      copyLabel={t.copy}
                      copiedLabel={t.copied}
                      onCopy={onCopy}
                    />
                  )}

                  {node.chainCodeHex && (
                    <CopyableKeyField
                      label={t.chainCode}
                      value={node.chainCodeHex}
                      copyKey={`chain-${node.depth}`}
                      copiedId={copiedId}
                      copyLabel={t.copy}
                      copiedLabel={t.copied}
                      onCopy={onCopy}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {node.xprv && (
                      <CopyableKeyField
                        label={t.xprv(node.xprv.slice(0, 4))}
                        value={node.xprv}
                        copyKey={`xprv-${node.depth}`}
                        copiedId={copiedId}
                        copyLabel={t.copy}
                        copiedLabel={t.copied}
                        onCopy={onCopy}
                        compact
                      />
                    )}

                    {node.xpub && (
                      <CopyableKeyField
                        label={t.xpub(node.xpub.slice(0, 4))}
                        value={node.xpub}
                        copyKey={`xpub-${node.depth}`}
                        copiedId={copiedId}
                        copyLabel={t.copy}
                        copiedLabel={t.copied}
                        onCopy={onCopy}
                        compact
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
