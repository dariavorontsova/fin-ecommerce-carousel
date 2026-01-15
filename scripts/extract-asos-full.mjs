/**
 * Extract diverse ASOS products for the prototype
 * Outputs a complete products.ts file
 */

import { writeFileSync } from 'fs';

const CSV_URL = 'https://huggingface.co/datasets/TrainingDataPro/asos-e-commerce-dataset/resolve/main/products_asos.csv';

// Target subcategories and how many products we want from each
const TARGET_SUBCATEGORIES = {
  'jackets': 15,
  'coats': 12,
  'dresses': 15,
  'tops': 12,
  'shirts': 10,
  'jeans': 10,
  'trousers': 8,
  'skirts': 8,
  'shoes': 12,
  'trainers': 10,
  'boots': 8,
  'bags': 8,
  'accessories': 8,
  'knitwear': 8,
  'hoodies': 8,
};

// Keywords to detect subcategories from product names
const SUBCATEGORY_KEYWORDS = {
  'jackets': ['jacket', 'bomber', 'blazer', 'biker'],
  'coats': ['coat', 'trench', 'parka', 'overcoat', 'mac '],
  'dresses': ['dress', 'midi', 'maxi', 'mini dress'],
  'tops': ['top', 'blouse', 'cami', 'vest', 'bodysuit'],
  'shirts': ['shirt', 'oxford', 'flannel'],
  'jeans': ['jean', 'denim trouser'],
  'trousers': ['trouser', 'chino', 'pant', 'cargo', 'jogger'],
  'skirts': ['skirt'],
  'shoes': ['shoe', 'loafer', 'heel', 'flat', 'sandal', 'mule'],
  'trainers': ['trainer', 'sneaker', 'running shoe'],
  'boots': ['boot', 'chelsea', 'ankle boot'],
  'bags': ['bag', 'tote', 'backpack', 'clutch', 'purse'],
  'accessories': ['scarf', 'hat', 'belt', 'glove', 'watch', 'jewel', 'sunglasses'],
  'knitwear': ['sweater', 'jumper', 'cardigan', 'knit', 'pullover'],
  'hoodies': ['hoodie', 'sweatshirt', 'fleece'],
};

function detectSubcategory(name) {
  const lowerName = name.toLowerCase();
  for (const [subcat, keywords] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerName.includes(kw))) {
      return subcat;
    }
  }
  return null;
}

function extractBrand(name) {
  // Common brand patterns at the start of ASOS product names
  const brands = [
    'ASOS DESIGN', 'ASOS', 'Nike', 'Adidas', 'Puma', 'New Balance', 
    'Tommy Hilfiger', 'Tommy Jeans', "Levi's", 'Calvin Klein', 'Guess',
    'Dr Martens', 'Converse', 'Vans', 'New Look', 'River Island',
    'Topshop', 'Topman', 'Miss Selfridge', 'Monki', 'Weekday', 'Bershka',
    'Stradivarius', 'Pull&Bear', 'Mango', 'Urban Classics', 'Carhartt',
    'The North Face', 'Columbia', 'Timberland', 'Ted Baker', 'French Connection',
    'AllSaints', 'Whistles', 'Reiss', 'Karen Millen', 'Coast', 'Warehouse',
    'Only', 'Vero Moda', 'JDY', 'Pieces', 'Vila', 'Object', 'Selected',
    'Jack & Jones', 'Brave Soul', 'Soul Star', 'Threadbare', 'Another Influence',
  ];
  
  for (const brand of brands) {
    if (name.startsWith(brand) || name.toLowerCase().startsWith(brand.toLowerCase())) {
      return brand;
    }
  }
  return 'ASOS';
}

function parsePrice(priceStr) {
  // Try to extract a number from the price string
  const match = priceStr.match(/[\d.]+/);
  if (match) {
    const price = parseFloat(match[0]);
    if (price > 0 && price < 1000) return price;
  }
  return null;
}

function cleanProductName(name) {
  // Clean up the name
  return name
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 80);
}

