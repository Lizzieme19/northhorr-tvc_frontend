'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// One navigation frame for every portal: a grouped sidebar on large screens, a slide-in menu (and, where it helps, a
// bottom bar) on phones, a breadcrumb, quick jump (press / or Ctrl+K), and sections that live in the address
// (#fees, #students...) so the browser's back button, refresh and shared links all land on the right page.

export type NavItem = { key: string; label: string; icon: string; badge?: number | string | null; count?: number | null; hint?: string };
export type NavGroup = { heading?: string; items: NavItem[] };

// The current section, kept in the address hash. `keys` are the sections this person may open.
export function usePortalSection<T extends string>(keys: readonly T[], initial: T): [T, (k: T) => void] {
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const [section, setSection] = useState<T>(initial);

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace('#', '') as T;
      if (h && keysRef.current.includes(h)) setSection(h);
      else if (!h) setSection(initial);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback((k: T) => {
    setSection(k);
    if (typeof window !== 'undefined') {
      if (window.location.hash !== `#${k}`) window.location.hash = k;
      window.scrollTo({ top: 0 });
    }
  }, []);

  return [section, go];
}

type Props = {
  brand: { title: string; subtitle?: string; logoText?: string; logoUrl?: string | null };
  groups: NavGroup[];
  active: string;
  onNavigate: (key: string) => void;
  user?: { email?: string; role?: string; name?: string };
  onChangePassword?: () => void;
  onLogout: () => void;
  // up to five sections shown as a bottom bar on phones
  bottomKeys?: string[];
  searchable?: boolean;
  children: React.ReactNode;
};

