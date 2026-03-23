import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Search } from 'lucide-react';

interface WebsiteHeaderProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onTogglePanel?: () => void;
  cartItemCount?: number;
  children?: React.ReactNode; // Below the header row (breadcrumbs, etc.)
}

/**
 * Shared fixed header for all website pages.
 * Hamburger | Logo | Search | Cart — all in one row, on every page.
 */
export function WebsiteHeader({ onNavigate, onTogglePanel, cartItemCount = 0, children }: WebsiteHeaderProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onNavigate('search', { query: searchValue.trim() });
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <header className="h-14 border-b flex items-center" style={{ borderColor: '#e9eae6', backgroundColor: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 shrink-0">
              {/* Hamburger — admin panel toggle */}
              {onTogglePanel && (
                <button
                  onClick={onTogglePanel}
                  className="-ml-2 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
                  title="Open admin panel"
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4H14" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M2 8H14" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M2 12H10" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              {/* Logo */}
              <button
                onClick={() => onNavigate('home')}
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: '#1A1A1A' }}
              >
                Demo Store
              </button>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#a1a1a0' }} />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-9 pl-9 pr-4 rounded-full text-sm border outline-none transition-colors"
                  style={{
                    borderColor: '#e9eae6',
                    backgroundColor: '#f7f7f5',
                    color: '#1A1A1A',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#c6c9c0'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e9eae6'; e.currentTarget.style.backgroundColor = '#f7f7f5'; }}
                />
              </div>
            </form>

            {/* Cart */}
            <Button
              variant="outline"
              onClick={() => onNavigate('cart')}
              className="text-sm font-medium gap-2 rounded-full shrink-0"
              style={{
                borderColor: cartItemCount > 0 ? '#fa7938' : '#e9eae6',
                color: cartItemCount > 0 ? '#fa7938' : '#1A1A1A',
              }}
            >
              <ShoppingBag className="h-4 w-4" />
              Cart ({cartItemCount})
            </Button>
          </div>
        </div>
      </header>

      {/* Below header row — breadcrumbs, filter bar, etc. */}
      {children}
    </div>
  );
}
