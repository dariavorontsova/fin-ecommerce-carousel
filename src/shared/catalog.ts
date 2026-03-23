/**
 * Shared Product Catalog — Single Source of Truth
 *
 * Both the MAISON website and the Fin messenger agent consume this catalog.
 * This mirrors the real-world architecture where Fin syncs a store's
 * Shopify/product catalog and both the storefront and agent query the same data.
 *
 * 4 departments:
 *   - Activewear    (portrait images)   — gym tops & tees from Gymshark
 *   - Footwear      (square images)     — trainers from Nike, Adidas, New Balance
 *   - Home & Kitchen (mixed images)     — cookware, tea & coffee, kitchen tools
 *   - Furniture     (landscape images)  — sofas from Kave Home
 *
 * To add a new department or products, just add entries below and update
 * the departments array. Everything downstream picks it up automatically.
 */

import { Product, Department, DepartmentId, ImageRatio } from '../types/product';

// ─── Departments ──────────────────────────────────────────────────────────────

export const departments: Department[] = [
  {
    id: 'activewear',
    name: 'Activewear',
    description: 'Performance gym tops, tees, and tanks',
    image: '/catalog/portrait/power-tee-1.jpg',
    productCount: 10,
    imageRatio: 'portrait',
    category: 'clothing',
    brand: 'Gymshark',
  },
  {
    id: 'footwear',
    name: 'Footwear',
    description: 'Trainers and sneakers from Nike, Adidas, and New Balance',
    image: '/catalog/square/nike-dunk-low-1.jpg',
    productCount: 10,
    imageRatio: 'square',
    category: 'clothing',
  },
  {
    id: 'home-kitchen',
    name: 'Kitchen',
    description: 'Premium cookware, tea & coffee essentials, and kitchen tools',
    image: '/images/Cast-Iron-Round-Dutch-Oven.jpg',
    productCount: 10,
    imageRatio: 'landscape',
    category: 'kitchen',
  },
  {
    id: 'furniture',
    name: 'Furniture',
    description: 'Modern sofas and living room pieces from Kave Home',
    image: '/catalog/landscape/alba-3-seater-1.jpg',
    productCount: 10,
    imageRatio: 'landscape',
    category: 'furniture',
    brand: 'Kave Home',
  },
];

// ─── Activewear (portrait) ────────────────────────────────────────────────────

