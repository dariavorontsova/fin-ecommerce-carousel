import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Product } from '../types/product';

interface PinningContextType {
  // Focused product — the last single product card rendered or clicked "Add to Cart" on
  focusedProduct: Product | null;
  setFocusedProduct: (product: Product | null) => void;

  // Pinning state — driven by IntersectionObserver
  isCartPinned: boolean;
  isProductPinned: boolean;

  // Registration functions — components call these to register observed elements
  registerScrollContainer: (el: HTMLElement | null) => void;
  registerCartBlock: (el: HTMLElement | null) => void;
}

const PinningContext = createContext<PinningContextType | null>(null);

export function PinningProvider({ children }: { children: ReactNode }) {
  const [focusedProduct, setFocusedProduct] = useState<Product | null>(null);
  const [isCartPinned, setIsCartPinned] = useState(false);
  const [isProductPinned, setIsProductPinned] = useState(false);

  // Store DOM elements as state (not refs) so changes trigger effect re-runs
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);
  const [cartBlockEl, setCartBlockEl] = useState<HTMLElement | null>(null);

  // Auto-find the focused product's card element via data-product-id attribute
  // This avoids having to add refs to every ProductCard variant
  const [focusedProductEl, setFocusedProductEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (scrollContainer && focusedProduct) {
      const el = scrollContainer.querySelector<HTMLElement>(
        `[data-product-id="${focusedProduct.id}"]`
      );
      setFocusedProductEl(el);
    } else {
      setFocusedProductEl(null);
    }
  }, [scrollContainer, focusedProduct]);

  // Set up IntersectionObservers whenever elements change
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    // Cart block observer
    if (scrollContainer && cartBlockEl) {
      const obs = new IntersectionObserver(
        ([entry]) => setIsCartPinned(!entry.isIntersecting),
        { root: scrollContainer, threshold: 0 }
      );
      obs.observe(cartBlockEl);
      cleanups.push(() => obs.disconnect());
    } else {
      setIsCartPinned(false);
    }

    // Focused product card observer
    if (scrollContainer && focusedProductEl && focusedProduct) {
      const obs = new IntersectionObserver(
        ([entry]) => setIsProductPinned(!entry.isIntersecting),
        { root: scrollContainer, threshold: 0 }
      );
      obs.observe(focusedProductEl);
      cleanups.push(() => obs.disconnect());
    } else {
      setIsProductPinned(false);
    }

    return () => cleanups.forEach(fn => fn());
  }, [scrollContainer, cartBlockEl, focusedProductEl, focusedProduct]);

  // Stable registration callbacks
  const registerScrollContainer = useCallback((el: HTMLElement | null) => {
    setScrollContainer(el);
  }, []);

  const registerCartBlock = useCallback((el: HTMLElement | null) => {
    setCartBlockEl(el);
  }, []);

  return (
    <PinningContext.Provider value={{
      focusedProduct,
      setFocusedProduct,
      isCartPinned,
      isProductPinned,
      registerScrollContainer,
      registerCartBlock,
    }}>
      {children}
    </PinningContext.Provider>
  );
}

export function usePinning() {
  const context = useContext(PinningContext);
  if (!context) {
    throw new Error('usePinning must be used within a PinningProvider');
  }
  return context;
}
