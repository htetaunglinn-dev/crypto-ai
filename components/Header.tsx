'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Search, Settings, Sparkles } from 'lucide-react';

interface HeaderProps {
  /** When set, shows the pair search trigger (dashboard only). */
  onOpenSearch?: () => void;
  isLive?: boolean;
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Crypto AI home">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2 shadow-[0_6px_20px_-6px_rgb(102_117_255/0.8)]">
        <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
      </span>
      <span className="text-[17px] font-semibold tracking-tight text-white">
        Crypto<span className="bg-gradient-to-r from-blue-400 to-brand-2 bg-clip-text text-transparent">AI</span>
      </span>
    </Link>
  );
}

export function Header({ onOpenSearch, isLive }: HeaderProps) {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-app/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Logo />

        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="ml-2 hidden h-9 flex-1 max-w-sm items-center gap-2 rounded-xl border border-line bg-surface-2/70 px-3 text-sm text-gray-500 transition hover:border-line-strong hover:text-gray-300 md:flex cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search coins…</span>
            <span className="kbd">⌘</span>
            <span className="kbd -ml-1">K</span>
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isLive !== undefined && (
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex ${
                isLive ? 'border-up/30 bg-up/10 text-up' : 'border-line bg-surface-2 text-gray-400'
              }`}
              title={isLive ? 'Streaming live prices' : 'Refreshing prices periodically'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-up animate-pulse' : 'bg-gray-500'}`} />
              {isLive ? 'Live' : 'Delayed'}
            </span>
          )}

          {onOpenSearch && (
            <button onClick={onOpenSearch} className="btn-ghost btn h-9 w-9 p-0 md:hidden" aria-label="Search coins">
              <Search className="h-4 w-4" />
            </button>
          )}

          {status === 'loading' ? (
            <div className="h-9 w-24 skeleton" />
          ) : session ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-haspopup="menu"
                aria-expanded={showMenu}
                className="flex h-9 items-center gap-2 rounded-xl border border-line bg-surface-2 pl-1 pr-2.5 text-sm font-medium text-white transition hover:border-line-strong cursor-pointer"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-xs font-bold">
                  {(session.user?.name || session.user?.email || '?').charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-32 truncate sm:inline">{session.user?.name}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMenu && (
                <div role="menu" className="card absolute right-0 mt-2 w-56 overflow-hidden p-1.5 animate-pop-in">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium text-white">{session.user?.name}</p>
                    <p className="truncate text-xs text-gray-400">{session.user?.email}</p>
                  </div>
                  <div className="my-1 h-px bg-line" />
                  <Link
                    href="/settings"
                    role="menuitem"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-200 transition hover:bg-surface-3"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Settings
                  </Link>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowMenu(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/auth/signin" className="btn btn-ghost h-9">
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn btn-primary h-9">
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
