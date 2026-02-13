import React from 'react';
import { motion } from 'framer-motion';
import { Product, CardConfig, DEFAULT_CARD_CONFIG, CardDesign, ImageRatio, IMAGE_RATIO_VALUES } from '../../types/product';
import { ImageGallery } from './ImageGallery';

interface ProductCardProps {
  product: Product;
  config?: Partial<CardConfig>;
  variant?: 'default' | 'compact' | 'list' | 'single';
  cardDesign?: CardDesign;
  imageRatio?: ImageRatio;
  aiReasoningMode?: boolean;
  onClick?: (product: Product) => void;
}

export function ProductCard({ 
  product, 
  config: configOverride,
  variant = 'default',
  cardDesign = 'current',
  imageRatio = 'portrait',
  aiReasoningMode = false,
  onClick 
}: ProductCardProps) {
  const config = { ...DEFAULT_CARD_CONFIG, ...configOverride };
  
  const handleClick = () => {
    onClick?.(product);
  };

  // Format price with currency - drop .00 for whole numbers
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency,
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Compact price format (same as formatPrice now)
  const formatPriceCompact = formatPrice;

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

  // Image aspect ratio:
  // - Grid cards (default variant): controlled by imageRatio selector
  // - Single cards: same as grid, except portrait → square (too tall otherwise)
  // - Compact/carousel: keep their own sizing
  const gridAspectRatio = IMAGE_RATIO_VALUES[imageRatio];
  const singleAspectRatio = imageRatio === 'portrait' ? '1 / 1' : gridAspectRatio;

  // AI Reasoning Mode - Figma spec
  if (aiReasoningMode) {
    const isCompactMode = variant === 'compact';
    const isSingleMode = variant === 'single';
    
    // Single mode: 340px width with square image
    const cardWidth = isSingleMode ? 'w-[340px] max-w-[340px]' : isCompactMode ? 'w-[200px] min-w-[200px]' : 'w-full';
    
    return (
      <div 
        className={`bg-white overflow-clip cursor-pointer flex-shrink-0 transition-shadow ${cardWidth}`}
        style={{
          border: '1px solid rgba(9, 14, 21, 0.1)',
          borderRadius: '20px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = hoverShadow}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        onClick={handleClick}
      >
        {/* Image - gallery for single with multiple images, otherwise single image */}
        {isSingleMode && product.images && product.images.length > 1 ? (
          <div className="relative">
            <ImageGallery 
              images={product.images} 
              alt={product.name}
              aspectRatio={gridAspectRatio}
            />
            {config.showAddToCart && (
              <AddToCartButton productId={product.id} />
            )}
          </div>
        ) : (
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: gridAspectRatio }}>
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'top center' }}
            />
            {config.showAddToCart && (
              <AddToCartButton productId={product.id} />
            )}
          </div>
        )}

        {/* Content - Figma: px-16, pt-14, pb-16, gap-12 */}
        <div className="flex flex-col justify-between" style={{ padding: '14px 16px 16px 16px' }}>
          {/* AI-generated pitch - 14px, line-height 1.3, #14161a, max 3 lines */}
          {/* Fixed height (3 lines * 14px * 1.3 = ~55px) ensures price alignment across cards */}
          <p 
            className="overflow-hidden line-clamp-3 mb-3"
            style={{ 
              fontSize: '14px', 
              lineHeight: '1.3', 
              color: '#14161a',
              minHeight: '55px', // 3 lines worth of height for consistent alignment
            }}
          >
            {product.aiReasoning || generateMockReasoning(product)}
          </p>
          
          {/* Price + Name row - 13px, #6c6f74 - always at bottom */}
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

  // Proposed Design - Figma "Proposed" variant
  if (cardDesign === 'proposed') {
    const isCompact = variant === 'compact';
    const isSingle = variant === 'single';
    const isList = variant === 'list';

    // Skip list variant - proposed design is only for carousel/grid
    if (isList) {
      // Fall through to default list rendering below
    } else {
      // Determine width based on variant - S size for compact, M size for single/default
      const widthClass = isCompact ? 'w-[180px] min-w-[180px]' : isSingle ? 'w-[340px] max-w-[340px]' : 'w-full';
      // Grid cards use the imageRatio selector; single cards use singleAspectRatio (portrait→square)
      const imageAspectRatio = (variant === 'default') ? gridAspectRatio : singleAspectRatio;

      return (
        <div
          className={`bg-white overflow-clip cursor-pointer flex-shrink-0 transition-shadow ${widthClass}`}
          style={{
            border: '1px solid rgba(9, 14, 21, 0.1)',
            borderRadius: '20px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = hoverShadow}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          onClick={handleClick}
        >
          {/* Image Container - gallery for single with multiple images, otherwise single image */}
          {isSingle && product.images && product.images.length > 1 ? (
            <div className="relative">
              <ImageGallery 
                images={product.images} 
                alt={product.name}
                aspectRatio={imageAspectRatio}
              />
              {/* Add to Cart CTA - anchored bottom-right, expands left on button hover */}
              {config.showAddToCart && (
                <AddToCartButton productId={product.id} />
              )}
            </div>
          ) : (
            <div className="relative w-full" style={{ aspectRatio: imageAspectRatio }}>
              {config.showImage && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'top center' }}
                />
              )}
              {/* Add to Cart CTA - anchored bottom-right, expands left on button hover */}
              {config.showAddToCart && (
                <AddToCartButton productId={product.id} />
              )}
            </div>
          )}

          {/* Content - Figma: px-16, py-14 */}
          <div style={{ padding: '14px 16px' }}>
            <div className="flex flex-col" style={{ gap: config.showDescription ? '8px' : '2px' }}>
              {/* Title + Description block */}
              <div className="flex flex-col" style={{ gap: '2px' }}>
                {config.showTitle && (
                  <p
                    className="truncate"
                    style={{
                      fontSize: '14px',
                      fontWeight: 400, // Regular font, not bold
                      lineHeight: '1.5',
                      color: '#14161a',
                    }}
                  >
                    {product.name}
                  </p>
                )}

                {config.showDescription && (
                  <p
                    className="line-clamp-2 overflow-hidden"
                    style={{
                      fontSize: '13px',
                      fontWeight: 400,
                      lineHeight: '16px',
                      color: '#6c6f74',
                    }}
                  >
                    {product.description}
                  </p>
                )}
              </div>

              {/* Price + Rating row */}
              <div className="flex items-center gap-2">
                {config.showPrice && (
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      lineHeight: '1.5',
                      color: '#090e15',
                    }}
                  >
                    {formatPrice(product.price)}
                  </span>
                )}

                {config.showRating && (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {/* Star icon - inline SVG with same color as text */}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path 
                          d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z" 
                          fill="#6c6f74"
                        />
                      </svg>
                      <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.5', color: '#6c6f74' }}>
                        {product.rating}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Borderless Design - no card border, rounded image corners
  if (cardDesign === 'borderless') {
    const isCompact = variant === 'compact';
    const isSingle = variant === 'single';
    const isList = variant === 'list';

    if (isList) {
      // Fall through to default list rendering below
    } else {
      const widthClass = isCompact ? 'w-[180px] min-w-[180px]' : isSingle ? 'w-[340px] max-w-[340px]' : 'w-full';
      // Grid cards use the imageRatio selector; single cards use singleAspectRatio (portrait→square)
      const imageAspectRatio = (variant === 'default') ? gridAspectRatio : singleAspectRatio;

      // Figma: details container has fixed height 82px for consistent card heights
      // With description: title wraps up to 2 lines, 8px gap to price row
      // Without description: title is 1 line truncated, 4px gap to price row
      // The fixed height ensures alignment across cards regardless of content length
      const hasDescription = config.showDescription;

      const [isHovered, setIsHovered] = React.useState(false);

      return (
        <div
          className={`cursor-pointer flex-shrink-0 flex flex-col ${widthClass}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
        >
          {/* Image - gallery for single with multiple images, otherwise single image */}
          {isSingle && product.images && product.images.length > 1 ? (
            <div
              className="relative w-full overflow-hidden"
              style={{
                borderRadius: '20px',
              }}
            >
              <ImageGallery 
                images={product.images} 
                alt={product.name}
                aspectRatio={imageAspectRatio}
              />
              {/* Hover border overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: '20px',
                  boxShadow: isHovered ? 'inset 0 0 0 1px rgba(9, 14, 21, 0.2)' : 'none',
                  transition: 'box-shadow 0.15s ease-out',
                  zIndex: 5,
                }}
              />
              {/* Add to Cart CTA */}
              {config.showAddToCart && (
                <AddToCartButton productId={product.id} />
              )}
            </div>
          ) : (
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: imageAspectRatio,
                borderRadius: '20px',
              }}
            >
              {config.showImage && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'top center' }}
                />
              )}

              {/* Hover border overlay - rendered ON TOP of image */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: '20px',
                  boxShadow: isHovered ? 'inset 0 0 0 1px rgba(9, 14, 21, 0.2)' : 'none',
                  transition: 'box-shadow 0.15s ease-out',
                  zIndex: 5,
                }}
              />

              {/* Add to Cart CTA */}
              {config.showAddToCart && (
                <AddToCartButton productId={product.id} />
              )}
            </div>
          )}

          {/* Details - Figma: padding 8px */}
          {/* With description: 8px gap between (title+desc) and price. Without: 4px gap */}
          {/* No description: fixed 82px (2-line title + price fits). With description: grows naturally */}
          <div
            className="flex flex-col"
            style={{
              padding: '8px',
              gap: hasDescription ? '8px' : '4px',
              ...(!hasDescription ? { height: '82px' } : {}),
            }}
          >
            {/* Title + Description block */}
            <div className="flex flex-col" style={{ gap: '2px' }}>
              {config.showTitle && (
                <p
                  className={hasDescription ? 'truncate' : 'line-clamp-2'}
                  style={{
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '1.5',
                    color: '#14161a',
                  }}
                >
                  {product.name}
                </p>
              )}
              {hasDescription && (
                <p
                  className="line-clamp-2"
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    lineHeight: '16px',
                    color: '#6c6f74',
                  }}
                >
                  {product.description}
                </p>
              )}
            </div>

            {/* Price + Rating row - sticks directly below title/description */}
            <div className="flex items-center gap-2">
              {config.showPrice && (
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    lineHeight: '1.5',
                    color: '#090e15',
                  }}
                >
                  {formatPrice(product.price)}
                </span>
              )}

              {config.showRating && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
                        fill="#6c6f74"
                      />
                    </svg>
                    <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.5', color: '#6c6f74' }}>
                      {product.rating}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
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
                <img src="/icons/star-full.svg" alt="" className="w-3 h-3" />
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

  // Default, compact, and single card layout - Figma specs
  const isCompact = variant === 'compact';
  const isSingle = variant === 'single';
  
  // Single cards: 340px width
  const widthClass = isSingle ? 'w-[340px] max-w-[340px]' : isCompact ? 'flex-shrink-0 w-[200px] min-w-[200px]' : 'w-full';
  // Grid cards use the imageRatio selector; single cards use singleAspectRatio (portrait→square)
  const imageAspectRatio = (variant === 'default') ? gridAspectRatio : singleAspectRatio;
  
  return (
    <div 
      className={`bg-white overflow-clip cursor-pointer transition-shadow ${widthClass}`}
      style={{
        border: '1px solid rgba(9, 14, 21, 0.1)',
        borderRadius: '20px',
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = hoverShadow}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
      onClick={handleClick}
    >
      {/* Image Container - gallery for single with multiple images, otherwise single image */}
      {isSingle && product.images && product.images.length > 1 ? (
        <div className="relative">
          <ImageGallery 
            images={product.images} 
            alt={product.name}
            aspectRatio={imageAspectRatio}
          />
          {/* Price badge overlaid on gallery */}
          {config.showPrice && (
            <div 
              className="absolute flex items-center justify-center"
              style={{
                top: '12px',
                left: '12px',
                height: '24px',
                padding: '3px 6px 2px 6px',
                borderRadius: '8px',
                backgroundColor: 'rgba(9, 14, 21, 0.4)',
                backdropFilter: 'blur(20px)',
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', lineHeight: '1.5' }}>
                {formatPrice(product.price)}
              </span>
            </div>
          )}
          {config.showAddToCart && (
            <AddToCartButton productId={product.id} />
          )}
        </div>
      ) : (
        <div className="relative w-full" style={{ aspectRatio: imageAspectRatio }}>
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
              padding: '3px 6px 2px 6px',
              borderRadius: '8px',
              backgroundColor: 'rgba(9, 14, 21, 0.4)',
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

          {config.showAddToCart && (
            <AddToCartButton productId={product.id} />
          )}
        </div>
      )}

      {/* Content - Figma: px-16, pt-14, pb-16 */}
      <div style={{ padding: '14px 16px 16px 16px' }}>
        {/* gap-12px between description and rating, gap-4px without description */}
        <div 
          className="flex flex-col"
          style={{ gap: config.showDescription ? '12px' : '4px' }}
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

          {/* Rating - 16px height container, 12px star */}
          {config.showRating && (
            <div className="flex items-center gap-1" style={{ height: '16px' }}>
              <div className="flex items-center gap-0.5">
                <img src="/icons/star-full.svg" alt="" className="w-3 h-3" />
                <span style={{ fontSize: '13px', fontWeight: 500, lineHeight: '16px', color: '#14161a' }}>
                  {product.rating}
                </span>
              </div>
              <span style={{ fontSize: '13px', lineHeight: '16px', color: '#6c6f74' }}>
                ({product.reviewCount})
              </span>
            </div>
          )}
        </div>

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

// Add to Cart button with expand-on-hover animation
// Figma: 48w x 40h default, expands left to show label on hover
function AddToCartButton({ productId }: { productId: string }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      className="absolute bottom-[12px] right-[12px] flex items-center cursor-pointer"
      style={{
        height: '40px',
        borderRadius: '9999px',
        backgroundColor: 'white',
        backdropFilter: 'blur(50px)',
        boxShadow: '0px 1px 3px 0px rgba(9, 14, 21, 0.2)',
        padding: '8px 12px',
        overflow: 'hidden',
        border: 'none',
        outline: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        console.log('Add to cart:', productId);
      }}
    >
      <motion.div
        className="flex items-center"
        style={{ gap: '8px' }}
      >
        {/* Label - to the left of icon, clips when collapsed */}
        <motion.span
          initial={false}
          animate={{
            width: isHovered ? 'auto' : 0,
            opacity: isHovered ? 1 : 0,
            marginRight: isHovered ? 0 : -8,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
          style={{
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: '1.5',
            color: '#14161a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            display: 'inline-block',
          }}
        >
          Add to cart
        </motion.span>
        {/* Icon - stays in place on the right */}
        <div className="shrink-0 w-[24px] h-[24px]">
          <img src="/icons/add-to-card.svg" alt="Add to cart" width="24" height="24" />
        </div>
      </motion.div>
    </motion.button>
  );
}
