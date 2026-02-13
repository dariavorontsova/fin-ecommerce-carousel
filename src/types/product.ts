// 12 focused categories per PRD (line 141)
export type ProductCategory =
  | 'lighting'
  | 'furniture'
  | 'clothing'
  | 'electronics'
  | 'food'
  | 'beauty'
  | 'sports'
  | 'kids'
  | 'pets'
  | 'kitchen'
  | 'garden'
  | 'books';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // For sale items
  currency: string;
  image: string;
  images?: string[]; // Multiple images for gallery view
  rating: number; // 0-5
  reviewCount: number;
  description: string;
  category: ProductCategory;
  subcategory: string; // More specific: "desk lamps", "running shoes", "dog food"
  brand: string;
  
  // Universal variants
  variants?: ProductVariant[];
  tags?: ProductTag[];
  inStock: boolean;
  
  // Category-specific attributes (not all products have all)
  attributes?: ProductAttributes;
  
  // AI-generated reasoning (populated by LLM based on user query context)
  // Example: "Modern iconic design that would complement your workspace. Great reviews and energy efficient."
  aiReasoning?: string;
}

export interface ProductVariant {
  type: 'color' | 'size' | 'material' | 'flavor' | 'scent' | 'format';
  options: string[];
}

export type ProductTag = 
  | 'sale' 
  | 'new' 
  | 'bestseller' 
  | 'limited' 
  | 'eco-friendly'
  | 'organic'
  | 'vegan'
  | 'gluten-free'
  | 'handmade'
  | 'premium'
  | 'educational';

// Category-specific attributes
export interface ProductAttributes {
  // Clothing
  gender?: 'men' | 'women' | 'unisex' | 'kids';
  sizes?: string[]; // S, M, L, XL or 6, 8, 10, 12 or EU 36-42
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';
  occasion?: string; // casual, formal, athletic, outdoor
  
  // Electronics
  compatibility?: string[]; // iPhone 15, Samsung Galaxy, etc.
  specs?: Record<string, string>; // { "Battery": "10hrs", "Storage": "256GB" }
  warrantyYears?: number;
  
  // Food
  dietary?: string[]; // vegan, vegetarian, keto, paleo
  allergens?: string[]; // nuts, dairy, gluten, soy
  organic?: boolean;
  servingSize?: string;
  expiryDays?: number;
  
  // Beauty
  skinType?: string[]; // dry, oily, combination, sensitive
  concerns?: string[]; // acne, aging, hydration, brightening
  ingredients?: string[]; // key ingredients
  volume?: string; // 50ml, 100ml
  
  // Kids
  ageRange?: string; // "0-2", "3-5", "6-8", "9-12"
  safetyWarnings?: string[];
  educational?: boolean;
  
  // Pets
  petType?: 'dog' | 'cat' | 'bird' | 'fish' | 'small-animal';
  petSize?: 'small' | 'medium' | 'large' | 'all';
  lifeStage?: 'puppy' | 'adult' | 'senior' | 'all';
  
  // Sports
  activityType?: string; // running, yoga, cycling, hiking
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  
  // Garden
  sunRequirement?: 'full-sun' | 'partial-shade' | 'shade';
  wateringFrequency?: 'daily' | 'weekly' | 'monthly';
  indoorOutdoor?: 'indoor' | 'outdoor' | 'both';
  
  // Furniture/Home
  roomType?: string[]; // bedroom, living room, office
  dimensions?: { width: number; height: number; depth: number; unit: string };
  material?: string;
  assemblyRequired?: boolean;
  
  // Books
  author?: string;
  genre?: string;
  format?: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
  pages?: number;
  language?: string;
}

// Card configuration for UI toggles
export interface CardConfig {
  showImage: boolean;
  showTitle: boolean;
  showPrice: boolean;
  showRating: boolean;
  showDescription: boolean;
  showVariants: boolean;
  showPromoBadge: boolean;
  showAddToCart: boolean;
  showViewDetailsLarge: boolean;
  showViewDetailsCompact: boolean;
}

// Layout options
export type CardLayout = 'carousel' | 'list' | 'grid';
export type MessengerState = 'default' | 'expanded';

// Card design variants
export type CardDesign = 'current' | 'proposed' | 'borderless';

// Image ratio options for grid cards
// Landscape: height = width × 0.75 (4:3)
// Square: height = width × 1.0 (1:1)
// Portrait: height = width × 1.333 (3:4)
export type ImageRatio = 'landscape' | 'square' | 'portrait';

export const IMAGE_RATIO_VALUES: Record<ImageRatio, string> = {
  landscape: '4 / 3',
  square: '1 / 1',
  portrait: '3 / 4',
};

// Default card configuration
export const DEFAULT_CARD_CONFIG: CardConfig = {
  showImage: true,
  showTitle: true,
  showPrice: true,
  showRating: false,  // Off by default - AI reasoning is the differentiator
  showDescription: true,  // On by default
  showVariants: false,
  showPromoBadge: false, // Disabled - not using promo badges
  showAddToCart: false,
  showViewDetailsLarge: true,
  showViewDetailsCompact: false,
};

// Category display names
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  'lighting': 'Lighting',
  'furniture': 'Furniture',
  'clothing': 'Clothing',
  'electronics': 'Electronics',
  'food': 'Food & Drink',
  'beauty': 'Beauty',
  'sports': 'Sports & Outdoors',
  'kids': 'Kids & Baby',
  'pets': 'Pets',
  'kitchen': 'Kitchen',
  'garden': 'Garden & Outdoor',
  'books': 'Books',
};
