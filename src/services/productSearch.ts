/**
 * On-demand product search service
 * Fetches from HuggingFace ASOS dataset, filters, and searches
 */

import { Product, ProductCategory } from '../types/product';

const CSV_URL = 'https://huggingface.co/datasets/TrainingDataPro/asos-e-commerce-dataset/resolve/main/products_asos.csv';

// Words that make items inappropriate for work
const EXCLUDED_KEYWORDS = [
  'mini skirt', 'miniskirt', 'mini dress', 'minidress',
  'bikini', 'swimsuit', 'swim short', 'swimwear',
  'bra ', 'bralette', 'brief', 'thong', 'knicker', 'underwear', 'lingerie',
  'bodycon', 'cut-out', 'cutout', 'plunge', 'low cut',
];

// Subcategory detection keywords
const SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
  'jackets': ['jacket', 'bomber', 'biker', 'puffer'],
  'coats': ['coat', 'trench', 'parka', 'overcoat'],
  'blazers': ['blazer', 'suit jacket'],
  'tops': ['top', 'cami', 'bodysuit', 'crop top', 'tank'],
  'shirts': ['shirt', 'oxford', 'flannel'],
  'blouses': ['blouse'],
  't-shirts': ['t-shirt', 'tee ', 'tshirt'],
  'jumpers': ['jumper', 'sweater', 'pullover'],
  'cardigans': ['cardigan'],
  'hoodies': ['hoodie', 'hoody'],
  'sweatshirts': ['sweatshirt', 'fleece'],
  'dresses': ['dress'],
  'skirts': ['skirt'],
  'jeans': ['jeans', 'jean '],
  'trousers': ['trouser', 'chino', 'pant', 'cargo', 'jogger'],
  'shorts': ['shorts'],
  'trainers': ['trainer', 'sneaker', 'running shoe'],
  'boots': ['boot', 'chelsea'],
  'heels': ['heel', 'stiletto', 'court shoe', 'pump'],
  'sandals': ['sandal', 'slider'],
  'loafers': ['loafer', 'moccasin'],
  'flats': ['flat', 'ballet', 'ballerina'],
  'bags': ['bag', 'tote', 'clutch', 'purse', 'handbag', 'satchel'],
  'backpacks': ['backpack', 'rucksack'],
  'scarves': ['scarf', 'snood'],
  'hats': ['hat', 'cap', 'beanie', 'beret'],
  'belts': ['belt'],
  'sunglasses': ['sunglasses', 'sunnies'],
  'jewellery': ['necklace', 'bracelet', 'earring', 'ring ', 'chain', 'pendant'],
};

// Brand extraction
const BRANDS = [
  'ASOS DESIGN', 'ASOS', 'Nike', 'Adidas', 'Puma', 'New Balance', 'Reebok',
  'Tommy Hilfiger', 'Tommy Jeans', "Levi's", 'Calvin Klein', 'Guess',
  'Dr Martens', 'Converse', 'Vans', 'New Look', 'River Island',
  'Topshop', 'Topman', 'Miss Selfridge', 'Monki', 'Weekday', 'Bershka',
  'Stradivarius', 'Mango', 'Carhartt', 'The North Face', 'Columbia',
  'Timberland', 'Ted Baker', 'French Connection', 'AllSaints', 'Whistles',
  'Reiss', 'Karen Millen', 'Barbour', 'Superdry', 'Jack & Jones',
  'Only & Sons', 'Vero Moda', 'Selected', 'Noisy May', 'Pieces',
  'VAI21', 'COLLUSION', 'Reclaimed Vintage', '4th & Reckless',
];

// Cached catalog
let catalogCache: Product[] | null = null;
let fetchPromise: Promise<Product[]> | null = null;

export interface SearchOptions {
  query?: string;
  subcategory?: string;
  maxResults?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResult {
  products: Product[];
  totalMatches: number;
  searchTime: number;
  fromCache: boolean;
}

/**
 * Parse a CSV line handling quoted fields with commas
 */
function parseCSVLine(line: string): Record<string, string> {
  const result: Record<string, string> = {};
  let pos = 0;
  const fields = ['url', 'name', 'sizes', 'category', 'price', 'color', 'sku', 'description', 'images'];
  
  for (const field of fields) {
    if (pos >= line.length) break;
    
    let value = '';
    
    if (line[pos] === '"') {
      pos++;
      let inQuote = true;
      while (pos < line.length && inQuote) {
        if (line[pos] === '"') {
          if (line[pos + 1] === '"') {
            value += '"';
            pos += 2;
          } else {
            inQuote = false;
            pos++;
          }
        } else {
          value += line[pos];
          pos++;
        }
      }
      if (line[pos] === ',') pos++;
    } else {
      while (pos < line.length && line[pos] !== ',') {
        value += line[pos];
        pos++;
      }
      pos++;
    }
    
    result[field] = value;
  }
  
  return result;
}

/**
 * Check if product is inappropriate for work
 */
function isInappropriate(name: string, description: string = ''): boolean {
  const textToCheck = (name + ' ' + description).toLowerCase();
  return EXCLUDED_KEYWORDS.some(kw => textToCheck.includes(kw));
}

/**
 * Detect subcategory from product name
 */
function detectSubcategory(name: string): string | null {
  const lowerName = name.toLowerCase();
  for (const [subcat, keywords] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lowerName.includes(kw)) return subcat;
    }
  }
  return null;
}

