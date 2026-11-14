'use client';

/**
 * Shared admin building blocks for the "one loud button" action system:
 * - ActionMenu: the single ⋯ menu that holds rare or destructive actions
 * - UnderlineTabs: one row of view tabs per screen
 * - FilterSelect: a status/type filter that replaces a second row of tabs
 * - DecisionControl: approve / waitlist / reject as one choice, then one Save
 * - SidePanel: the right-hand panel a row opens; decisions live here
 * - StatusPill and RowChevron: quiet row furniture
 */

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// ActionMenu
// ---------------------------------------------------------------------------

export type ActionMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Draw a divider above this item. */
  separated?: boolean;
};

export function ActionMenu({
  items,
  label = 'More actions',
  align = 'end',
}: {
  items: ActionMenuItem[];
  label?: string;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const visible = items.filter(Boolean);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const firstItem = rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
    firstItem?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, close]);

  if (visible.length === 0) return null;

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const entries = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') || []);
    const index = entries.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') { event.preventDefault(); close(true); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); entries[(index + 1) % entries.length]?.focus(); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); entries[(index - 1 + entries.length) % entries.length]?.focus(); }
    else if (event.key === 'Home') { event.preventDefault(); entries[0]?.focus(); }
    else if (event.key === 'End') { event.preventDefault(); entries.at(-1)?.focus(); }
    else if (event.key === 'Tab') close(false);
  };

  return (
    <div className="admin-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`admin-icon-button ${open ? 'is-open' : ''}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={label} className={`admin-menu-popover is-${align}`} onKeyDown={onMenuKeyDown}>
          {visible.map((item) => (
            <div key={item.label}>
              {item.separated && <div className="admin-menu-separator" role="separator" />}
              <button
                type="button"
                role="menuitem"
                className={`admin-menu-item ${item.danger ? 'is-danger' : ''}`}
                disabled={item.disabled}
                onClick={() => { close(true); item.onSelect(); }}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UnderlineTabs
// ---------------------------------------------------------------------------

export type UnderlineTab<K extends string> = { key: K; label: string; count?: number; attention?: boolean };

export function UnderlineTabs<K extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: UnderlineTab<K>[];
  active: K;
  onChange: (key: K) => void;
  label: string;
}) {
  return (
    <div className="admin-underline-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === active}
          className={tab.key === active ? 'is-active' : ''}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`admin-tab-count ${tab.attention && tab.count > 0 ? 'is-attention' : ''}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterSelect
// ---------------------------------------------------------------------------

export function FilterSelect<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: { value: V; label: string; count?: number }[];
  onChange: (value: V) => void;
}) {
  return (
    <label className="admin-filter-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as V)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}{option.count !== undefined ? ` (${option.count})` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="admin-search-field">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span className="sr-only">{label}</span>
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

// ---------------------------------------------------------------------------
// DecisionControl
// ---------------------------------------------------------------------------

export type DecisionTone = 'neutral' | 'positive' | 'caution' | 'negative' | 'info';

export function DecisionControl<V extends string>({
  legend,
  value,
  options,
  onChange,
  disabled,
}: {
  legend: string;
  value: V;
  options: { value: V; label: string; tone: DecisionTone }[];
  onChange: (value: V) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="admin-decision" disabled={disabled}>
      <legend>{legend}</legend>
      <div className="admin-decision-options" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <label key={option.value} className={`is-${option.tone} ${option.value === value ? 'is-selected' : ''}`}>
            <input type="radio" name={name} value={option.value} checked={option.value === value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Close an open panel with Escape (unless busy). Used by panels that are
 * not built on SidePanel, such as the vendor review and profile panels.
 */
export function useEscapeToClose(open: boolean, onClose: () => void, busy = false) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy && !event.defaultPrevented) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy]);
}

// ---------------------------------------------------------------------------
// SidePanel
// ---------------------------------------------------------------------------

export function SidePanel({
  onClose,
  kicker,
  title,
  subtitle,
  avatar,
  menu,
  children,
  footer,
  busy,
}: {
  onClose: () => void;
  kicker?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  avatar?: ReactNode;
  menu?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => {
    closeRef.current = onClose;
    busyRef.current = busy;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current && !event.defaultPrevented) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="admin-panel-overlay" onClick={() => { if (!busy) onClose(); }}>
      <section
        ref={panelRef}
        className="admin-side-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-side-panel-header">
          {avatar}
          <div className="admin-side-panel-heading">
            {kicker && <p className="admin-side-panel-kicker">{kicker}</p>}
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p className="admin-side-panel-subtitle">{subtitle}</p>}
          </div>
          <div className="admin-side-panel-tools">
            {menu}
            <button type="button" className="admin-icon-button" aria-label="Close" onClick={onClose} disabled={busy}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>
        </header>
        <div className="admin-side-panel-body">{children}</div>
        {footer && <footer className="admin-side-panel-footer">{footer}</footer>}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row furniture
// ---------------------------------------------------------------------------

export type PillTone = 'pending' | 'approved' | 'waitlisted' | 'rejected' | 'info' | 'neutral';

export function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={`admin-pill is-${tone}`}>{children}</span>;
}

export function RowChevron() {
  return (
    <svg className="admin-row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/** Detail list used inside side panels. Rows with no value are skipped. */
export function DetailList({ rows }: { rows: [label: string, value: ReactNode][] }) {
  const visible = rows.filter(([, value]) => value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0));
  if (visible.length === 0) return null;
  return (
    <dl className="admin-detail-list">
      {visible.map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  );
}
