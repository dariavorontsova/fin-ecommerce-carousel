import { Product, CardConfig, DEFAULT_CARD_CONFIG } from '../../types/product';

interface ProductCardProps {
  product: Product;
  config?: Partial<CardConfig>;
  variant?: 'default' | 'compact' | 'list';
  aiReasoningMode?: boolean;
  onClick?: (product: Product) => void;
}

export function ProductCard({ 
  product, 
  config: configOverride,
  variant = 'default',
  aiReasoningMode = false,
  onClick 
}: ProductCardProps) {
  const config = { ...DEFAULT_CARD_CONFIG, ...configOverride };
  
  const handleClick = () => {
    onClick?.(product);
  };

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Compact price format (no decimals if whole number)
  const formatPriceCompact = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency,
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  };

  // Get badge info - using consistent frosted glass style
  const getBadge = () => {
    if (!product.tags?.length) return null;
    if (product.tags.includes('sale')) return { text: 'Sale' };
    if (product.tags.includes('new')) return { text: 'New' };
    if (product.tags.includes('bestseller')) return { text: 'Best Seller' };
    if (product.tags.includes('limited')) return { text: 'Limited' };
    if (product.tags.includes('eco-friendly')) return { text: 'Eco' };
    return null;
  };

  const badge = getBadge();

  // Card hover shadow - Figma: two drop shadows
  const hoverShadow = '0px 1px 4px rgba(9, 14, 21, 0.06), 0px 4px 28px rgba(9, 14, 21, 0.06)';

  // AI Reasoning Mode - Figma spec
  if (aiReasoningMode) {
    const isCompactMode = variant === 'compact';
    return (
      <div 
        className={`bg-white overflow-clip cursor-pointer flex-shrink-0 transition-shadow ${isCompactMode ? 'w-[200px] min-w-[200px]' : 'w-full'}`}
        style={{
          border: '1px solid rgba(9, 14, 21, 0.1)',
          borderRadius: '20px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = hoverShadow}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        onClick={handleClick}
      >
        {/* Image - 1:1 square aspect ratio (Shopify standard) */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'top center' }}
          />
        </div>

        {/* Content - Figma: px-16, pt-14, pb-16, gap-12 */}
        <div className="flex flex-col gap-3" style={{ padding: '14px 16px 16px 16px' }}>
          {/* AI-generated pitch - 14px, line-height 1.3, #14161a, max 3 lines */}
          <p 
            className="overflow-hidden line-clamp-3"
            style={{ 
              fontSize: '14px', 
              lineHeight: '1.3', 
              color: '#14161a',
            }}
          >
            {product.aiReasoning || generateMockReasoning(product)}
          </p>
          
          {/* Price + Name row - 13px, #6c6f74 */}
          <div 
            className="flex items-start gap-1"
            style={{ fontSize: '13px', lineHeight: '1.5', color: '#6c6f74' }}
          >
            <span className="shrink-0">{formatPriceCompact(product.price)}</span>
            <span className="shrink-0">•</span>
            <span className="truncate flex-1 min-w-0">{product.name}</span>
          </div>
        </div>
      </div>
    );
  }

  // List variant layout
  if (variant === 'list') {
    return (
      <div 
        className="flex gap-3 bg-white cursor-pointer flex-shrink-0 transition-shadow"
        style={{
          padding: '12px',
          border: '1px solid rgba(9, 14, 21, 0.1)',
          borderRadius: '16px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = hoverShadow}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        onClick={handleClick}
      >
        {/* Thumbnail */}
        {config.showImage && (
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {config.showPromoBadge && badge && (
              <div 
                className="absolute flex items-center justify-center"
                style={{
                  top: '4px',
                  left: '4px',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(9, 14, 21, 0.7)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 500, color: '#ffffff' }}>
                  {badge.text}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {config.showTitle && (
            <h3 
              className="font-semibold truncate"
              style={{ fontSize: '14px', lineHeight: '1.5', color: '#14161a' }}
            >
              {product.name}
            </h3>
          )}
          
          {config.showDescription && (
            <p 
              className="line-clamp-2"
              style={{ fontSize: '13px', fontWeight: 400, lineHeight: '16px', color: '#6c6f74' }}
            >
              {product.description}
            </p>
          )}

          {config.showRating && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex items-center gap-0.5">
                <img src="/src/components/icons/star-full.svg" alt="" className="w-3 h-3" />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#14161a' }}>{product.rating}</span>
              </div>
              <span style={{ fontSize: '13px', color: '#6c6f74' }}>({product.reviewCount})</span>
            </div>
          )}

          {config.showPrice && (
            <div className="flex items-center gap-2 mt-1">
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#14161a' }}>
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="line-through" style={{ fontSize: '13px', color: '#6c6f74' }}>
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default and compact card layout - Figma specs
  const isCompact = variant === 'compact';
  
  return (
    <div 
      className={`bg-white overflow-clip cursor-pointer transition-shadow ${isCompact ? 'flex-shrink-0 w-[200px] min-w-[200px]' : 'w-full'}`}
      style={{
        border: '1px solid rgba(9, 14, 21, 0.1)',
        borderRadius: '20px',
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = hoverShadow}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
      onClick={handleClick}
    >
      {/* Image Container - 1:1 square aspect ratio (Shopify standard) */}
      <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
        {config.showImage && (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'top center' }}
          />
        )}
        
        {/* Price badge - Figma: top-left, 12px from edges, h-24, dark bg with white text */}
        {config.showPrice && (
          <div 
            className="absolute flex items-center justify-center"
            style={{
              top: '12px',
              left: '12px',
              height: '24px',
              padding: '3px 6px 2px 6px', // Slightly more top padding for visual balance
              borderRadius: '8px',
              backgroundColor: 'rgba(9, 14, 21, 0.4)', // 40% opacity
              backdropFilter: 'blur(20px)',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', lineHeight: '1.5' }}>
              {formatPrice(product.price)}
            </span>
          </div>
        )}

        {/* Promo Badge - top-right to avoid conflict with price */}
        {config.showPromoBadge && badge && (
          <div 
            className="absolute flex items-center justify-center"
            style={{
              top: '12px',
              right: '12px',
              height: '24px',
              padding: '3px 6px 2px 6px',
              borderRadius: '8px',
              backgroundColor: 'rgba(9, 14, 21, 0.7)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#ffffff', lineHeight: '1.5' }}>
              {badge.text}
            </span>
          </div>
        )}
      </div>

      {/* Content - Figma: px-16, pt-14, pb-16 */}
      <div style={{ padding: '14px 16px 16px 16px' }}>
        {/* Figma: gap-8px with description, gap-4px without description */}
        <div 
          className="flex flex-col"
          style={{ gap: config.showDescription ? '8px' : '4px' }}
        >
          {/* Title + Description block - Figma: gap-2px */}
          <div className="flex flex-col" style={{ gap: '2px' }}>
            {config.showTitle && (
              <h3 
                className="truncate"
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  lineHeight: '1.5', 
                  color: '#14161a',
                }}
              >
                {product.name}
              </h3>
            )}

            {config.showDescription && (
              <p 
                className="line-clamp-2"
                style={{ 
                  fontSize: '13px', 
                  fontWeight: 400,
                  lineHeight: '16px', 
                  color: '#6c6f74',
                  minHeight: '32px', // 2 lines (16px * 2) to keep ratings aligned
                }}
              >
                {product.description}
              </p>
            )}
          </div>

          {/* Rating - Figma: star-12 + rating (Medium 13px #14161a) + count (Regular 13px #6c6f74) */}
          {config.showRating && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                <img src="/src/components/icons/star-full.svg" alt="" className="w-3 h-3" />
                <span style={{ fontSize: '13px', fontWeight: 500, lineHeight: '1.5', color: '#14161a' }}>
                  {product.rating}
                </span>
              </div>
              <span style={{ fontSize: '13px', lineHeight: '1.5', color: '#6c6f74' }}>
                ({product.reviewCount})
              </span>
            </div>
          )}
        </div>

        {/* Large CTA Button */}
        {config.showViewDetailsLarge && (
          <button 
            className="w-full mt-4 py-2 text-sm border rounded-lg hover:bg-neutral-50 transition-colors"
            style={{ color: '#14161a', borderColor: 'rgba(9, 14, 21, 0.1)' }}
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
          >
            View details
          </button>
        )}

        {/* Add to Cart CTA */}
        {config.showAddToCart && (
          <button 
            className="w-full mt-2 py-2 text-sm text-white bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
            onClick={(e) => { e.stopPropagation(); console.log('Add to cart:', product.id); }}
          >
            Add to cart
          </button>
        )}
      </div>
    </div>
  );
}

// Generate mock AI reasoning based on product attributes
// In production, this comes from the LLM based on user query context
function generateMockReasoning(product: Product): string {
  const reasonings: Record<string, string[]> = {
    lighting: [
      "Modern iconic design, great reviews, energy efficient light bulb",
      "Contemporary design with adjustable arm, perfect for reading and focused work",
      "Minimalist aesthetic that complements any workspace, excellent build quality",
      "Sleek design with warm ambient lighting, highly rated for home offices",
      "Award-winning design with smart dimming features, perfect for modern spaces",
    ],
    furniture: [
      "Clean lines and solid construction, would fit perfectly in a modern space",
      "Versatile piece with excellent reviews for comfort and durability",
      "Scandinavian-inspired design, customers love the natural wood finish",
      "Space-efficient design perfect for smaller rooms, easy assembly",
    ],
    clothing: [
      "Great for running on treadmill, excellent arch support and breathable mesh",
      "Versatile style that works for gym or casual wear, highly rated comfort",
      "Premium materials with reinforced stitching, perfect for high-intensity workouts",
      "Lightweight and responsive, customers rave about the cushioning",
    ],
    electronics: [
      "Top-rated for reliability and performance, great value for features",
      "Excellent battery life and build quality, perfect for daily use",
      "Latest generation with improved features, consistently positive reviews",
    ],
    food: [
      "Organic and sustainably sourced, customers love the authentic flavor",
      "Perfect balance of nutrition and taste, great for healthy snacking",
      "Premium quality ingredients, highly rated by health-conscious buyers",
    ],
    beauty: [
      "Dermatologist recommended, great for sensitive skin types",
      "Clean ingredients and visible results, customers see improvement quickly",
      "Luxurious feel without the luxury price, excellent value",
    ],
    pets: [
      "Vet-approved formula, dogs love the taste and owners notice healthier coats",
      "High-quality protein sources, great for active pets",
      "Grain-free option that's easy to digest, highly rated by pet parents",
    ],
    books: [
      "Critically acclaimed with engaging narrative, hard to put down",
      "Thought-provoking read with excellent reviews, perfect for book clubs",
      "Beautifully written with memorable characters, a modern classic",
    ],
    default: [
      "Highly rated by customers, excellent quality for the price",
      "Popular choice with consistent positive feedback",
      "Great value with premium features, customers recommend it",
    ],
  };

  const categoryReasonings = reasonings[product.category] || reasonings.default;
  // Use product ID to get consistent reasoning for the same product
  const index = parseInt(product.id.replace(/\D/g, ''), 10) % categoryReasonings.length;
  return categoryReasonings[index];
}