const activewearProducts: Product[] = [
  {
    id: 'gs-1',
    name: 'Power T-Shirt',
    price: 36,
    currency: 'USD',
    image: '/catalog/portrait/power-tee-1.jpg',
    images: ['/catalog/portrait/power-tee-1.jpg', '/catalog/portrait/power-tee-2.jpg', '/catalog/portrait/power-tee-3.jpg'],
    rating: 3.7,
    reviewCount: 482,
    description: 'Oversized fit with sweat-wicking fabric and dropped shoulders. Built for heavy lifting sessions.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { type: 'color', options: ['Stealth Blue', 'Black', 'Impact Burgundy', 'White'] },
    ],
    tags: ['new'],
  },
  {
    id: 'gs-2',
    name: 'Crest T-Shirt',
    price: 22,
    currency: 'USD',
    image: '/catalog/portrait/crest-tee-1.jpg',
    images: ['/catalog/portrait/crest-tee-1.jpg', '/catalog/portrait/crest-tee-2.jpg', '/catalog/portrait/crest-tee-3.jpg'],
    rating: 4.1,
    reviewCount: 1247,
    description: 'Regular fit everyday tee with embroidered Gymshark crest logo. Soft-touch cotton blend.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { type: 'color', options: ['Black', 'White', 'Navy', 'Light Grey Marl', 'Soft Brown'] },
    ],
    tags: ['bestseller'],
  },
  {
    id: 'gs-3',
    name: 'Crest Oversized T-Shirt',
    price: 26,
    currency: 'USD',
    image: '/catalog/portrait/crest-oversized-1.jpg',
    images: ['/catalog/portrait/crest-oversized-1.jpg', '/catalog/portrait/crest-oversized-2.jpg', '/catalog/portrait/crest-oversized-3.jpg'],
    rating: 4.1,
    reviewCount: 634,
    description: 'Relaxed oversized fit with the signature crest logo. Dropped shoulders and longer body length.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { type: 'color', options: ['Black', 'Soft Brown', 'White'] },
    ],
    tags: ['new'],
  },
  {
    id: 'gs-4',
    name: 'Legacy T-Shirt',
    price: 28,
    currency: 'USD',
    image: '/catalog/portrait/legacy-tee-1.jpg',
    images: ['/catalog/portrait/legacy-tee-1.jpg', '/catalog/portrait/legacy-tee-2.jpg', '/catalog/portrait/legacy-tee-3.jpg'],
    rating: 4.3,
    reviewCount: 856,
    description: 'Slim fit with a tailored cut that shows off your shape. Lightweight and breathable for intense workouts.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { type: 'color', options: ['Black', 'Navy', 'White', 'Light Grey'] },
    ],
  },
  {
    id: 'gs-5',
    name: 'Geo Seamless T-Shirt',
    price: 36,
    currency: 'USD',
    image: '/catalog/portrait/geo-seamless-1.jpg',
    images: ['/catalog/portrait/geo-seamless-1.jpg', '/catalog/portrait/geo-seamless-2.jpg', '/catalog/portrait/geo-seamless-3.jpg'],
    rating: 4.5,
    reviewCount: 723,
    description: 'Seamless knit construction with geometric texture for ventilation. Slim fit, second-skin feel.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['S', 'M', 'L', 'XL'] },
      { type: 'color', options: ['Black/Charcoal Grey', 'Navy/Light Blue', 'Olive/Khaki'] },
    ],
    tags: ['bestseller'],
  },
  {
    id: 'gs-6',
    name: 'Oversized Performance T-Shirt',
    price: 26,
    currency: 'USD',
    image: '/catalog/portrait/performance-tee-1.jpg',
    images: ['/catalog/portrait/performance-tee-1.jpg', '/catalog/portrait/performance-tee-2.jpg', '/catalog/portrait/performance-tee-3.jpg'],
    rating: 4.1,
    reviewCount: 512,
    description: 'Sweat-wicking oversized tee with mesh back panel for airflow. Perfect for conditioning and cardio.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { type: 'color', options: ['Black', 'Charcoal', 'Light Grey Marl'] },
    ],
  },
  {
    id: 'gs-7',
    name: 'Lightweight Seamless T-Shirt',
    price: 30,
    currency: 'USD',
    image: '/catalog/portrait/lightweight-seamless-1.jpg',
    images: ['/catalog/portrait/lightweight-seamless-1.jpg', '/catalog/portrait/lightweight-seamless-2.jpg', '/catalog/portrait/lightweight-seamless-3.jpg'],
    rating: 3.7,
    reviewCount: 389,
    description: 'Ultra-light seamless knit for unrestricted movement. Subtle stripe texture with sweat-wicking finish.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['S', 'M', 'L', 'XL'] },
      { type: 'color', options: ['Black/Silhouette Grey', 'Navy/Blue', 'White/Light Grey'] },
    ],
  },
  {
    id: 'gs-8',
    name: 'Arrival T-Shirt',
    price: 25,
    currency: 'USD',
    image: '/catalog/portrait/arrival-tee-1.jpg',
    images: ['/catalog/portrait/arrival-tee-1.jpg', '/catalog/portrait/arrival-tee-2.jpg', '/catalog/portrait/arrival-tee-3.jpg'],
    rating: 4.0,
    reviewCount: 943,
    description: 'Regular fit gym essential with sweat-wicking fabric. Clean design that works for training and everyday.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { type: 'color', options: ['Black', 'White', 'Navy', 'Rust Orange'] },
    ],
  },
  {
    id: 'gs-9',
    name: 'Critical Drop Arm Tank',
    price: 24,
    currency: 'USD',
    image: '/catalog/portrait/critical-tank-1.jpg',
    images: ['/catalog/portrait/critical-tank-1.jpg', '/catalog/portrait/critical-tank-2.jpg', '/catalog/portrait/critical-tank-3.jpg'],
    rating: 4.2,
    reviewCount: 567,
    description: 'Slim fit tank with deep cut armholes for full range of motion. Ideal for shoulders and arms day.',
    category: 'clothing',
    subcategory: 'tops',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['S', 'M', 'L', 'XL'] },
      { type: 'color', options: ['Black', 'Stealth Blue', 'White'] },
    ],
  },
  {
    id: 'gs-10',
    name: 'Conditioning Club Oversized Tee',
    price: 30,
    currency: 'USD',
    image: '/catalog/portrait/conditioning-tee-1.jpg',
    images: ['/catalog/portrait/conditioning-tee-1.jpg', '/catalog/portrait/conditioning-tee-2.jpg', '/catalog/portrait/conditioning-tee-3.jpg'],
    rating: 4.4,
    reviewCount: 298,
    description: 'Heavyweight oversized tee with bold Conditioning Club graphic. Relaxed fit for rest days and the gym.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    department: 'activewear',
    variants: [
      { type: 'size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { type: 'color', options: ['Black', 'Off White', 'Washed Khaki'] },
    ],
    tags: ['new'],
  },
];

