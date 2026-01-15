/**
 * Extract ASOS products and output them in our Product format
 */

const CSV_URL = 'https://huggingface.co/datasets/TrainingDataPro/asos-e-commerce-dataset/resolve/main/products_asos.csv';

async function extractSample() {
  console.log('Fetching ASOS CSV...');
  
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const lines = text.split('\n');
  
  console.log('Total rows:', lines.length);
  
  const products = [];
  const seenNames = new Set();
  
  // Process rows, looking for variety
  for (let i = 1; i < lines.length && products.length < 15; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Extract image URL - first one from the array
    const imageMatch = line.match(/https:\/\/images\.asos-media\.com\/products\/[^'"\s]+/);
    if (!imageMatch) continue;
    
    // Clean up the image URL (remove trailing query params artifacts)
    let imageUrl = imageMatch[0];
    // Use a cleaner version without complex params
    imageUrl = imageUrl.split('?')[0];
    
    // Parse the CSV fields (rough but works)
    // Format: url,name,size,category,price,color,sku,description,images
    const parts = line.split(',');
    
    const url = parts[0];
    const name = parts[1]?.replace(/"/g, '').trim();
    const category = parts[3]?.replace(/"/g, '').trim();
    const price = parseFloat(parts[4]);
    const color = parts[5]?.replace(/"/g, '').trim();
    
    // Skip duplicates and invalid entries
    if (!name || seenNames.has(name) || isNaN(price) || price <= 0) continue;
    if (name.length < 5 || name.length > 80) continue;
    
    seenNames.add(name);
    
    products.push({
      name,
      category: category || 'clothing',
      price,
      color: color || 'Multi',
      image: imageUrl,
      url
    });
  }
  
  console.log(`\nExtracted ${products.length} unique products\n`);
  
  // Output in our TypeScript format
  console.log('// ============================================');
  console.log('// ASOS TEST PRODUCTS - Add to products.ts');
  console.log('// ============================================\n');
  
  products.forEach((p, i) => {
    console.log(`  {
    id: 'asos-test-${i + 1}',
    name: '${p.name.replace(/'/g, "\\'")}',
    price: ${p.price},
    currency: 'GBP',
    image: '${p.image}',
    rating: ${(4.2 + Math.random() * 0.7).toFixed(1)},
    reviewCount: ${Math.floor(150 + Math.random() * 400)},
    description: '${p.category}',
    category: 'clothing',
    subcategory: '${(p.category || 'fashion').toLowerCase().substring(0, 30)}',
    brand: 'ASOS',
    inStock: true,
    tags: ['new'],
    variants: [
      { type: 'color', options: ['${p.color}'] },
    ],
    attributes: {
      gender: 'unisex',
    },
  },`);
  });
  
  console.log('\n// ============================================');
  console.log('// IMAGE URLs FOR QUICK BROWSER TEST');
  console.log('// Copy these into browser address bar to verify');
  console.log('// ============================================\n');
  
  products.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.image}`);
  });
}

extractSample().catch(console.error);