async function extractProducts() {
  console.log('Fetching ASOS CSV...');
  
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const lines = text.split('\n');
  
  console.log(`Total rows: ${lines.length}`);
  
  const productsBySubcat = {};
  const seenNames = new Set();
  const seenImages = new Set();
  
  // Initialize subcategory buckets
  for (const subcat of Object.keys(TARGET_SUBCATEGORIES)) {
    productsBySubcat[subcat] = [];
  }
  
  // Process all rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Extract image URL
    const imageMatch = line.match(/https:\/\/images\.asos-media\.com\/products\/[^'"\s,]+/);
    if (!imageMatch) continue;
    
    let imageUrl = imageMatch[0].split('?')[0]; // Remove query params
    if (seenImages.has(imageUrl)) continue;
    
    // Parse CSV fields - this is tricky due to commas in fields
    // Format: url,name,size,category,price,color,sku,description,images
    
    // Find the product name (second field, might be quoted)
    const urlEnd = line.indexOf(',');
    if (urlEnd === -1) continue;
    
    let nameStart = urlEnd + 1;
    let name;
    let restOfLine;
    
    // Check if name is quoted
    if (line[nameStart] === '"') {
      // Find closing quote (might have commas inside)
      const nameEnd = line.indexOf('",', nameStart + 1);
      if (nameEnd === -1) continue;
      name = line.substring(nameStart + 1, nameEnd);
      restOfLine = line.substring(nameEnd + 2);
    } else {
      // Unquoted - find next comma
      const nameEnd = line.indexOf(',', nameStart);
      if (nameEnd === -1) continue;
      name = line.substring(nameStart, nameEnd);
      restOfLine = line.substring(nameEnd + 1);
    }
    
    name = cleanProductName(name);
    if (!name || name.length < 10 || seenNames.has(name.toLowerCase())) continue;
    
    // Parse remaining fields
    const parts = restOfLine.split(',');
    
    // Try to find price (should be a number)
    let price = null;
    let color = '';
    
    for (let j = 0; j < Math.min(5, parts.length); j++) {
      const val = parts[j]?.trim();
      if (!val) continue;
      
      // Check if it's a price
      const priceVal = parsePrice(val);
      if (priceVal && !price) {
        price = priceVal;
        continue;
      }
      
      // Check if it looks like a color (short string, no numbers)
      if (val.length < 30 && !/\d/.test(val) && !val.includes('UK') && !val.includes('Out of stock')) {
        if (!color && val.length > 2) {
          color = val.replace(/"/g, '');
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
  console.log('\n=== EXTRACTION STATS ===');
  let total = 0;
  for (const [subcat, products] of Object.entries(productsBySubcat)) {
    console.log(`${subcat}: ${products.length}/${TARGET_SUBCATEGORIES[subcat]}`);
    total += products.length;
  }
  console.log(`\nTotal: ${total} products`);
  
  // Generate TypeScript file
  const allProducts = [];
  let id = 1;
  
  for (const [subcategory, products] of Object.entries(productsBySubcat)) {
    for (const p of products) {
      // Generate realistic rating (4.0 - 4.9)
      const rating = (4.0 + Math.random() * 0.9).toFixed(1);
      const reviewCount = Math.floor(50 + Math.random() * 500);
      
      // Occasionally add sale price
      const hasSale = Math.random() < 0.2;
      const originalPrice = hasSale ? Math.round(p.price * (1.15 + Math.random() * 0.25)) : undefined;
      
      // Add tags
      const tags = [];
      if (hasSale) tags.push('sale');
      if (Math.random() < 0.15) tags.push('new');
      if (Math.random() < 0.1) tags.push('bestseller');
      
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

import { Product, ProductCategory } from '../types/product';

// ============================================
// ASOS Product Data
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
  
  // Write to file
  writeFileSync('./src/data/products.ts', tsContent);
  console.log('\n✅ Written to src/data/products.ts');
  
  // Also output subcategory list for updating types
  console.log('\n=== SUBCATEGORIES FOR TYPES ===');
  const subcats = [...new Set(allProducts.map(p => p.subcategory))].sort();
  console.log(subcats.map(s => `'${s}'`).join(' | '));
}

extractProducts().catch(console.error);