// ─── Footwear (square) ────────────────────────────────────────────────────────

const footwearProducts: Product[] = [
  {
    id: 'tr-1',
    name: 'Nike Dunk Low Retro',
    price: 120,
    currency: 'USD',
    image: '/catalog/square/nike-dunk-low-1.jpg',
    images: ['/catalog/square/nike-dunk-low-1.jpg', '/catalog/square/nike-dunk-low-2.jpg', '/catalog/square/nike-dunk-low-3.jpg'],
    rating: 4.7,
    reviewCount: 2834,
    description: 'The court classic reborn. Padded collar, leather upper, and the iconic colour-blocking that started it all.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Nike',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['White/Black', 'Grey Fog', 'Vintage Green', 'Panda'] },
    ],
    tags: ['bestseller'],
  },
  {
    id: 'tr-2',
    name: "Nike Air Force 1 '07",
    price: 115,
    currency: 'USD',
    image: '/catalog/square/nike-af1-1.jpg',
    images: ['/catalog/square/nike-af1-1.jpg', '/catalog/square/nike-af1-2.jpg', '/catalog/square/nike-af1-3.jpg'],
    rating: 4.8,
    reviewCount: 5621,
    description: 'The one that needs no introduction. Air cushioning, full-grain leather, and the pivoting circle traction pattern.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Nike',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['White/White', 'Black/White', 'Sail'] },
    ],
    tags: ['bestseller'],
  },
  {
    id: 'tr-3',
    name: 'Adidas Samba OG',
    price: 110,
    currency: 'USD',
    image: '/catalog/square/adidas-samba-1.jpg',
    images: ['/catalog/square/adidas-samba-1.jpg', '/catalog/square/adidas-samba-2.jpg', '/catalog/square/adidas-samba-3.jpg'],
    rating: 4.7,
    reviewCount: 3456,
    description: 'Indoor football heritage turned street icon. Full-grain leather upper with suede T-toe overlay and gum sole.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Adidas',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['White/Black', 'Black/White', 'Green/Gum'] },
    ],
    tags: ['bestseller'],
  },
  {
    id: 'tr-4',
    name: 'Adidas Gazelle',
    price: 100,
    currency: 'USD',
    image: '/catalog/square/adidas-gazelle-1.jpg',
    images: ['/catalog/square/adidas-gazelle-1.jpg', '/catalog/square/adidas-gazelle-2.jpg', '/catalog/square/adidas-gazelle-3.jpg'],
    rating: 4.6,
    reviewCount: 2187,
    description: 'The 1966 original. Premium suede upper with serrated three stripes and herringbone rubber outsole.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Adidas',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['Collegiate Navy', 'Core Black', 'Scarlet', 'Collegiate Green'] },
    ],
  },
  {
    id: 'tr-5',
    name: 'New Balance 550',
    price: 110,
    currency: 'USD',
    image: '/catalog/square/nb-550-1.jpg',
    images: ['/catalog/square/nb-550-1.jpg', '/catalog/square/nb-550-2.jpg', '/catalog/square/nb-550-3.jpg'],
    rating: 4.5,
    reviewCount: 1456,
    description: 'Basketball-inspired low-top with leather upper and perforated toe box. Clean court-to-street look.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'New Balance',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['White/Green', 'White/Burgundy', 'White/Navy'] },
    ],
    tags: ['new'],
  },
  {
    id: 'tr-6',
    name: 'New Balance 530',
    price: 110,
    currency: 'USD',
    image: '/catalog/square/nb-530-1.jpg',
    images: ['/catalog/square/nb-530-1.jpg', '/catalog/square/nb-530-2.jpg', '/catalog/square/nb-530-3.jpg'],
    rating: 4.6,
    reviewCount: 1823,
    description: 'Retro runner with ABZORB cushioning and metallic silver accents. The Y2K silhouette everyone wants.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'New Balance',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['White/Silver', 'Silver/Blue', 'Black/Grey'] },
    ],
  },
  {
    id: 'tr-7',
    name: 'Nike Air Max 90',
    price: 130,
    currency: 'USD',
    image: '/catalog/square/nike-am90-1.jpg',
    images: ['/catalog/square/nike-am90-1.jpg', '/catalog/square/nike-am90-2.jpg', '/catalog/square/nike-am90-3.jpg'],
    rating: 4.7,
    reviewCount: 3912,
    description: 'Visible Air unit in the heel, waffle outsole, and the unmistakable layered upper. A 1990 icon.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Nike',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['White/Black/Grey', 'Infrared', 'Triple White'] },
    ],
  },
  {
    id: 'tr-8',
    name: 'Adidas Spezial',
    price: 100,
    currency: 'USD',
    image: '/catalog/square/adidas-spezial-1.jpg',
    images: ['/catalog/square/adidas-spezial-1.jpg', '/catalog/square/adidas-spezial-2.jpg', '/catalog/square/adidas-spezial-3.jpg'],
    rating: 4.5,
    reviewCount: 1234,
    description: 'Handball court heritage with a slim suede upper. The terrace favourite that crossed into mainstream.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Adidas',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['Light Blue', 'Navy', 'Red'] },
    ],
    tags: ['new'],
  },
  {
    id: 'tr-9',
    name: 'New Balance 9060',
    price: 160,
    currency: 'USD',
    image: '/catalog/square/nb-9060-1.jpg',
    images: ['/catalog/square/nb-9060-1.jpg', '/catalog/square/nb-9060-2.jpg', '/catalog/square/nb-9060-3.jpg'],
    rating: 4.8,
    reviewCount: 876,
    description: 'Futuristic design with SBS cushioning and suede/mesh panels. The most premium silhouette in the lineup.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'New Balance',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['Sea Salt', 'Dark Olivine', 'Turtledove'] },
    ],
  },
  {
    id: 'tr-10',
    name: 'Nike Cortez',
    price: 90,
    currency: 'USD',
    image: '/catalog/square/nike-cortez-1.jpg',
    images: ['/catalog/square/nike-cortez-1.jpg', '/catalog/square/nike-cortez-2.jpg', '/catalog/square/nike-cortez-3.jpg'],
    rating: 4.4,
    reviewCount: 1567,
    description: 'The original Nike running shoe. Leather upper, herringbone outsole, and the signature Swoosh. Timeless since 1972.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Nike',
    inStock: true,
    department: 'footwear',
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['White/Varsity Red', 'Black/White', 'Sail/Gorge Green'] },
    ],
  },
];

