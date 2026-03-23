import { useState, useCallback } from 'react';
import './website.css';
import { HomePage } from './pages/HomePage';
import { CollectionPage } from './pages/CollectionPage';
import { PDPScene } from './pages/PDPScene';

/**
 * WebsiteShell — The "customer's website" container.
 *
 * This component represents the fake e-commerce site (MAISON)
 * that serves as the backdrop for the Fin agent demo. It is
 * completely isolated from the messenger/Fin SDK:
 *
 * - Scoped CSS variables via .website-root
 * - Own product data catalog
 * - Internal page routing (no react-router needed yet)
 *
 * The messenger floats on top of this as a third-party overlay.
 */

type PageType = 'home' | 'collection' | 'product' | 'search' | 'cart';

interface NavigationState {
  page: PageType;
  params: Record<string, string>;
}

interface WebsiteShellProps {
  onTogglePanel?: () => void;
}

export function WebsiteShell({ onTogglePanel }: WebsiteShellProps) {
  const [navigation, setNavigation] = useState<NavigationState>({
    page: 'home',
    params: {},
  });

  const handleNavigate = useCallback((page: string, params?: Record<string, string>) => {
    setNavigation({
      page: page as PageType,
      params: params || {},
    });
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  }, []);

  const renderPage = () => {
    switch (navigation.page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} onTogglePanel={onTogglePanel} />;
      case 'collection':
        return (
          <CollectionPage
            departmentId={navigation.params.department || 'home-kitchen'}
            onNavigate={handleNavigate}
            onTogglePanel={onTogglePanel}
          />
        );
      case 'product':
        return <PDPScene productId={navigation.params.productId} onNavigate={handleNavigate} onTogglePanel={onTogglePanel} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="website-root">
      {renderPage()}
    </div>
  );
}
