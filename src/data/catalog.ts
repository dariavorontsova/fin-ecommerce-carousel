/**
 * Curated Demo Catalog
 * 
 * Three verticals, each representing a real-world store type:
 * 
 * PORTRAIT (3:4) — Gymshark tops & tees (athletic/gym wear)
 * SQUARE   (1:1) — Trainers (Nike, Adidas, New Balance street-style sneakers)
 * LANDSCAPE(4:3) — Sofas (premium home furniture)
 * 
 * Each product has 3 images for gallery/hover rotation.
 * 
 * IMAGE NAMING CONVENTION:
 *   /catalog/{ratio}/{slug}-{n}.jpg
 *   where n = 1, 2, 3
 *   Image 1 is the primary/hero image.
 * 
 * PORTRAIT examples:
 *   /catalog/portrait/power-tee-1.jpg
 *   /catalog/portrait/power-tee-2.jpg
 *   /catalog/portrait/power-tee-3.jpg
 * 
 * SQUARE examples:
 *   /catalog/square/nb-530-white-1.jpg
 * 
 * LANDSCAPE examples:
 *   /catalog/landscape/alba-3-seater-1.jpg
 */

import { Product } from '../types/product';

// ─── Portrait: Gymshark Tops & Tees ─────────────────────────────────────────