// ─── Home & Kitchen (landscape/mixed) ─────────────────────────────────────────

const homeKitchenProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Cast Iron Shallow Casserole',
    subtitle: 'With Stainless Steel Knob',
    price: 192.50,
    originalPrice: 275,
    discount: 30,
    currency: 'EUR',
    image: '/images/pan-1.png',
    images: ['/images/pan-1.png', '/images/pan-2.png', '/images/pan-3.png', '/images/pan-4.png', '/images/pan-9.jpg', '/images/pan-6.jpg', '/images/pan-7.jpg'],
    rating: 4.8,
    reviewCount: 127,
    description: 'The iconic cast iron casserole that has been at the heart of family kitchens for generations. Perfect for slow-cooking, braising, roasting, and baking.',
    category: 'kitchen',
    subcategory: 'Cast Iron',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    tags: ['bestseller', 'sale'],
    colors: [
      { value: 'volcanic', label: 'Volcanic', hex: '#E85D04' },
      { value: 'cerise', label: 'Cerise', hex: '#DC2626' },
      { value: 'meringue', label: 'Meringue', hex: '#FEF3C7' },
      { value: 'satin-black', label: 'Satin Black', hex: '#1F2937' },
      { value: 'marseille', label: 'Marseille', hex: '#2563EB' },
      { value: 'deep-teal', label: 'Deep Teal', hex: '#0D9488' },
    ],
    sizes: [
      { value: '26cm', label: '26 CM / 2.2L', price: 192.50, originalPrice: 275, discount: 30 },
      { value: '30cm', label: '30 CM / 3.5L', price: 265, originalPrice: null, discount: null },
      { value: '32cm', label: '32 CM / 4.2L', price: 355, originalPrice: null, discount: null },
    ],
    variants: [
      { type: 'color', options: ['Volcanic', 'Cerise', 'Meringue', 'Satin Black', 'Marseille', 'Deep Teal'] },
      { type: 'size', options: ['26 CM / 2.2L', '30 CM / 3.5L', '32 CM / 4.2L'] },
    ],
  },
  {
    id: 'prod-002',
    name: 'Cast Iron Round Dutch Oven',
    subtitle: '5.5 Quart',
    price: 385,
    currency: 'EUR',
    image: '/images/Cast-Iron-Round-Dutch-Oven.jpg',
    rating: 4.9,
    reviewCount: 89,
    description: 'The ultimate kitchen workhorse. Perfect for soups, stews, roasts, and even fresh-baked bread.',
    category: 'kitchen',
    subcategory: 'Cast Iron',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    tags: ['new'],
    colors: [
      { value: 'volcanic', label: 'Volcanic', hex: '#E85D04' },
      { value: 'deep-teal', label: 'Deep Teal', hex: '#0D9488' },
      { value: 'satin-black', label: 'Satin Black', hex: '#1F2937' },
    ],
    variants: [
      { type: 'color', options: ['Volcanic', 'Deep Teal', 'Satin Black'] },
    ],
  },
  {
    id: 'prod-005',
    name: 'Pour Over Coffee Maker',
    subtitle: 'Ceramic Dripper Set',
    price: 78,
    currency: 'EUR',
    image: '/images/Pour-Over-Coffee-Maker.jpg',
    rating: 4.8,
    reviewCount: 142,
    description: 'Handcrafted ceramic dripper for the perfect pour-over coffee. Includes carafe and filters.',
    category: 'kitchen',
    subcategory: 'Coffee',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    tags: ['bestseller'],
    colors: [
      { value: 'white', label: 'White', hex: '#FFFFFF' },
      { value: 'black', label: 'Matte Black', hex: '#1F2937' },
      { value: 'sage', label: 'Sage', hex: '#84CC16' },
    ],
    variants: [
      { type: 'color', options: ['White', 'Matte Black', 'Sage'] },
    ],
  },
  {
    id: 'prod-006',
    name: 'Cast Iron Teapot',
    subtitle: 'Traditional Japanese Style',
    price: 125,
    currency: 'EUR',
    image: '/images/Cast-Iron-Teapot.jpg',
    rating: 4.9,
    reviewCount: 67,
    description: 'Beautiful tetsubin-style teapot. Retains heat beautifully and adds a touch of elegance to tea time.',
    category: 'kitchen',
    subcategory: 'Tea',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    tags: ['premium'],
    colors: [
      { value: 'black', label: 'Black', hex: '#1F2937' },
      { value: 'red', label: 'Red', hex: '#DC2626' },
    ],
    variants: [
      { type: 'color', options: ['Black', 'Red'] },
    ],
  },
  {
    id: 'prod-007',
    name: 'Electric Gooseneck Kettle',
    subtitle: 'Temperature Control',
    price: 149,
    originalPrice: 179,
    discount: 17,
    currency: 'EUR',
    image: '/images/Electric-Gooseneck-Kettle.jpeg',
    rating: 4.7,
    reviewCount: 98,
    description: 'Precision temperature control from 140°F to 212°F. Perfect for coffee and tea enthusiasts.',
    category: 'kitchen',
    subcategory: 'Coffee',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    tags: ['sale'],
    variants: [],
  },
  {
    id: 'prod-008',
    name: 'Ceramic Baking Dish',
    subtitle: 'Rectangular 9x13',
    price: 65,
    currency: 'EUR',
    image: '/images/Ceramic-Baking-Dish.jpg',
    rating: 4.6,
    reviewCount: 78,
    description: 'Oven-safe ceramic baking dish. Perfect for casseroles, lasagna, and desserts.',
    category: 'kitchen',
    subcategory: 'Bakeware',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    colors: [
      { value: 'white', label: 'White', hex: '#FFFFFF' },
      { value: 'blue', label: 'Marseille Blue', hex: '#2563EB' },
      { value: 'red', label: 'Cerise', hex: '#DC2626' },
    ],
    variants: [
      { type: 'color', options: ['White', 'Marseille Blue', 'Cerise'] },
    ],
  },
  {
    id: 'prod-011',
    name: 'Wooden Cutting Board',
    subtitle: 'Acacia Wood - Large',
    price: 55,
    currency: 'EUR',
    image: '/images/Wooden-Cutting-Board.jpg',
    rating: 4.8,
    reviewCount: 167,
    description: 'Beautiful acacia wood cutting board with juice groove. A kitchen essential.',
    category: 'kitchen',
    subcategory: 'Kitchen Tools',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    tags: ['eco-friendly'],
    variants: [],
  },
  {
    id: 'prod-019',
    name: 'Coffee Grinder',
    subtitle: 'Burr Grinder - 40 Settings',
    price: 189,
    currency: 'EUR',
    image: '/images/Coffee-Grinder.jpg',
    rating: 4.9,
    reviewCount: 112,
    description: 'Conical burr grinder with 40 precise grind settings. From espresso fine to French press coarse.',
    category: 'kitchen',
    subcategory: 'Coffee',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    tags: ['premium'],
    variants: [],
  },
  {
    id: 'prod-025',
    name: 'Kitchen Utensil Set',
    subtitle: '6-Piece Silicone',
    price: 42,
    currency: 'EUR',
    image: '/images/Kitchen-Utensil-Set.jpeg',
    rating: 4.7,
    reviewCount: 312,
    description: 'Heat-resistant silicone heads with bamboo handles. Includes spatula, spoon, ladle, and more.',
    category: 'kitchen',
    subcategory: 'Kitchen Tools',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    tags: ['bestseller'],
    colors: [
      { value: 'black', label: 'Black', hex: '#1F2937' },
      { value: 'sage', label: 'Sage', hex: '#84CC16' },
      { value: 'coral', label: 'Coral', hex: '#F97316' },
    ],
    variants: [
      { type: 'color', options: ['Black', 'Sage', 'Coral'] },
    ],
  },
  {
    id: 'prod-028',
    name: 'Digital Kitchen Scale',
    subtitle: 'Precision to 0.1g',
    price: 28,
    originalPrice: 38,
    discount: 26,
    currency: 'EUR',
    image: '/images/Digital-Kitchen-Scale.jpg',
    rating: 4.8,
    reviewCount: 423,
    description: 'Sleek stainless steel design with easy-read LCD. Essential for baking and portion control.',
    category: 'kitchen',
    subcategory: 'Kitchen Tools',
    brand: 'MAISON',
    inStock: true,
    department: 'home-kitchen',
    tags: ['sale'],
    variants: [],
  },
];

