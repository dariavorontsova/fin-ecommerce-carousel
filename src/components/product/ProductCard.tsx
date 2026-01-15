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
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  };

  // Get badge info
  const getBadge = () => {
    if (!product.tags?.length) return null;
    if (product.tags.includes('sale')) return { text: 'Sale', color: 'bg-red-500' };
    if (product.tags.includes('new')) return { text: 'New', color: 'bg-neutral-900' };
    if (product.tags.includes('bestseller')) return { text: 'Best Seller', color: 'bg-amber-500' };
    if (product.tags.includes('limited')) return { text: 'Limited', color: 'bg-purple-500' };
    if (product.tags.includes('eco-friendly')) return { text: 'Eco', color: 'bg-green-500' };
    return null;
  };

  // Get variant text
  const getVariantText = () => {
    if (!product.variants?.length) return null;
    const variant = product.variants[0];
    return `${variant.options.length} ${variant.type}s available`;
  };

  const badge = getBadge();
  const variantText = getVariantText();

  // AI Reasoning Mode - shows LLM-generated pitch instead of metadata
  if (aiReasoningMode) {
    return (
      <div 
        className="bg-white rounded-card border border-neutral-200 overflow-hidden hover:border-neutral-300 hover:shadow-card transition-all cursor-pointer flex-shrink-0 w-[200px] min-w-[200px]"
        onClick={handleClick}
      >
        {/* Image */}
        <div className="relative bg-neutral-50 h-[160px]">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* AI Reasoning Content */}
        <div className="p-3">
          {/* AI-generated pitch */}
          <p className="text-neutral-800 text-sm leading-relaxed font-medium">
            {product.aiReasoning || generateMockReasoning(product)}
          </p>
          
          {/* Minimal metadata: price + name */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-100">
            <span className="text-neutral-500 text-sm">
              {formatPrice(product.price)}
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500 text-sm truncate">
              {product.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // List variant layout
  if (variant === 'list') {
    return (
      <div 
        className="flex gap-3 p-3 bg-white rounded-card border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer flex-shrink-0"
        onClick={handleClick}
      >
        {/* Thumbnail */}
        {config.showImage && (
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-50">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {config.showPromoBadge && badge && (
              <span className={`absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium text-white rounded ${badge.color}`}>
                {badge.text}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {config.showTitle && (
            <h3 className="font-medium text-neutral-900 text-sm truncate">
              {product.name}
            </h3>
          )}
          
          {config.showDescription && (
            <p className="text-neutral-500 text-xs line-clamp-2 mt-0.5">
              {product.description}
            </p>
          )}

          {config.showRating && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-amber-500 text-xs">★</span>
              <span className="text-xs text-neutral-700">{product.rating}</span>
              <span className="text-xs text-neutral-400">({product.reviewCount})</span>
            </div>
          )}

          {config.showPrice && (
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-neutral-900 text-sm">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-neutral-400 text-xs line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default and compact card layout
  const isCompact = variant === 'compact';
  
  return (
    <div 
      className={`
        bg-white rounded-card border border-neutral-200 overflow-hidden
        hover:border-neutral-300 hover:shadow-card transition-all cursor-pointer
        flex-shrink-0
        ${isCompact ? 'w-[160px] min-w-[160px]' : 'w-[180px] min-w-[180px]'}
      `}
      onClick={handleClick}
    >
      {/* Image Container */}
      {config.showImage && (
        <div className={`relative bg-neutral-50 ${isCompact ? 'h-[120px]' : 'h-[140px]'}`}>
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
          
          {/* Price overlay (optional placement) */}
          {config.showPrice && (
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
              <span className="font-semibold text-neutral-900 text-sm">
                {formatPrice(product.price)}
              </span>
            </div>
          )}

          {/* Badge */}
          {config.showPromoBadge && badge && (
            <span className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-medium text-white rounded ${badge.color}`}>
              {badge.text}
            </span>
          )}

          {/* Quick action icon (compact view) */}
          {config.showViewDetailsCompact && (
            <button 
              className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 10L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M5 4H10V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`p-3 ${isCompact ? 'p-2' : 'p-3'}`}>
        {config.showTitle && (
          <h3 className={`font-medium text-neutral-900 truncate ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {product.name}
          </h3>
        )}

        {config.showRating && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={`text-xs ${star <= Math.floor(product.rating) ? 'text-amber-500' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-neutral-400">({product.reviewCount})</span>
          </div>
        )}

        {config.showDescription && !isCompact && (
          <p className="text-neutral-500 text-xs line-clamp-2 mt-1">
            {product.description}
          </p>
        )}

        {config.showVariants && variantText && (
          <p className="text-neutral-500 text-xs mt-1">
            {variantText}
          </p>
        )}

        {/* Large CTA Button */}
        {config.showViewDetailsLarge && (
          <button 
            className="w-full mt-3 py-2 text-sm text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
          >
            View details
          </button>
        )}

        {/* Add to Cart CTA */}
        {config.showAddToCart && (
          <button 
            className="w-full mt-2 py-2 text-sm text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
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
