/**
 * Extract diverse ASOS products for the prototype
 * Full extraction - aims for ~250-300 products with good variety
 */

import { writeFileSync } from 'fs';

const CSV_URL = 'https://huggingface.co/datasets/TrainingDataPro/asos-e-commerce-dataset/resolve/main/products_asos.csv';

// Target subcategories and how many products we want from each
const TARGET_SUBCATEGORIES = {
  // Outerwear
  'jackets': 20,
  'coats': 18,
  'blazers': 12,
  'gilets': 8,
  // Tops
  'tops': 18,
  'shirts': 15,
  'blouses': 10,
  't-shirts': 15,
  // Knitwear
  'jumpers': 15,
  'cardigans': 10,
  'hoodies': 15,
  'sweatshirts': 12,
  // Dresses & Skirts
  'dresses': 20,
  'skirts': 12,
  // Bottoms
  'jeans': 15,
  'trousers': 15,
  'shorts': 10,
  'leggings': 8,
  // Footwear
  'trainers': 15,
  'boots': 15,
  'heels': 10,
  'sandals': 10,
  'loafers': 8,
  'flats': 8,
  // Bags & Accessories
  'bags': 15,
  'backpacks': 8,
  'scarves': 8,
  'hats': 8,
  'belts': 6,
  'sunglasses': 6,
  'jewellery': 8,
  // Swimwear & Lingerie
  'swimwear': 8,
  'lingerie': 8,
};

// Keywords to detect subcategories from product names
const SUBCATEGORY_KEYWORDS = {
  'jackets': ['jacket', 'bomber', 'biker', 'denim jacket', 'leather jacket', 'puffer jacket', 'quilted jacket'],
  'coats': ['coat', 'trench', 'parka', 'overcoat', 'mac ', 'peacoat', 'duffle'],
  'blazers': ['blazer', 'suit jacket'],
  'gilets': ['gilet', 'vest', 'bodywarmer'],
  'tops': ['top', 'cami', 'bodysuit', 'crop top', 'tank'],
  'shirts': ['shirt', 'oxford', 'flannel', 'denim shirt'],
  'blouses': ['blouse'],
  't-shirts': ['t-shirt', 'tee', 'tshirt'],
  'jumpers': ['jumper', 'sweater', 'pullover', 'knit'],
  'cardigans': ['cardigan', 'cardi'],
  'hoodies': ['hoodie', 'hoody'],
  'sweatshirts': ['sweatshirt', 'crew neck sweat', 'fleece'],
  'dresses': ['dress', 'midi', 'maxi dress', 'mini dress', 'slip dress', 'shirt dress'],
  'skirts': ['skirt', 'mini skirt', 'midi skirt', 'maxi skirt'],
  'jeans': ['jeans', 'denim trouser', 'skinny jean', 'straight jean', 'wide leg jean', 'mom jean'],
  'trousers': ['trouser', 'chino', 'pant', 'cargo', 'jogger', 'wide leg'],
  'shorts': ['shorts', 'short'],
  'leggings': ['legging', 'jegging'],
  'trainers': ['trainer', 'sneaker', 'running shoe', 'tennis shoe', 'sports shoe', 'athletic shoe'],
  'boots': ['boot', 'chelsea', 'ankle boot', 'knee boot', 'combat boot', 'hiker'],
  'heels': ['heel', 'stiletto', 'platform', 'court shoe', 'pump'],
  'sandals': ['sandal', 'slider', 'flip flop', 'espadrille'],
  'loafers': ['loafer', 'moccasin', 'driving shoe'],
  'flats': ['flat', 'ballet', 'ballerina'],
  'bags': ['bag', 'tote', 'clutch', 'purse', 'handbag', 'shoulder bag', 'cross body', 'satchel'],
  'backpacks': ['backpack', 'rucksack'],
  'scarves': ['scarf', 'snood'],
  'hats': ['hat', 'cap', 'beanie', 'beret', 'bucket hat', 'fedora'],
  'belts': ['belt'],
  'sunglasses': ['sunglasses', 'sunnies'],
  'jewellery': ['necklace', 'bracelet', 'earring', 'ring', 'chain', 'pendant', 'anklet'],
  'swimwear': ['swimsuit', 'bikini', 'swim short', 'swimming'],
  'lingerie': ['bra', 'brief', 'thong', 'knicker', 'underwear', 'lingerie set'],
};