const portraitProducts: Product[] = [
  {
    id: 'gs-1',
    name: 'Power T-Shirt',
    price: 36,
    currency: 'USD',
    image: '/catalog/portrait/power-tee-1.jpg',
    images: [
      '/catalog/portrait/power-tee-1.jpg',
      '/catalog/portrait/power-tee-2.jpg',
      '/catalog/portrait/power-tee-3.jpg',
    ],
    rating: 3.7,
    reviewCount: 482,
    description: 'Oversized fit with sweat-wicking fabric and dropped shoulders. Built for heavy lifting sessions.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
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
    images: [
      '/catalog/portrait/crest-tee-1.jpg',
      '/catalog/portrait/crest-tee-2.jpg',
      '/catalog/portrait/crest-tee-3.jpg',
    ],
    rating: 4.1,
    reviewCount: 1247,
    description: 'Regular fit everyday tee with embroidered Gymshark crest logo. Soft-touch cotton blend.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
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
    images: [
      '/catalog/portrait/crest-oversized-1.jpg',
      '/catalog/portrait/crest-oversized-2.jpg',
      '/catalog/portrait/crest-oversized-3.jpg',
    ],
    rating: 4.1,
    reviewCount: 634,
    description: 'Relaxed oversized fit with the signature crest logo. Dropped shoulders and longer body length.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
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
    images: [
      '/catalog/portrait/legacy-tee-1.jpg',
      '/catalog/portrait/legacy-tee-2.jpg',
      '/catalog/portrait/legacy-tee-3.jpg',
    ],
    rating: 4.3,
    reviewCount: 856,
    description: 'Slim fit with a tailored cut that shows off your shape. Lightweight and breathable for intense workouts.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
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
    images: [
      '/catalog/portrait/geo-seamless-1.jpg',
      '/catalog/portrait/geo-seamless-2.jpg',
      '/catalog/portrait/geo-seamless-3.jpg',
    ],
    rating: 4.5,
    reviewCount: 723,
    description: 'Seamless knit construction with geometric texture for ventilation. Slim fit, second-skin feel.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
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
    images: [
      '/catalog/portrait/performance-tee-1.jpg',
      '/catalog/portrait/performance-tee-2.jpg',
      '/catalog/portrait/performance-tee-3.jpg',
    ],
    rating: 4.1,
    reviewCount: 512,
    description: 'Sweat-wicking oversized tee with mesh back panel for airflow. Perfect for conditioning and cardio.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
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
    images: [
      '/catalog/portrait/lightweight-seamless-1.jpg',
      '/catalog/portrait/lightweight-seamless-2.jpg',
      '/catalog/portrait/lightweight-seamless-3.jpg',
    ],
    rating: 3.7,
    reviewCount: 389,
    description: 'Ultra-light seamless knit for unrestricted movement. Subtle stripe texture with sweat-wicking finish.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
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
    images: [
      '/catalog/portrait/arrival-tee-1.jpg',
      '/catalog/portrait/arrival-tee-2.jpg',
      '/catalog/portrait/arrival-tee-3.jpg',
    ],
    rating: 4.0,
    reviewCount: 943,
    description: 'Regular fit gym essential with sweat-wicking fabric. Clean design that works for training and everyday.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
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
    images: [
      '/catalog/portrait/critical-tank-1.jpg',
      '/catalog/portrait/critical-tank-2.jpg',
      '/catalog/portrait/critical-tank-3.jpg',
    ],
    rating: 4.2,
    reviewCount: 567,
    description: 'Slim fit tank with deep cut armholes for full range of motion. Ideal for shoulders and arms day.',
    category: 'clothing',
    subcategory: 'tops',
    brand: 'Gymshark',
    inStock: true,
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
    images: [
      '/catalog/portrait/conditioning-tee-1.jpg',
      '/catalog/portrait/conditioning-tee-2.jpg',
      '/catalog/portrait/conditioning-tee-3.jpg',
    ],
    rating: 4.4,
    reviewCount: 298,
    description: 'Heavyweight oversized tee with bold Conditioning Club graphic. Relaxed fit for rest days and the gym.',
    category: 'clothing',
    subcategory: 't-shirts',
    brand: 'Gymshark',
    inStock: true,
    variants: [
      { type: 'size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { type: 'color', options: ['Black', 'Off White', 'Washed Khaki'] },
    ],
    tags: ['new'],
  },
];

// ─── Square: Trainers (Multi-brand) ─────────────────────────────────────────

const squareProducts: Product[] = [
  {
    id: 'tr-1',
    name: 'Nike Dunk Low Retro',
    price: 120,
    currency: 'USD',
    image: '/catalog/square/nike-dunk-low-1.jpg',
    images: [
      '/catalog/square/nike-dunk-low-1.jpg',
      '/catalog/square/nike-dunk-low-2.jpg',
      '/catalog/square/nike-dunk-low-3.jpg',
    ],
    rating: 4.7,
    reviewCount: 2834,
    description: 'The court classic reborn. Padded collar, leather upper, and the iconic colour-blocking that started it all.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Nike',
    inStock: true,
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['White/Black', 'Grey Fog', 'Vintage Green', 'Panda'] },
    ],
    tags: ['bestseller'],
  },
  {
    id: 'tr-2',
    name: 'Nike Air Force 1 \'07',
    price: 115,
    currency: 'USD',
    image: '/catalog/square/nike-af1-1.jpg',
    images: [
      '/catalog/square/nike-af1-1.jpg',
      '/catalog/square/nike-af1-2.jpg',
      '/catalog/square/nike-af1-3.jpg',
    ],
    rating: 4.8,
    reviewCount: 5621,
    description: 'The one that needs no introduction. Air cushioning, full-grain leather, and the pivoting circle traction pattern.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Nike',
    inStock: true,
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
    images: [
      '/catalog/square/adidas-samba-1.jpg',
      '/catalog/square/adidas-samba-2.jpg',
      '/catalog/square/adidas-samba-3.jpg',
    ],
    rating: 4.7,
    reviewCount: 3456,
    description: 'Indoor football heritage turned street icon. Full-grain leather upper with suede T-toe overlay and gum sole.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Adidas',
    inStock: true,
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
    images: [
      '/catalog/square/adidas-gazelle-1.jpg',
      '/catalog/square/adidas-gazelle-2.jpg',
      '/catalog/square/adidas-gazelle-3.jpg',
    ],
    rating: 4.6,
    reviewCount: 2187,
    description: 'The 1966 original. Premium suede upper with serrated three stripes and herringbone rubber outsole.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Adidas',
    inStock: true,
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
    images: [
      '/catalog/square/nb-550-1.jpg',
      '/catalog/square/nb-550-2.jpg',
      '/catalog/square/nb-550-3.jpg',
    ],
    rating: 4.5,
    reviewCount: 1456,
    description: 'Basketball-inspired low-top with leather upper and perforated toe box. Clean court-to-street look.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'New Balance',
    inStock: true,
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
    images: [
      '/catalog/square/nb-530-1.jpg',
      '/catalog/square/nb-530-2.jpg',
      '/catalog/square/nb-530-3.jpg',
    ],
    rating: 4.6,
    reviewCount: 1823,
    description: 'Retro runner with ABZORB cushioning and metallic silver accents. The Y2K silhouette everyone wants.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'New Balance',
    inStock: true,
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
    images: [
      '/catalog/square/nike-am90-1.jpg',
      '/catalog/square/nike-am90-2.jpg',
      '/catalog/square/nike-am90-3.jpg',
    ],
    rating: 4.7,
    reviewCount: 3912,
    description: 'Visible Air unit in the heel, waffle outsole, and the unmistakable layered upper. A 1990 icon.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Nike',
    inStock: true,
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
    images: [
      '/catalog/square/adidas-spezial-1.jpg',
      '/catalog/square/adidas-spezial-2.jpg',
      '/catalog/square/adidas-spezial-3.jpg',
    ],
    rating: 4.5,
    reviewCount: 1234,
    description: 'Handball court heritage with a slim suede upper. The terrace favourite that crossed into mainstream.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Adidas',
    inStock: true,
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
    images: [
      '/catalog/square/nb-9060-1.jpg',
      '/catalog/square/nb-9060-2.jpg',
      '/catalog/square/nb-9060-3.jpg',
    ],
    rating: 4.8,
    reviewCount: 876,
    description: 'Futuristic design with SBS cushioning and suede/mesh panels. The most premium silhouette in the lineup.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'New Balance',
    inStock: true,
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
    images: [
      '/catalog/square/nike-cortez-1.jpg',
      '/catalog/square/nike-cortez-2.jpg',
      '/catalog/square/nike-cortez-3.jpg',
    ],
    rating: 4.4,
    reviewCount: 1567,
    description: 'The original Nike running shoe. Leather upper, herringbone outsole, and the signature Swoosh. Timeless since 1972.',
    category: 'clothing',
    subcategory: 'trainers',
    brand: 'Nike',
    inStock: true,
    variants: [
      { type: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { type: 'color', options: ['White/Varsity Red', 'Black/White', 'Sail/Gorge Green'] },
    ],
  },
];