// ─── Furniture (landscape) ─────────────────────────────────────────────────────

const furnitureProducts: Product[] = [
  {
    id: 'sofa-1',
    name: 'Alba 3-Seater Sofa',
    price: 2199,
    currency: 'USD',
    image: '/catalog/landscape/alba-3-seater-1.jpg',
    images: ['/catalog/landscape/alba-3-seater-1.jpg', '/catalog/landscape/alba-3-seater-2.jpg', '/catalog/landscape/alba-3-seater-3.jpg'],
    rating: 4.8,
    reviewCount: 342,
    description: 'Curved silhouette in bouclé fabric with solid oak legs. Deep feather-down cushions and wide arms.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Cream Bouclé', 'Charcoal', 'Olive'] }],
    tags: ['bestseller'],
  },
  {
    id: 'sofa-2',
    name: 'Harlow Modular Corner Sofa',
    price: 3499,
    currency: 'USD',
    image: '/catalog/landscape/harlow-corner-1.jpg',
    images: ['/catalog/landscape/harlow-corner-1.jpg', '/catalog/landscape/harlow-corner-2.jpg', '/catalog/landscape/harlow-corner-3.jpg'],
    rating: 4.7,
    reviewCount: 189,
    description: 'L-shaped modular design with soft chenille upholstery. Rearrange sections to fit your space.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Stone', 'Forest Green', 'Slate Blue'] }],
    tags: ['new'],
  },
  {
    id: 'sofa-3',
    name: 'Oslo 2-Seater Sofa',
    price: 1599,
    currency: 'USD',
    image: '/catalog/landscape/oslo-2-seater-1.jpg',
    images: ['/catalog/landscape/oslo-2-seater-1.jpg', '/catalog/landscape/oslo-2-seater-2.jpg', '/catalog/landscape/oslo-2-seater-3.jpg'],
    rating: 4.6,
    reviewCount: 278,
    description: 'Compact Scandi-inspired two-seater with tapered walnut legs. High-resilience foam for lasting comfort.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Oatmeal Linen', 'Sage', 'Charcoal'] }],
  },
  {
    id: 'sofa-4',
    name: 'Finley Chaise Sofa',
    price: 2799,
    currency: 'USD',
    image: '/catalog/landscape/finley-chaise-1.jpg',
    images: ['/catalog/landscape/finley-chaise-1.jpg', '/catalog/landscape/finley-chaise-2.jpg', '/catalog/landscape/finley-chaise-3.jpg'],
    rating: 4.5,
    reviewCount: 156,
    description: 'Generous chaise end for stretching out. Pocket-sprung seat cushions with a feather-wrap top layer.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Grey Velvet', 'Navy', 'Blush'] }],
  },
  {
    id: 'sofa-5',
    name: 'Mila Compact Sofa',
    price: 1299,
    currency: 'USD',
    image: '/catalog/landscape/mila-compact-1.jpg',
    images: ['/catalog/landscape/mila-compact-1.jpg', '/catalog/landscape/mila-compact-2.jpg', '/catalog/landscape/mila-compact-3.jpg'],
    rating: 4.4,
    reviewCount: 312,
    description: "Apartment-sized sofa that doesn't compromise on comfort. Removable covers for easy cleaning.",
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Cream', 'Warm Grey', 'Terracotta'] }],
  },
  {
    id: 'sofa-6',
    name: 'Neva Velvet 3-Seater',
    price: 2499,
    currency: 'USD',
    image: '/catalog/landscape/neva-velvet-1.jpg',
    images: ['/catalog/landscape/neva-velvet-1.jpg', '/catalog/landscape/neva-velvet-2.jpg', '/catalog/landscape/neva-velvet-3.jpg'],
    rating: 4.9,
    reviewCount: 423,
    description: 'Plush velvet upholstery with rolled arms and brass-capped legs. A statement centrepiece for the living room.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Emerald', 'Midnight Blue', 'Dusty Rose'] }],
    tags: ['bestseller'],
  },
  {
    id: 'sofa-7',
    name: 'Strand Leather Sofa',
    price: 3199,
    currency: 'USD',
    image: '/catalog/landscape/strand-leather-1.jpg',
    images: ['/catalog/landscape/strand-leather-1.jpg', '/catalog/landscape/strand-leather-2.jpg', '/catalog/landscape/strand-leather-3.jpg'],
    rating: 4.7,
    reviewCount: 198,
    description: 'Full-grain Italian leather on a solid hardwood frame. Develops a rich patina with age.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Cognac', 'Black', 'Tan'] }],
  },
  {
    id: 'sofa-8',
    name: 'Camden Linen Sofa',
    price: 1899,
    currency: 'USD',
    image: '/catalog/landscape/camden-linen-1.jpg',
    images: ['/catalog/landscape/camden-linen-1.jpg', '/catalog/landscape/camden-linen-2.jpg', '/catalog/landscape/camden-linen-3.jpg'],
    rating: 4.6,
    reviewCount: 267,
    description: 'Relaxed linen upholstery with a lived-in look from day one. Deep seats and plump back cushions.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Natural Linen', 'Soft White', 'Clay'] }],
  },
  {
    id: 'sofa-9',
    name: 'Kensington 4-Seater',
    price: 3899,
    currency: 'USD',
    image: '/catalog/landscape/kensington-4-seater-1.jpg',
    images: ['/catalog/landscape/kensington-4-seater-1.jpg', '/catalog/landscape/kensington-4-seater-2.jpg', '/catalog/landscape/kensington-4-seater-3.jpg'],
    rating: 4.8,
    reviewCount: 134,
    description: 'Grand four-seater with scroll arms and deep button tufting. Feather-filled seat and back cushions.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Steel Grey', 'Ivory', 'Olive'] }],
    tags: ['new'],
  },
  {
    id: 'sofa-10',
    name: 'Luna Bouclé Sofa',
    price: 2099,
    currency: 'USD',
    image: '/catalog/landscape/luna-boucle-1.jpg',
    images: ['/catalog/landscape/luna-boucle-1.jpg', '/catalog/landscape/luna-boucle-2.jpg', '/catalog/landscape/luna-boucle-3.jpg'],
    rating: 4.5,
    reviewCount: 389,
    description: 'Organic curved shape in textured bouclé fabric. Low profile with tubular metal legs.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    department: 'furniture',
    variants: [{ type: 'color', options: ['Off White', 'Camel', 'Sand'] }],
  },
];