function detectSubcategory(name) {
  const lowerName = name.toLowerCase();
  
  // Check each subcategory's keywords
  for (const [subcat, keywords] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lowerName.includes(kw)) {
        return subcat;
      }
    }
  }
  return null;
}

function extractBrand(name) {
  const brands = [
    'ASOS DESIGN', 'ASOS', 'Nike', 'Adidas', 'Puma', 'New Balance', 'Reebok', 'Fila',
    'Tommy Hilfiger', 'Tommy Jeans', "Levi's", 'Calvin Klein', 'Guess', 'Diesel',
    'Dr Martens', 'Converse', 'Vans', 'New Look', 'River Island', 'Zara',
    'Topshop', 'Topman', 'Miss Selfridge', 'Monki', 'Weekday', 'Bershka',
    'Stradivarius', 'Pull&Bear', 'Mango', 'Urban Classics', 'Carhartt', 'Dickies',
    'The North Face', 'Columbia', 'Timberland', 'Ted Baker', 'French Connection',
    'AllSaints', 'Whistles', 'Reiss', 'Karen Millen', 'Coast', 'Warehouse',
    'Only', 'Vero Moda', 'JDY', 'Pieces', 'Vila', 'Object', 'Selected',
    'Jack & Jones', 'Brave Soul', 'Soul Star', 'Threadbare', 'Another Influence',
    'COLLUSION', 'Reclaimed Vintage', 'Daisy Street', 'Glamorous', 'Influence',
    'Public Desire', 'Simmi', 'London Rebel', 'Truffle Collection', 'Raid',
    'Bershka', 'Stradivarius', '& Other Stories', 'COS', 'Arket', 'Massimo Dutti',
    'UGG', 'Birkenstock', 'Crocs', 'Steve Madden', 'Dune', 'Kurt Geiger',
    'Barbour', 'Superdry', 'Hollister', 'Abercrombie', 'American Eagle',
    'Ellesse', 'Champion', 'Lacoste', 'Fred Perry', 'Ben Sherman', 'Farah',
    'Pretty Little Thing', 'Boohoo', 'Missguided', 'NA-KD', 'In The Style',
  ];
  
  for (const brand of brands) {
    if (name.startsWith(brand) || name.toLowerCase().startsWith(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Try to extract brand from "Brand Name product description" pattern
  const firstWords = name.split(' ').slice(0, 3).join(' ');
  if (firstWords.length < 30 && /^[A-Z]/.test(firstWords)) {
    return firstWords.split(' ')[0];
  }
  
  return 'ASOS';
}

function parsePrice(priceStr) {
  const match = priceStr.match(/[\d.]+/);
  if (match) {
    const price = parseFloat(match[0]);
    if (price > 0 && price < 2000) return price;
  }
  return null;
}

function cleanProductName(name) {
  return name
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
}

async function extractProducts() {
  console.log('Fetching ASOS CSV (30k+ products)...');
  
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const lines = text.split('\n');
  
  console.log(`Total rows in dataset: ${lines.length - 1}`);
  
  const productsBySubcat = {};
  const seenNames = new Set();
  const seenImages = new Set();
  
  // Initialize subcategory buckets
  for (const subcat of Object.keys(TARGET_SUBCATEGORIES)) {
    productsBySubcat[subcat] = [];
  }
  
  // Track how many we've processed
  let processed = 0;
  let matched = 0;
  
  // Process ALL rows to find the best matches
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    processed++;
    
    // Extract image URL
    const imageMatch = line.match(/https:\/\/images\.asos-media\.com\/products\/[^'"\s,]+/);
    if (!imageMatch) continue;
    
    let imageUrl = imageMatch[0].split('?')[0];
    if (seenImages.has(imageUrl)) continue;
    
    // Parse the product name
    const urlEnd = line.indexOf(',');
    if (urlEnd === -1) continue;
    
    let nameStart = urlEnd + 1;
    let name;
    let restOfLine;
    
    if (line[nameStart] === '"') {
      const nameEnd = line.indexOf('",', nameStart + 1);
      if (nameEnd === -1) continue;
      name = line.substring(nameStart + 1, nameEnd);
      restOfLine = line.substring(nameEnd + 2);
    } else {
      const nameEnd = line.indexOf(',', nameStart);
      if (nameEnd === -1) continue;
      name = line.substring(nameStart, nameEnd);
      restOfLine = line.substring(nameEnd + 1);
    }
    
    name = cleanProductName(name);
    if (!name || name.length < 10 || seenNames.has(name.toLowerCase())) continue;
    
    // Parse remaining fields for price and color
    const parts = restOfLine.split(',');
    
    let price = null;
    let color = '';
    
    for (let j = 0; j < Math.min(6, parts.length); j++) {
      const val = parts[j]?.trim();
      if (!val) continue;
      
      const priceVal = parsePrice(val);
      if (priceVal && !price) {
        price = priceVal;
        continue;
      }
      
      if (val.length < 25 && !/\d/.test(val) && !val.includes('UK') && !val.includes('Out of stock') && !val.includes('http')) {
        if (!color && val.length > 2) {
          color = val.replace(/"/g, '').replace(/[\[\]']/g, '');
        }
      }
    }
    
    if (!price || price < 5) continue;
    
    // Detect subcategory
    const subcategory = detectSubcategory(name);
    if (!subcategory) continue;
    
    // Check if we need more in this subcategory
    if (productsBySubcat[subcategory].length >= TARGET_SUBCATEGORIES[subcategory]) continue;
    
    // Extract brand
    const brand = extractBrand(name);
    
    seenNames.add(name.toLowerCase());
    seenImages.add(imageUrl);
    matched++;
    
    productsBySubcat[subcategory].push({
      name,
      price,
      color: color || 'Multi',
      image: imageUrl,
      subcategory,
      brand,
    });
  }
  
  // Report extraction stats
  console.log(`\nProcessed ${processed} rows, matched ${matched} products`);
  console.log('\n=== EXTRACTION STATS BY SUBCATEGORY ===');
  
  let total = 0;
  const subcatOrder = Object.keys(TARGET_SUBCATEGORIES);
  
  for (const subcat of subcatOrder) {
    const count = productsBySubcat[subcat].length;
    const target = TARGET_SUBCATEGORIES[subcat];
    const status = count >= target ? '✓' : count > 0 ? '~' : '✗';
    console.log(`${status} ${subcat}: ${count}/${target}`);
    total += count;
  }
  console.log(`\nTotal: ${total} products`);
  
  // Generate TypeScript file
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
      
      allProducts.push({
        id: `asos-${id++}`,
        name: p.name,
        price: p.price,
        originalPrice,
        currency: 'GBP',
        image: p.image,
        rating: parseFloat(rating),
        reviewCount,
        description: `${p.brand} ${subcategory}`,
        category: 'clothing',
        subcategory,
        brand: p.brand,
        inStock: true,
        tags: tags.length > 0 ? tags : undefined,
        color: p.color,
      });
    }
  }
  
  console.log(`\nGenerating products.ts with ${allProducts.length} products...`);
  
  // Generate the TypeScript content
  let tsContent = `// ASOS E-commerce Dataset - Real product data
// Source: HuggingFace TrainingDataPro/asos-e-commerce-dataset
// Generated: ${new Date().toISOString().split('T')[0]}
// Total products: ${allProducts.length}

import { Product, ProductCategory } from '../types/product';

// ============================================
// ASOS Product Data (${allProducts.length} products)
// ============================================

export const products: Product[] = [
`;
  
  for (const p of allProducts) {
    tsContent += `  {
    id: '${p.id}',
    name: ${JSON.stringify(p.name)},
    price: ${p.price},${p.originalPrice ? `\n    originalPrice: ${p.originalPrice},` : ''}
    currency: '${p.currency}',
    image: '${p.image}',
    rating: ${p.rating},
    reviewCount: ${p.reviewCount},
    description: ${JSON.stringify(p.description)},
    category: '${p.category}' as ProductCategory,
    subcategory: '${p.subcategory}',
    brand: ${JSON.stringify(p.brand)},
    inStock: ${p.inStock},${p.tags ? `\n    tags: ${JSON.stringify(p.tags)},` : ''}
    variants: [
      { type: 'color', options: [${JSON.stringify(p.color)}] },
    ],
    attributes: {
      gender: 'unisex' as const,
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
  // No-op - data is static
}
`;
  
  writeFileSync('./src/data/products.ts', tsContent);
  console.log('\n✅ Written to src/data/products.ts');
  
  // Output subcategory summary
  console.log('\n=== FINAL SUBCATEGORIES ===');
  const finalSubcats = [...new Set(allProducts.map(p => p.subcategory))].sort();
  console.log(finalSubcats.join(', '));
}

extractProducts().catch(console.error);
