/**
 * Extract ASOS products with PROPER CSV parsing
 * Fixes: price, color, sizes, description
 */

import { writeFileSync } from 'fs';

const CSV_URL = 'https://huggingface.co/datasets/TrainingDataPro/asos-e-commerce-dataset/resolve/main/products_asos.csv';

// Target subcategories
const TARGET_SUBCATEGORIES = {
  'jackets': 20, 'coats': 18, 'blazers': 12, 'gilets': 8,
  'tops': 18, 'shirts': 15, 'blouses': 10, 't-shirts': 15,
  'jumpers': 15, 'cardigans': 10, 'hoodies': 15, 'sweatshirts': 12,
  'dresses': 20, 'skirts': 12,
  'jeans': 15, 'trousers': 15, 'shorts': 10, 'leggings': 8,
  'trainers': 15, 'boots': 15, 'heels': 10, 'sandals': 10, 'loafers': 8, 'flats': 8,
  'bags': 15, 'backpacks': 8, 'scarves': 8, 'hats': 8, 'belts': 6, 'sunglasses': 6, 'jewellery': 8,
  'swimwear': 8, 'lingerie': 8,
};

const SUBCATEGORY_KEYWORDS = {
  'jackets': ['jacket', 'bomber', 'biker', 'puffer'],
  'coats': ['coat', 'trench', 'parka', 'overcoat', 'mac '],
  'blazers': ['blazer', 'suit jacket'],
  'gilets': ['gilet', ' vest', 'bodywarmer'],
  'tops': ['top', 'cami', 'bodysuit', 'crop top', 'tank'],
  'shirts': ['shirt', 'oxford', 'flannel'],
  'blouses': ['blouse'],
  't-shirts': ['t-shirt', 'tee ', 'tshirt'],
  'jumpers': ['jumper', 'sweater', 'pullover'],
  'cardigans': ['cardigan', 'cardi '],
  'hoodies': ['hoodie', 'hoody'],
  'sweatshirts': ['sweatshirt', 'crew neck sweat', 'fleece'],
  'dresses': ['dress'],
  'skirts': ['skirt'],
  'jeans': ['jeans', 'jean '],
  'trousers': ['trouser', 'chino', 'pant', 'cargo', 'jogger'],
  'shorts': ['shorts', 'short '],
  'leggings': ['legging', 'jegging'],
  'trainers': ['trainer', 'sneaker', 'running shoe'],
  'boots': ['boot', 'chelsea'],
  'heels': ['heel', 'stiletto', 'court shoe', 'pump'],
  'sandals': ['sandal', 'slider', 'flip flop'],
  'loafers': ['loafer', 'moccasin'],
  'flats': ['flat', 'ballet', 'ballerina'],
  'bags': ['bag', 'tote', 'clutch', 'purse', 'handbag', 'satchel'],
  'backpacks': ['backpack', 'rucksack'],
  'scarves': ['scarf', 'snood'],
  'hats': ['hat', 'cap', 'beanie', 'beret', 'bucket hat'],
  'belts': ['belt'],
  'sunglasses': ['sunglasses', 'sunnies'],
  'jewellery': ['necklace', 'bracelet', 'earring', 'ring ', 'chain', 'pendant'],
  'swimwear': ['swimsuit', 'bikini', 'swim short'],
  'lingerie': ['bra ', 'brief', 'thong', 'knicker', 'underwear'],
};

function detectSubcategory(name) {
  const lowerName = name.toLowerCase();
  for (const [subcat, keywords] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lowerName.includes(kw)) return subcat;
    }
  }
  return null;
}

