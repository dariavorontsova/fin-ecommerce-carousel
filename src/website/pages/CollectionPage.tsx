import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, Star, SlidersHorizontal } from 'lucide-react';
import { departments, getProductsByDepartment, getDepartmentById } from '../../shared/catalog';
import type { Product } from '../../types/product';
import { WebsiteHeader } from '../components/WebsiteHeader';

interface CollectionPageProps {
  departmentId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onTogglePanel?: () => void;
  cartItemCount?: number;
}

type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating';
type FilterOption = 'all' | 'sale' | 'new' | 'bestseller';

/**
 * CollectionPage - Product listing/grid for a department
 *
 * Ported from fin-ecommerce-end-user-ux.
 * Tracking calls removed — stubs retained for hover timing.
 */
export function CollectionPage({ departmentId, onNavigate, onTogglePanel, cartItemCount = 0 }: CollectionPageProps) {
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const hoverStartTimeRef = useRef<{ [key: string]: number }>({});

  const department = getDepartmentById(departmentId);
  const allProducts = getProductsByDepartment(departmentId);

  // Filter products
  const filteredProducts = allProducts.filter(product => {
    if (filterBy === 'all') return true;
    if (filterBy === 'sale') return product.tags?.includes('sale');
    if (filterBy === 'new') return product.tags?.includes('new');
    if (filterBy === 'bestseller') return product.tags?.includes('bestseller');
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };

  const handleFilterChange = (value: FilterOption) => {
    setFilterBy(value);
  };

  const handleProductHover = useCallback((product: Product) => {
    if (hoveredProduct !== product.id) {
      setHoveredProduct(product.id);
      hoverStartTimeRef.current[product.id] = Date.now();
    }
  }, [hoveredProduct]);

  const handleProductLeave = useCallback((product: Product) => {
    delete hoverStartTimeRef.current[product.id];
    setHoveredProduct(null);
  }, []);

  const handleProductClick = (product: Product) => {
    onNavigate('product', { productId: product.id });
  };

  if (!department) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <p style={{ color: '#646462' }}>Department not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <WebsiteHeader onNavigate={onNavigate} onTogglePanel={onTogglePanel} cartItemCount={cartItemCount}>
        {/* Breadcrumb */}
        <div className="border-b" style={{ borderColor: '#e9eae6', backgroundColor: '#ffffff' }}>
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => onNavigate('home')}
                className="hover:underline"
                style={{ color: '#646462' }}
              >
                Home
              </button>
              <ChevronRight className="h-3 w-3" style={{ color: '#646462' }} />
              <span style={{ color: '#1A1A1A' }}>{department.name}</span>
            </div>
          </div>
        </div>
      </WebsiteHeader>

      {/* Department Header */}
      <section className="pb-8 px-6" style={{ paddingTop: '112px' }}>
        <div className="max-w-6xl mx-auto">
          <h1
            className="text-3xl font-light tracking-tight mb-2"
            style={{ color: '#1A1A1A' }}
          >
            {department.name}
          </h1>
          <p style={{ color: '#646462' }}>
            {department.description}
          </p>
        </div>
      </section>

      {/* Filters & Sort */}
      <section className="px-6 pb-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="flex items-center justify-between p-4 rounded-lg border"
            style={{ borderColor: '#e9eae6', backgroundColor: '#ffffff' }}
          >
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" style={{ color: '#646462' }} />
                <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                  Filter:
                </span>
              </div>
              <div className="flex gap-2">
                {(['all', 'sale', 'bestseller', 'new'] as FilterOption[]).map((filter) => (
                  <Button
                    key={filter}
                    variant={filterBy === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange(filter)}
                    className="rounded-full text-xs"
                    style={filterBy === filter ? {
                      backgroundColor: '#1A1A1A',
                      color: '#ffffff',
                    } : {
                      borderColor: '#e9eae6',
                      color: '#646462',
                    }}
                  >
                    {filter === 'all' ? 'All' : filter === 'sale' ? 'On Sale' : filter === 'new' ? 'New' : 'Bestseller'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: '#646462' }}>Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortOption)}>
                <SelectTrigger
                  className="w-[160px] h-9 text-sm border rounded-full"
                  style={{ borderColor: '#e9eae6' }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm mb-6" style={{ color: '#646462' }}>
            {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
          </p>

          {sortedProducts.length === 0 ? (
            <div
              className="text-center py-16 rounded-lg border"
              style={{ borderColor: '#e9eae6', backgroundColor: '#ffffff' }}
            >
              <p style={{ color: '#646462' }}>No products match your filters</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilterBy('all')}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group border transition-all overflow-hidden rounded-2xl cursor-pointer hover:shadow-lg"
                  style={{ borderColor: '#e9eae6', backgroundColor: '#ffffff' }}
                  onClick={() => handleProductClick(product)}
                  onMouseEnter={() => handleProductHover(product)}
                  onMouseLeave={() => handleProductLeave(product)}
                >
                  <CardContent className="p-0">
                    {/* Image */}
                    <div
                      className="aspect-square overflow-hidden relative"
                      style={{ backgroundColor: '#ffffff' }}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="absolute top-3 left-3 flex gap-1">
                          {product.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs font-medium capitalize"
                              style={{
                                backgroundColor: tag === 'sale' ? '#DC2626' : '#1A1A1A',
                                color: '#ffffff',
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p
                        className="text-xs mb-1"
                        style={{ color: '#646462' }}
                      >
                        {product.subcategory}
                      </p>
                      <h3
                        className="font-medium text-sm mb-2 line-clamp-2 min-h-[2.5rem]"
                        style={{ color: '#1A1A1A' }}
                      >
                        {product.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs" style={{ color: '#646462' }}>
                          {product.rating} ({product.reviewCount})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span
                          className="font-semibold"
                          style={{ color: '#1A1A1A' }}
                        >
                          €{product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span
                            className="text-sm line-through"
                            style={{ color: '#646462' }}
                          >
                            €{product.originalPrice.toFixed(2)}
                          </span>
                        )}
                        {product.discount && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: '#DC2626', color: '#ffffff' }}
                          >
                            -{product.discount}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Other Departments */}
      <section className="py-12 px-6 border-t" style={{ borderColor: '#e9eae6', backgroundColor: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-xl font-light tracking-tight mb-6"
            style={{ color: '#1A1A1A' }}
          >
            Other Departments
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {departments
              .filter(d => d.id !== departmentId)
              .map((dept) => (
                <Button
                  key={dept.id}
                  variant="outline"
                  className="rounded-full whitespace-nowrap"
                  style={{ borderColor: '#e9eae6', color: '#1A1A1A' }}
                  onClick={() => onNavigate('collection', { department: dept.id })}
                >
                  {dept.name}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t" style={{ borderColor: '#e9eae6' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm" style={{ color: '#646462' }}>
            © 2024 Demo Store — Fin conversational commerce prototype.
          </p>
        </div>
      </footer>
    </div>
  );
}