/**
 * Extract brand from product name
 */
function extractBrand(name: string): string {
  for (const brand of BRANDS) {
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return 'ASOS';
}

/**
 * Parse and clean product description
 */
function parseDescription(descStr: string): string | null {
  if (!descStr) return null;
  
  let rawDetails: string | null = null;
  
  try {
    const jsonStr = descStr.replace(/'/g, '"').replace(/""([^"]+)""/g, "'$1'");
    const parsed = JSON.parse(jsonStr);
    
    for (const item of parsed) {
      if (item['Product Details']) {
        rawDetails = item['Product Details'];
        break;
      }
    }
  } catch {
    const match = descStr.match(/Product Details['"]: ['"]([^}]+)/);
    if (match) {
      rawDetails = match[1].replace(/['"]\s*\}.*$/, '').trim();
    }
  }
  
  if (!rawDetails) return null;
  
  let cleaned = rawDetails;
  
  // Remove suffix and common patterns
  cleaned = cleaned.replace(/Product Code:\s*\d+['"]?$/, '').trim();
  cleaned = cleaned.replace(/Exclusive to ASOS/gi, ' ');
  cleaned = cleaned.replace(/Part of a co-ord/gi, ' ');
  cleaned = cleaned.replace(/Sold separately/gi, '');
  
  // Remove "[Category] by [Brand]" prefix
  const featurePatterns = [
    /Toggle\s/i, /Zip\s/i, /Button\s/i, /High\s/i, /Low\s/i, /Spread\s/i, /Notch\s/i,
    /Regular\sfit/i, /Relaxed\sfit/i, /Oversized\sfit/i, /Slim\sfit/i,
    /Side\s/i, /Front\s/i, /Functional\s/i, /Logo\s/i,
    /Hit\sthat/i, /Love\sat/i, /Throw\son/i, /Jacket\supgrade/i, /That\snew/i,
    /The\sdenim/i, /Welcome\sto/i, /Mid-season/i, /V-neck/i, /Crew\sneck/i,
  ];
  
  const byMatch = cleaned.match(/\sby\s/i);
  if (byMatch && byMatch.index !== undefined) {
    const afterBy = cleaned.substring(byMatch.index + 4);
    
    let earliestPos = afterBy.length;
    for (const pattern of featurePatterns) {
      const match = afterBy.match(pattern);
      if (match && match.index !== undefined && match.index < earliestPos) {
        earliestPos = match.index;
      }
    }
    
    if (earliestPos < afterBy.length) {
      cleaned = afterBy.substring(earliestPos);
    }
  }
  
  // Add periods between smooshed words
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1. $2');
  cleaned = cleaned.replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1. $2');
  
  // Clean up
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\.\s*\./g, '.');
  cleaned = cleaned.replace(/^\.\s*/, '');
  cleaned = cleaned.replace(/^[,.\s]+/, '');
  
  if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.';
  }
  
  if (cleaned) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned || null;
}

/**
 * Fetch and parse the full catalog from HuggingFace
 * Returns cached version if available
 */
async function fetchCatalog(): Promise<Product[]> {
  // Return cache if available
  if (catalogCache) {
    return catalogCache;
  }
  
  // If already fetching, wait for that promise
  if (fetchPromise) {
    return fetchPromise;
  }
  
  // Start fetching
  fetchPromise = (async () => {
    console.log('[ProductSearch] Fetching catalog from HuggingFace...');
    const startTime = Date.now();
    
    const res = await fetch(CSV_URL);
    const text = await res.text();
    const lines = text.split('\n');
    
    console.log(`[ProductSearch] Parsing ${lines.length - 1} rows...`);
    
    const products: Product[] = [];
    const seenNames = new Set<string>();
    const seenImages = new Set<string>();
    let productId = 1;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const parsed = parseCSVLine(line);
      if (!parsed.name || !parsed.price) continue;
      
      const price = parseFloat(parsed.price);
      if (isNaN(price) || price < 5 || price > 2000) continue;
      
      const imageMatch = line.match(/https:\/\/images\.asos-media\.com\/products\/[^'"\s,\]]+/);
      if (!imageMatch) continue;
      
      const imageUrl = imageMatch[0].split('?')[0];
      if (seenImages.has(imageUrl)) continue;
      
      const name = parsed.name.trim();
      if (!name || name.length < 10 || seenNames.has(name.toLowerCase())) continue;
      
      const subcategory = detectSubcategory(name);
      if (!subcategory) continue;
      
      const description = parseDescription(parsed.description) || '';
      
      // Skip inappropriate content
      if (isInappropriate(name, parsed.description || '')) continue;
      
      // Parse sizes
      let sizes: string[] = [];
      if (parsed.sizes) {
        sizes = parsed.sizes.split(',').map(s => s.trim()).filter(s => s && !s.includes('Out of stock'));
      }
      
      // Clean color
      let color = parsed.color?.trim() || 'Multi';
      if (color.length > 30) color = 'Multi';
      
      const brand = extractBrand(name);
      
      seenNames.add(name.toLowerCase());
      seenImages.add(imageUrl);
      
      products.push({
        id: `asos-${productId++}`,
        name,
        price,
        currency: 'GBP',
        image: imageUrl,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        reviewCount: Math.floor(50 + Math.random() * 500),
        description,
        category: 'clothing' as ProductCategory,
        subcategory,
        brand,
        inStock: true,
        tags: Math.random() > 0.8 ? ['new'] : [],
        variants: [
          { type: 'color' as const, options: [color] },
          ...(sizes.length > 0 ? [{ type: 'size' as const, options: sizes }] : []),
        ],
        attributes: {
          gender: 'unisex' as const,
          sizes,
        },
      });
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`[ProductSearch] Loaded ${products.length} products in ${elapsed}ms`);
    
    catalogCache = products;
    return products;
  })();
  
  return fetchPromise;
}

/**
 * Search products by query and/or filters
 * This is the main entry point for on-demand search
 */
export async function searchProducts(options: SearchOptions = {}): Promise<SearchResult> {
  const startTime = Date.now();
  const fromCache = catalogCache !== null;
  
  // Fetch catalog (uses cache if available)
  const catalog = await fetchCatalog();
  
  let results = [...catalog];
  
  // Filter by query (search in name, description, brand, subcategory)
  if (options.query) {
    const query = options.query.toLowerCase();
    const queryWords = query.split(/\s+/).filter(w => w.length > 2);
    
    results = results.filter(p => {
      const searchText = `${p.name} ${p.description} ${p.brand} ${p.subcategory}`.toLowerCase();
      return queryWords.some(word => searchText.includes(word));
    });
  }
  
  // Filter by subcategory
  if (options.subcategory) {
    results = results.filter(p => p.subcategory === options.subcategory);
  }
  
  // Filter by price range
  if (options.minPrice !== undefined) {
    results = results.filter(p => p.price >= options.minPrice!);
  }
  if (options.maxPrice !== undefined) {
    results = results.filter(p => p.price <= options.maxPrice!);
  }
  
  const totalMatches = results.length;
  
  // Limit results
  if (options.maxResults) {
    results = results.slice(0, options.maxResults);
  }
  
  const searchTime = Date.now() - startTime;
  
  return {
    products: results,
    totalMatches,
    searchTime,
    fromCache,
  };
}

/**
 * Get available subcategories from the catalog
 */
export async function getSubcategories(): Promise<string[]> {
  const catalog = await fetchCatalog();
  const subcats = new Set(catalog.map(p => p.subcategory));
  return Array.from(subcats).sort();
}

/**
 * Get catalog stats
 */
export async function getCatalogStats(): Promise<{
  totalProducts: number;
  subcategories: Record<string, number>;
  priceRange: { min: number; max: number };
}> {
  const catalog = await fetchCatalog();
  
  const subcategories: Record<string, number> = {};
  let minPrice = Infinity;
  let maxPrice = 0;
  
  for (const p of catalog) {
    subcategories[p.subcategory] = (subcategories[p.subcategory] || 0) + 1;
    if (p.price < minPrice) minPrice = p.price;
    if (p.price > maxPrice) maxPrice = p.price;
  }
  
  return {
    totalProducts: catalog.length,
    subcategories,
    priceRange: { min: minPrice, max: maxPrice },
  };
}

/**
 * Clear the catalog cache (for testing)
 */
export function clearCache(): void {
  catalogCache = null;
  fetchPromise = null;
}

/**
 * Check if catalog is cached
 */
export function isCached(): boolean {
  return catalogCache !== null;
}