function extractBrand(name) {
  const brands = [
    'ASOS DESIGN', 'ASOS', 'Nike', 'Adidas', 'Puma', 'New Balance', 'Reebok',
    'Tommy Hilfiger', 'Tommy Jeans', "Levi's", 'Calvin Klein', 'Guess',
    'Dr Martens', 'Converse', 'Vans', 'New Look', 'River Island',
    'Topshop', 'Topman', 'Miss Selfridge', 'Monki', 'Weekday', 'Bershka',
    'Stradivarius', 'Pull&Bear', 'Mango', 'Urban Classics', 'Carhartt',
    'The North Face', 'Columbia', 'Timberland', 'Ted Baker', 'French Connection',
    'AllSaints', 'Whistles', 'Reiss', 'Karen Millen', 'Barbour', 'Superdry',
    'Only', 'Vero Moda', 'JDY', 'Pieces', 'Vila', 'Object', 'Selected',
    'Jack & Jones', 'Brave Soul', 'Threadbare', 'Ellesse', 'Champion',
    'COLLUSION', 'Reclaimed Vintage', 'Glamorous', 'Public Desire', 'Raid',
  ];
  for (const brand of brands) {
    if (name.toLowerCase().startsWith(brand.toLowerCase())) return brand;
  }
  return 'ASOS';
}

/**
 * Parse a CSV line properly, handling quoted fields with commas
 * Returns: { url, name, sizes, category, price, color, sku, description, images }
 */
function parseCSVLine(line) {
  const result = {};
  let pos = 0;
  const fields = ['url', 'name', 'sizes', 'category', 'price', 'color', 'sku', 'description', 'images'];
  
  for (const field of fields) {
    if (pos >= line.length) break;
    
    let value = '';
    
    // Check if field starts with quote
    if (line[pos] === '"') {
      // Find closing quote (might have escaped quotes inside)
      pos++; // skip opening quote
      let inQuote = true;
      while (pos < line.length && inQuote) {
        if (line[pos] === '"') {
          // Check if it's escaped quote ("")
          if (line[pos + 1] === '"') {
            value += '"';
            pos += 2;
          } else {
            // End of quoted field
            inQuote = false;
            pos++; // skip closing quote
          }
        } else {
          value += line[pos];
          pos++;
        }
      }
      // Skip comma after quoted field
      if (line[pos] === ',') pos++;
    } else {
      // Unquoted field - read until comma
      while (pos < line.length && line[pos] !== ',') {
        value += line[pos];
        pos++;
      }
      pos++; // skip comma
    }
    
    result[field] = value;
  }
  
  return result;
}

/**
 * Parse the description JSON to extract clean product details
 * Removes "[Category] by [Brand]" prefix and "Product Code: XXX" suffix
 * Adds proper spacing between features
 */