// ─── Combined catalog ─────────────────────────────────────────────────────────

export const sharedCatalog: Product[] = [
  ...activewearProducts,
  ...footwearProducts,
  ...homeKitchenProducts,
  ...furnitureProducts,
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Find a product by ID */
export function getProductById(id: string): Product | undefined {
  return sharedCatalog.find(p => p.id === id);
}

/** Get all products in a department */
export function getProductsByDepartment(departmentId: string): Product[] {
  return sharedCatalog.filter(p => p.department === departmentId);
}

/** Find a department by ID */
export function getDepartmentById(id: string): Department | undefined {
  return departments.find(d => d.id === id);
}

/** Map from ImageRatio to DepartmentId */
const ratioDepartmentMap: Record<ImageRatio, DepartmentId> = {
  portrait: 'activewear',
  square: 'footwear',
  landscape: 'home-kitchen',
};

/** Get products by image ratio (backward-compat with old demo selector) */
export function getProductsByRatio(ratio: ImageRatio): Product[] {
  return getProductsByDepartment(ratioDepartmentMap[ratio]);
}

/** Search the catalog by query string */
export function searchCatalog(query: string, maxResults = 6): Product[] {
  const q = query.toLowerCase();

  const scored = sharedCatalog.map(product => {
    let score = 0;
    const name = product.name.toLowerCase();
    const desc = product.description.toLowerCase();
    const subcat = product.subcategory.toLowerCase();
    const brand = product.brand.toLowerCase();
    const dept = (product.department || '').toLowerCase();

    // Exact subcategory match (strongest signal)
    if (subcat.includes(q) || q.includes(subcat)) score += 10;
    // Department match
    if (dept.includes(q) || q.includes(dept)) score += 8;
    // Name match
    if (name.includes(q)) score += 8;
    // Brand match
    if (brand.includes(q) || q.includes(brand)) score += 5;
    // Description match
    if (desc.includes(q)) score += 3;

    // Individual words
    const words = q.split(/\s+/);
    for (const word of words) {
      if (word.length < 2) continue;
      if (subcat.includes(word)) score += 4;
      if (name.includes(word)) score += 3;
      if (brand.includes(word)) score += 3;
      if (dept.includes(word)) score += 2;
      if (desc.includes(word)) score += 1;
    }

    return { product, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.product);
}

// ─── Backward-compat aliases (for incremental migration) ──────────────────────

export const demoCatalog = sharedCatalog;
export const getDemoCatalog = () => sharedCatalog;
export const getDemoProductsByRatio = getProductsByRatio;
export const getDemoProductById = getProductById;
export const searchDemoCatalog = searchCatalog;