// ─── Landscape: Sofas ───────────────────────────────────────────────────────

const landscapeProducts: Product[] = [
  {
    id: 'sofa-1',
    name: 'Alba 3-Seater Sofa',
    price: 2199,
    currency: 'USD',
    image: '/catalog/landscape/alba-3-seater-1.jpg',
    images: [
      '/catalog/landscape/alba-3-seater-1.jpg',
      '/catalog/landscape/alba-3-seater-2.jpg',
      '/catalog/landscape/alba-3-seater-3.jpg',
    ],
    rating: 4.8,
    reviewCount: 342,
    description: 'Curved silhouette in bouclé fabric with solid oak legs. Deep feather-down cushions and wide arms.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Cream Bouclé', 'Charcoal', 'Olive'] },
    ],
    tags: ['bestseller'],
  },
  {
    id: 'sofa-2',
    name: 'Harlow Modular Corner Sofa',
    price: 3499,
    currency: 'USD',
    image: '/catalog/landscape/harlow-corner-1.jpg',
    images: [
      '/catalog/landscape/harlow-corner-1.jpg',
      '/catalog/landscape/harlow-corner-2.jpg',
      '/catalog/landscape/harlow-corner-3.jpg',
    ],
    rating: 4.7,
    reviewCount: 189,
    description: 'L-shaped modular design with soft chenille upholstery. Rearrange sections to fit your space.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Stone', 'Forest Green', 'Slate Blue'] },
    ],
    tags: ['new'],
  },
  {
    id: 'sofa-3',
    name: 'Oslo 2-Seater Sofa',
    price: 1599,
    currency: 'USD',
    image: '/catalog/landscape/oslo-2-seater-1.jpg',
    images: [
      '/catalog/landscape/oslo-2-seater-1.jpg',
      '/catalog/landscape/oslo-2-seater-2.jpg',
      '/catalog/landscape/oslo-2-seater-3.jpg',
    ],
    rating: 4.6,
    reviewCount: 278,
    description: 'Compact Scandi-inspired two-seater with tapered walnut legs. High-resilience foam for lasting comfort.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Oatmeal Linen', 'Sage', 'Charcoal'] },
    ],
  },
  {
    id: 'sofa-4',
    name: 'Finley Chaise Sofa',
    price: 2799,
    currency: 'USD',
    image: '/catalog/landscape/finley-chaise-1.jpg',
    images: [
      '/catalog/landscape/finley-chaise-1.jpg',
      '/catalog/landscape/finley-chaise-2.jpg',
      '/catalog/landscape/finley-chaise-3.jpg',
    ],
    rating: 4.5,
    reviewCount: 156,
    description: 'Generous chaise end for stretching out. Pocket-sprung seat cushions with a feather-wrap top layer.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Grey Velvet', 'Navy', 'Blush'] },
    ],
  },
  {
    id: 'sofa-5',
    name: 'Mila Compact Sofa',
    price: 1299,
    currency: 'USD',
    image: '/catalog/landscape/mila-compact-1.jpg',
    images: [
      '/catalog/landscape/mila-compact-1.jpg',
      '/catalog/landscape/mila-compact-2.jpg',
      '/catalog/landscape/mila-compact-3.jpg',
    ],
    rating: 4.4,
    reviewCount: 312,
    description: 'Apartment-sized sofa that doesn\'t compromise on comfort. Removable covers for easy cleaning.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Cream', 'Warm Grey', 'Terracotta'] },
    ],
  },
  {
    id: 'sofa-6',
    name: 'Neva Velvet 3-Seater',
    price: 2499,
    currency: 'USD',
    image: '/catalog/landscape/neva-velvet-1.jpg',
    images: [
      '/catalog/landscape/neva-velvet-1.jpg',
      '/catalog/landscape/neva-velvet-2.jpg',
      '/catalog/landscape/neva-velvet-3.jpg',
    ],
    rating: 4.9,
    reviewCount: 423,
    description: 'Plush velvet upholstery with rolled arms and brass-capped legs. A statement centrepiece for the living room.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Emerald', 'Midnight Blue', 'Dusty Rose'] },
    ],
    tags: ['bestseller'],
  },
  {
    id: 'sofa-7',
    name: 'Strand Leather Sofa',
    price: 3199,
    currency: 'USD',
    image: '/catalog/landscape/strand-leather-1.jpg',
    images: [
      '/catalog/landscape/strand-leather-1.jpg',
      '/catalog/landscape/strand-leather-2.jpg',
      '/catalog/landscape/strand-leather-3.jpg',
    ],
    rating: 4.7,
    reviewCount: 198,
    description: 'Full-grain Italian leather on a solid hardwood frame. Develops a rich patina with age.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Cognac', 'Black', 'Tan'] },
    ],
  },
  {
    id: 'sofa-8',
    name: 'Camden Linen Sofa',
    price: 1899,
    currency: 'USD',
    image: '/catalog/landscape/camden-linen-1.jpg',
    images: [
      '/catalog/landscape/camden-linen-1.jpg',
      '/catalog/landscape/camden-linen-2.jpg',
      '/catalog/landscape/camden-linen-3.jpg',
    ],
    rating: 4.6,
    reviewCount: 267,
    description: 'Relaxed linen upholstery with a lived-in look from day one. Deep seats and plump back cushions.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Natural Linen', 'Soft White', 'Clay'] },
    ],
  },
  {
    id: 'sofa-9',
    name: 'Kensington 4-Seater',
    price: 3899,
    currency: 'USD',
    image: '/catalog/landscape/kensington-4-seater-1.jpg',
    images: [
      '/catalog/landscape/kensington-4-seater-1.jpg',
      '/catalog/landscape/kensington-4-seater-2.jpg',
      '/catalog/landscape/kensington-4-seater-3.jpg',
    ],
    rating: 4.8,
    reviewCount: 134,
    description: 'Grand four-seater with scroll arms and deep button tufting. Feather-filled seat and back cushions.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Steel Grey', 'Ivory', 'Olive'] },
    ],
    tags: ['new'],
  },
  {
    id: 'sofa-10',
    name: 'Luna Bouclé Sofa',
    price: 2099,
    currency: 'USD',
    image: '/catalog/landscape/luna-boucle-1.jpg',
    images: [
      '/catalog/landscape/luna-boucle-1.jpg',
      '/catalog/landscape/luna-boucle-2.jpg',
      '/catalog/landscape/luna-boucle-3.jpg',
    ],
    rating: 4.5,
    reviewCount: 389,
    description: 'Organic curved shape in textured bouclé fabric. Low profile with tubular metal legs.',
    category: 'furniture',
    subcategory: 'sofas',
    brand: 'Kave Home',
    inStock: true,
    variants: [
      { type: 'color', options: ['Off White', 'Camel', 'Sand'] },
    ],
  },
];