function parseDescription(descStr) {
  if (!descStr) return null;
  
  let rawDetails = null;
  
  try {
    // The description is Python-style JSON with single quotes - convert to proper JSON
    const jsonStr = descStr
      .replace(/'/g, '"')
      .replace(/""([^"]+)""/g, "'$1'"); // Fix escaped quotes
    
    const parsed = JSON.parse(jsonStr);
    
    // Extract Product Details
    for (const item of parsed) {
      if (item['Product Details']) {
        rawDetails = item['Product Details'];
        break;
      }
    }
  } catch (e) {
    // Try regex extraction as fallback
    const match = descStr.match(/Product Details['"]: ['"]([^}]+)/);
    if (match) {
      rawDetails = match[1].replace(/['"]\s*\}.*$/, '').trim();
    }
  }
  
  if (!rawDetails) return null;
  
  // Clean up the description:
  // The raw format is: "[Category] by [Brand][Tagline][Features]Product Code: XXX"
  // Example: "Coats & Jackets by Nike RunningHit that new PBToggle hoodZip fastening...Product Code: 123"
  
  let cleaned = rawDetails;
  
  // 1. Remove "Product Code: XXXXX" suffix first
  cleaned = cleaned.replace(/Product Code:\s*\d+['"]?$/, '').trim();
  
  // 2. Remove "[Category] by [Brand]" prefix
  // The pattern ends where actual content starts - look for common feature/tagline starters
  // Features start with words like: Toggle, Zip, Button, Spread, Notch, Regular, Relaxed, Side, etc.
  // Taglines are short catchy phrases
  
  // First, try to find where the brand name ends and content begins
  // Pattern: "[anything] by [BrandWords]" followed by actual content
  // Brand words end when we hit a known feature starter or tagline pattern
  
  const featureStarters = [
    // Common feature words
    'Toggle', 'Zip', 'Button', 'Spread', 'Notch', 'Regular', 'Relaxed', 'Oversized', 
    'Side', 'Front', 'Back', 'High', 'Low', 'V-neck', 'Crew', 'Round', 'Square',
    'Long', 'Short', 'Cropped', 'Fitted', 'Loose', 'Slim', 'Wide', 'Narrow',
    'Classic', 'Modern', 'Vintage', 'Retro',
    // Tagline starters (catchy phrases)
    'Hit', 'Love', 'Throw', 'Get', 'Make', 'Take', 'Your', 'The', 'That', 'This',
    'New', 'Fresh', 'Cool', 'Warm', 'Soft', 'Bold', 'Sleek',
    // Feature descriptions
    'Hooded', 'Belted', 'Quilted', 'Padded', 'Lined', 'Unlined',
  ];
  
  // Find the position where content starts (after "by [Brand]")
  const byMatch = cleaned.match(/\sby\s/i);
  if (byMatch && byMatch.index !== undefined) {
    const afterBy = cleaned.substring(byMatch.index + 4); // Skip " by "
    
    // Find where actual content starts - look for first feature starter
    for (const starter of featureStarters) {
      const starterPos = afterBy.indexOf(starter);
      if (starterPos !== -1 && starterPos < 50) { // Must be within first 50 chars after brand
        cleaned = afterBy.substring(starterPos);
        break;
      }
    }
    
    // If no feature starter found, try to find first capital letter after some lowercase
    // (brand names are usually all caps or Title Case, content starts fresh)
    if (cleaned === rawDetails || cleaned.startsWith('y ')) {
      const contentMatch = afterBy.match(/[a-z]{2,}([A-Z][a-z])/);
      if (contentMatch && contentMatch.index !== undefined) {
        cleaned = afterBy.substring(contentMatch.index + contentMatch[0].length - 2);
      }
    }
  }
  
  // 3. Add periods between smooshed features
  // "TogglehoodZipfastening" -> "Toggle hood. Zip fastening"
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1. $2');
  
  // 4. Fix common word breaks
  cleaned = cleaned
    .replace(/\bfit\./gi, 'fit.')
    .replace(/\bcollar\./gi, 'collar.')
    .replace(/\bpockets\./gi, 'pockets.')
    .replace(/\bhem\./gi, 'hem.')
    .replace(/\bdetails\./gi, 'details.');
  
  // 5. Clean up spacing and punctuation
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\.\s*\./g, '.');
  cleaned = cleaned.replace(/^\.\s*/, ''); // Remove leading period
  
  // 6. Ensure proper ending
  if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.';
  }
  
  // 7. Capitalize first letter
  if (cleaned) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned || null;
}

async function extractProducts() {
  console.log('Fetching ASOS CSV...');
  
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const lines = text.split('\n');
  
  console.log(`Total rows: ${lines.length - 1}`);
  
  const productsBySubcat = {};
  const seenNames = new Set();
  const seenImages = new Set();
  
  for (const subcat of Object.keys(TARGET_SUBCATEGORIES)) {
    productsBySubcat[subcat] = [];
  }
  
  let processed = 0;
  let matched = 0;
  let priceIssues = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    processed++;
    
    // Parse CSV line properly
    const parsed = parseCSVLine(line);
    
    if (!parsed.name || !parsed.price) continue;
    
    // Validate and parse price
    const price = parseFloat(parsed.price);
    if (isNaN(price) || price < 5 || price > 2000) {
      priceIssues++;
      continue;
    }
    
    // Get image URL
    const imageMatch = line.match(/https:\/\/images\.asos-media\.com\/products\/[^'"\s,\]]+/);
    if (!imageMatch) continue;
    
    const imageUrl = imageMatch[0].split('?')[0];
    if (seenImages.has(imageUrl)) continue;
    
    const name = parsed.name.trim();
    if (!name || name.length < 10 || seenNames.has(name.toLowerCase())) continue;
    
    // Detect subcategory
    const subcategory = detectSubcategory(name);
    if (!subcategory) continue;
    
    if (productsBySubcat[subcategory].length >= TARGET_SUBCATEGORIES[subcategory]) continue;
    
    // Parse sizes
    let sizes = [];
    if (parsed.sizes) {
      sizes = parsed.sizes.split(',').map(s => s.trim()).filter(s => s && !s.includes('Out of stock'));
    }
    
    // Parse description
    const productDescription = parseDescription(parsed.description);
    
    // Clean color
    let color = parsed.color?.trim() || 'Multi';
    if (color.length > 30) color = 'Multi';
    
    const brand = extractBrand(name);
    
    seenNames.add(name.toLowerCase());
    seenImages.add(imageUrl);
    matched++;
    
    productsBySubcat[subcategory].push({
      name,
      price,
      color,
      sizes,
      image: imageUrl,
      subcategory,
      brand,
      description: productDescription,
      sku: parsed.sku,
    });
  }
  
  // Report stats
  console.log(`\nProcessed: ${processed}, Matched: ${matched}, Price issues: ${priceIssues}`);
  console.log('\n=== EXTRACTION STATS ===');
  
  let total = 0;
  for (const [subcat, products] of Object.entries(productsBySubcat)) {
    const count = products.length;
    if (count > 0) {
      console.log(`${subcat}: ${count}/${TARGET_SUBCATEGORIES[subcat]}`);
      total += count;
    }
  }
  console.log(`\nTotal: ${total} products`);
  
  // Sample check
  console.log('\n=== SAMPLE PRODUCT (verify parsing) ===');
  const sample = productsBySubcat['jackets']?.[0];
  if (sample) {
    console.log('Name:', sample.name);
    console.log('Price:', sample.price);
    console.log('Color:', sample.color);
    console.log('Sizes:', sample.sizes?.slice(0, 5).join(', '));
    console.log('Description:', sample.description?.substring(0, 100));
  }
  
  // Generate TypeScript
  const allProducts = [];
  let id = 1;
  
  for (const [subcategory, products] of Object.entries(productsBySubcat)) {
    for (const p of products) {
      const rating = (4.0 + Math.random() * 0.9).toFixed(1);
      const reviewCount = Math.floor(50 + Math.random() * 600);
      
      const hasSale = Math.random() < 0.2;
      const originalPrice = hasSale ? Math.round(p.price * (1.15 + Math.random() * 0.3)) : undefined;
      
      const tags = [];
      if (hasSale) tags.push('sale');
      if (Math.random() < 0.12) tags.push('new');
      if (Math.random() < 0.08) tags.push('bestseller');
      
      // Use actual description or fallback to a generated one
      const description = p.description || `${p.brand} ${subcategory} in ${p.color.toLowerCase()}`;
      
      allProducts.push({
        id: `asos-${id++}`,
        name: p.name,
        price: p.price,
        originalPrice,
        currency: 'GBP',
        image: p.image,
        rating: parseFloat(rating),
        reviewCount,
        description,
        category: 'clothing',
        subcategory,
        brand: p.brand,
        inStock: true,
        tags: tags.length > 0 ? tags : undefined,
        color: p.color,
        sizes: p.sizes,
      });
    }
  }
  
  console.log(`\nGenerating products.ts with ${allProducts.length} products...`);
  
  let tsContent = `// ASOS E-commerce Dataset - Real product data
// Source: HuggingFace TrainingDataPro/asos-e-commerce-dataset
// Generated: ${new Date().toISOString().split('T')[0]}
// Total products: ${allProducts.length}

import { Product, ProductCategory } from '../types/product';

export const products: Product[] = [
`;
  
  for (const p of allProducts) {
    // Clean description for JSON
    const cleanDesc = p.description
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .substring(0, 200);
    
    tsContent += `  {
    id: '${p.id}',
    name: ${JSON.stringify(p.name)},
    price: ${p.price},${p.originalPrice ? `\n    originalPrice: ${p.originalPrice},` : ''}
    currency: '${p.currency}',
    image: '${p.image}',
    rating: ${p.rating},
    reviewCount: ${p.reviewCount},
    description: "${cleanDesc}",
    category: '${p.category}' as ProductCategory,
    subcategory: '${p.subcategory}',
    brand: ${JSON.stringify(p.brand)},
    inStock: ${p.inStock},${p.tags ? `\n    tags: ${JSON.stringify(p.tags)},` : ''}
    variants: [
      { type: 'color', options: [${JSON.stringify(p.color)}] },${p.sizes && p.sizes.length > 0 ? `\n      { type: 'size', options: ${JSON.stringify(p.sizes.slice(0, 8))} },` : ''}
    ],
    attributes: {
      gender: 'unisex' as const,${p.sizes && p.sizes.length > 0 ? `\n      sizes: ${JSON.stringify(p.sizes.slice(0, 8))},` : ''}
    },
  },
`;
  }
  
  tsContent += `];

// ============================================
// Data Access Functions
// ============================================

export async function getAllProducts(): Promise<Product[]> {
  return products;
}

export async function getProductsByCategory(category: ProductCategory): Promise<Product[]> {
  return products.filter(p => p.category === category);
}

export async function getProductsBySubcategory(subcategory: string): Promise<Product[]> {
  return products.filter(p => p.subcategory === subcategory);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const lowerQuery = query.toLowerCase();
  return products.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.subcategory.toLowerCase().includes(lowerQuery) ||
    p.brand.toLowerCase().includes(lowerQuery)
  );
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return products.find(p => p.id === id);
}

export interface ProductSearchCriteria {
  query?: string;
  category?: ProductCategory;
  subcategory?: string;
  maxPrice?: number;
  minPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  tags?: string[];
  limit?: number;
}

export async function filterProducts(criteria: ProductSearchCriteria): Promise<Product[]> {
  let filtered = [...products];

  if (criteria.query) {
    const lowerQuery = criteria.query.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.subcategory.toLowerCase().includes(lowerQuery) ||
      p.brand.toLowerCase().includes(lowerQuery)
    );
  }

  if (criteria.category) {
    filtered = filtered.filter(p => p.category === criteria.category);
  }

  if (criteria.subcategory) {
    filtered = filtered.filter(p => p.subcategory === criteria.subcategory);
  }

  if (criteria.maxPrice !== undefined) {
    filtered = filtered.filter(p => p.price <= criteria.maxPrice!);
  }

  if (criteria.minPrice !== undefined) {
    filtered = filtered.filter(p => p.price >= criteria.minPrice!);
  }

  if (criteria.minRating !== undefined) {
    filtered = filtered.filter(p => p.rating >= criteria.minRating!);
  }

  if (criteria.inStockOnly) {
    filtered = filtered.filter(p => p.inStock);
  }

  if (criteria.tags && criteria.tags.length > 0) {
    filtered = filtered.filter(p =>
      p.tags?.some(tag => criteria.tags!.includes(tag))
    );
  }

  if (criteria.limit !== undefined && criteria.limit > 0) {
    filtered = filtered.slice(0, criteria.limit);
  }

  return filtered;
}

export async function getAvailableCategories(): Promise<ProductCategory[]> {
  const categories = new Set(products.map(p => p.category));
  return Array.from(categories);
}

export async function getAvailableSubcategories(): Promise<string[]> {
  const subcategories = new Set(products.map(p => p.subcategory));
  return Array.from(subcategories).sort();
}

export async function getSaleProducts(): Promise<Product[]> {
  return products.filter(p => p.tags?.includes('sale'));
}

export async function getTopRatedProducts(limit: number = 10): Promise<Product[]> {
  return [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function clearProductCache(): void {
  // No-op
}
`;
  
  writeFileSync('./src/data/products.ts', tsContent);
  console.log('\n✅ Written to src/data/products.ts');
}

extractProducts().catch(console.error);
