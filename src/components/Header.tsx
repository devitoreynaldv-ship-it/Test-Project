import React from 'react';
import { Sliders, Egg } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unpaidCount: number;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  unpaidCount,
  onOpenSettings,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Ringkasan Utama' },
    { id: 'pos', label: 'Kasir & POS' },
    { id: 'piutang', label: 'Piutang & Tempo', badge: unpaidCount },
    { id: 'warehouse', label: 'Panen & Gudang' },
    { id: 'mutasi', label: 'Jurnal Mutasi' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark (Single element) */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group select-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs group-hover:bg-amber-600 transition">
            <Egg className="h-5 w-5 fill-white/20" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-neutral-900">
            Ovo<span className="text-amber-600">Track</span> Pro
          </span>
        </div>

        {/* Zone 2: 4-5 Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'text-neutral-900 font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white tabular-nums">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-amber-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action & Settings */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onSelectTab('pos')}
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition whitespace-nowrap shrink-0"
          >
            + Transaksi Baru
          </button>
          <button
            onClick={onOpenSettings}
            title="Pengaturan Farm & HPP"
            className="flex items-center justify-center rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition shrink-0"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-neutral-100 px-4 py-2 gap-2 scrollbar-none bg-neutral-50/70">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0 transition font-medium ${
                isActive
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200'
              }`}
            >
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white text-rose-600 font-bold' : 'bg-rose-600 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