export default function PortalShell({ brand, groups, active, onNavigate, user, onChangePassword, onLogout, bottomKeys, searchable, children }: Props) {
  const [drawer, setDrawer] = useState(false);
  const [jump, setJump] = useState(false);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const all = useMemo(() => groups.flatMap(g => g.items.map(i => ({ ...i, group: g.heading || '' }))), [groups]);
  const current = all.find(i => i.key === active);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? all.filter(i => `${i.label} ${i.group} ${i.hint || ''}`.toLowerCase().includes(t)) : all;
  }, [all, q]);

  const go = (key: string) => { setDrawer(false); setJump(false); setQ(''); onNavigate(key); };

  // quick jump: "/" or Ctrl/Cmd+K, Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName || '') || (e.target as HTMLElement)?.isContentEditable;
      if (searchable && ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing))) { e.preventDefault(); setJump(true); setCursor(0); }
      if (e.key === 'Escape') { setJump(false); setDrawer(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchable]);
  useEffect(() => { if (jump) setTimeout(() => inputRef.current?.focus(), 30); }, [jump]);
  useEffect(() => { setCursor(0); }, [q]);
  // the menu does not stay open behind a page change; the page does not scroll behind it
  useEffect(() => { document.body.style.overflow = drawer ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [drawer]);

  const renderNav = (onPick: (k: string) => void) => (
    <nav aria-label={`${brand.title} sections`} className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.heading && <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-cream/40">{g.heading}</div>}
          <ul className="space-y-0.5">
            {g.items.map(i => {
              const on = i.key === active;
              return (
                <li key={i.key}>
                  <button
                    onClick={() => onPick(i.key)}
                    aria-current={on ? 'page' : undefined}
                    title={i.hint}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition ${on ? 'bg-white/12 text-white font-semibold shadow-inner ring-1 ring-gold/40' : 'text-cream/75 hover:bg-white/8 hover:text-white'}`}
                  >
                    <span className="w-5 text-center text-base leading-none" aria-hidden>{i.icon}</span>
                    <span className="flex-1 truncate">{i.label}</span>
                    {i.count != null && !i.badge ? <span className="text-[11px] text-cream/45 tabular-nums">{i.count}</span> : null}
                    {i.badge ? <span className="min-w-[1.4rem] px-1.5 py-0.5 rounded-full bg-gold text-brand-dark text-[11px] font-bold text-center">{i.badge}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const renderBrand = () => (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
      {brand.logoUrl
        ? <img src={brand.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover border-2 border-gold/50" />
        : <div className="h-10 w-10 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm shrink-0">{brand.logoText || 'NT'}</div>}
      <div className="min-w-0">
        <div className="font-display font-semibold leading-tight truncate">{brand.title}</div>
        {brand.subtitle && <div className="text-[11px] text-cream/50 truncate">{brand.subtitle}</div>}
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="border-t border-white/10 p-4 space-y-3">
      {user && (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center text-xs font-bold shrink-0" aria-hidden>{(user.name || user.email || '?').charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">{user.name || user.email}</div>
            {user.role && <div className="text-[10px] uppercase tracking-wider text-gold">{user.role.replace('_', ' ')}</div>}
          </div>
        </div>
      )}
      <div className="flex gap-2 text-xs">
        {onChangePassword && <button onClick={() => { setDrawer(false); onChangePassword(); }} className="flex-1 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 transition">🔑 Password</button>}
        <button onClick={onLogout} className="flex-1 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 transition">⎋ Log out</button>
      </div>
    </div>
  );

  const bottom = (bottomKeys || []).map(k => all.find(i => i.key === k)).filter(Boolean) as (NavItem & { group: string })[];

  return (
    <div className="min-h-screen bg-cream-deep">
      {/* Phones: top bar with the menu button */}
      <header className="lg:hidden sticky top-0 z-40 bg-brand-dark text-cream h-14 px-3 flex items-center gap-2 shadow-lg">
        <button onClick={() => setDrawer(true)} aria-label="Open menu" className="h-10 w-10 grid place-items-center rounded-xl hover:bg-white/10 text-xl">☰</button>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold truncate text-sm leading-tight">{current ? `${current.icon} ${current.label}` : brand.title}</div>
          <div className="text-[10px] text-cream/50 truncate leading-tight">{brand.title}</div>
        </div>
        {searchable && <button onClick={() => { setJump(true); setCursor(0); }} aria-label="Jump to a section" className="h-10 w-10 grid place-items-center rounded-xl hover:bg-white/10">🔍</button>}
      </header>

      {/* Large screens: the sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-brand-dark text-cream z-30 shadow-xl">
        {renderBrand()}
        {searchable && (
          <button onClick={() => { setJump(true); setCursor(0); }} className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-sm text-cream/70 transition">
            <span aria-hidden>🔍</span><span className="flex-1 text-left">Jump to…</span><kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">/</kbd>
          </button>
        )}
        {renderNav(go)}
        {renderAccount()}
      </aside>

      {/* Phones: the slide-in menu */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col bg-brand-dark text-cream shadow-2xl">
            <div className="flex items-center">
              <div className="flex-1">{renderBrand()}</div>
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="mr-3 h-9 w-9 grid place-items-center rounded-xl hover:bg-white/10">✕</button>
            </div>
            {renderNav(go)}
            {renderAccount()}
          </div>
        </div>
      )}

      <div className={`lg:pl-64 ${bottom.length ? 'pb-20 lg:pb-0' : ''}`}>
        {/* Large screens: where you are */}
        <div className="hidden lg:flex items-center gap-2 px-8 py-3 text-sm text-stone border-b border-stone/10 bg-cream-deep/90 backdrop-blur sticky top-0 z-20">
          <span>{brand.title}</span>
          {current?.group && <><span aria-hidden>›</span><span>{current.group}</span></>}
          {current && <><span aria-hidden>›</span><strong className="text-brand-dark">{current.label}</strong></>}
        </div>
        {children}
      </div>

      {/* Phones: the main sections one tap away */}
      {bottom.length > 0 && (
        <nav aria-label="Main sections" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone/15 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] grid" style={{ gridTemplateColumns: `repeat(${bottom.length}, minmax(0, 1fr))` }}>
          {bottom.map(i => {
            const on = i.key === active;
            return (
              <button key={i.key} onClick={() => go(i.key)} aria-current={on ? 'page' : undefined} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] transition ${on ? 'text-brand font-semibold' : 'text-stone'}`}>
                {on && <span className="absolute top-0 inset-x-6 h-0.5 rounded-full bg-brand" aria-hidden />}
                <span className="text-lg leading-none" aria-hidden>{i.icon}</span>
                <span className="truncate max-w-full px-1">{i.label}</span>
                {i.badge ? <span className="absolute top-1 right-[22%] min-w-[1rem] px-1 rounded-full bg-terracotta text-white text-[9px] font-bold text-center">{i.badge}</span> : null}
              </button>
            );
          })}
        </nav>
      )}

      {/* Quick jump */}
      {jump && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-start justify-center p-4 pt-[12vh]" onClick={() => setJump(false)} role="dialog" aria-modal="true" aria-label="Jump to a section">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Jump to…  (type a section name)"
              onKeyDown={e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, matches.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
                else if (e.key === 'Enter' && matches[cursor]) { e.preventDefault(); go(matches[cursor].key); }
              }}
              className="w-full px-5 py-4 text-sm border-b border-stone/10 focus:outline-none"
            />
            <ul className="max-h-72 overflow-y-auto py-1">
              {matches.length === 0 && <li className="px-5 py-4 text-sm text-stone">Nothing matches.</li>}
              {matches.map((i, idx) => (
                <li key={i.key}>
                  <button onClick={() => go(i.key)} onMouseEnter={() => setCursor(idx)} className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left ${idx === cursor ? 'bg-brand/8 text-brand-dark' : 'text-brand-dark'}`}>
                    <span aria-hidden>{i.icon}</span>
                    <span className="flex-1">{i.label}{i.group && <span className="ml-2 text-xs text-stone">{i.group}</span>}</span>
                    {i.key === active && <span className="text-[10px] text-stone">you are here</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