// ─── Exports ────────────────────────────────────────────────────────────────

export const demoCatalog: Product[] = [
  ...portraitProducts,
  ...squareProducts,
  ...landscapeProducts,
];

/** Get all demo products */
export function getDemoCatalog(): Product[] {
  return demoCatalog;
}

/** Get products by ratio group */
export function getDemoProductsByRatio(ratio: 'landscape' | 'square' | 'portrait'): Product[] {
  switch (ratio) {
    case 'landscape': return landscapeProducts;
    case 'square': return squareProducts;
    case 'portrait': return portraitProducts;
  }
}

/** Find a demo product by ID */
export function getDemoProductById(id: string): Product | undefined {
  return demoCatalog.find(p => p.id === id);
}

/** Search demo catalog by query string */
export function searchDemoCatalog(query: string, maxResults = 6): Product[] {
  const q = query.toLowerCase();
  
  // Score each product by relevance
  const scored = demoCatalog.map(product => {
    let score = 0;
    const name = product.name.toLowerCase();
    const desc = product.description.toLowerCase();
    const subcat = product.subcategory.toLowerCase();
    const brand = product.brand.toLowerCase();
    
    // Exact subcategory match (strongest signal)
    if (subcat.includes(q) || q.includes(subcat)) score += 10;
    // Name match
    if (name.includes(q)) score += 8;
    // Brand match
    if (brand.includes(q) || q.includes(brand.toLowerCase())) score += 5;
    // Description match
    if (desc.includes(q)) score += 3;
    
    // Also check individual words
    const words = q.split(/\s+/);
    for (const word of words) {
      if (word.length < 2) continue;
      if (subcat.includes(word)) score += 4;
      if (name.includes(word)) score += 3;
      if (brand.includes(word)) score += 3;
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
