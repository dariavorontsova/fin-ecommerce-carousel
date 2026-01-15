// React hook for fetching products from DummyJSON API

import { useState, useEffect, useCallback } from 'react';
import { Product, ProductCategory } from '../types/product';
import {
  getAllProducts,
  getProductsByCategory,
  searchProducts,
  filterProducts,
  ProductSearchCriteria,
} from '../data/products';

interface UseProductsState {
  products: Product[];
  loading: boolean;
  error: Error | null;
}

interface UseProductsResult extends UseProductsState {
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all products
 */
export function useProducts(): UseProductsResult {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const products = await getAllProducts();
      setState({ products, loading: false, error: null });
    } catch (error) {
      setState({ products: [], loading: false, error: error as Error });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

/**
 * Hook to fetch products by category
 */
export function useProductsByCategory(category: ProductCategory): UseProductsResult {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const products = await getProductsByCategory(category);
      setState({ products, loading: false, error: null });
    } catch (error) {
      setState({ products: [], loading: false, error: error as Error });
    }
  }, [category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

/**
 * Hook to search products
 */
export function useProductSearch(query: string): UseProductsResult {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!query.trim()) {
      setState({ products: [], loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const products = await searchProducts(query);
      setState({ products, loading: false, error: null });
    } catch (error) {
      setState({ products: [], loading: false, error: error as Error });
    }
  }, [query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

/**
 * Hook to filter products by criteria
 * Used by the LLM decision flow
 */
export function useFilteredProducts(criteria: ProductSearchCriteria | null): UseProductsResult {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!criteria) {
      setState({ products: [], loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const products = await filterProducts(criteria);
      setState({ products, loading: false, error: null });
    } catch (error) {
      setState({ products: [], loading: false, error: error as Error });
    }
  }, [criteria]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
