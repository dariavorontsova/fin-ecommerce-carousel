/**
 * PDP Enrichment Data
 *
 * Realistic product detail content modeled after actual e-commerce sites:
 *   - Gymshark (activewear) — lean: materials, fit, care, model info
 *   - Nike (footwear) — medium: heritage story, benefits, details, size guide
 *   - Le Creuset (kitchen) — heavy: features, specs table, heat sources, care, heritage
 *   - Kave Home (furniture) — heaviest: composition, dimensions, assembly, delivery, warranty, room guide, certifications
 *
 * The intentional asymmetry in content depth is the point — the contrast
 * between navigating all this vs asking the AI agent makes the demo compelling.
 */

export interface AccordionSection {
  value: string;
  title: string;
  html: string;
}

export interface EditorialSection {
  title?: string;
  html: string;
}

export interface Review {
  id: number;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
}

export interface Enrichment {
  accordions: AccordionSection[];
  editorialSections?: EditorialSection[];
  modelInfo?: string;
  reviews?: Review[];
}

// ─── Per-product enrichment ───────────────────────────────────────────────────

export const enrichmentData: Record<string, Enrichment> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // KITCHEN — Le Creuset-inspired (heavy)
  // ═══════════════════════════════════════════════════════════════════════════

  'prod-001': {
    accordions: [
      {
        value: 'features', title: 'Key Features', html: `
        <ul class="space-y-1.5">
          <li>Enamelled cast iron delivers superior heat distribution and even cooking</li>
          <li>Smooth interior enamel prevents sticking and staining — cleans up easily</li>
          <li>Does not require seasoning — ready to use straight out of the box</li>
          <li>Wide loop handles provide a safe, comfortable grip even with oven mitts</li>
          <li>Tight-fitting lid locks in moisture and flavour</li>
          <li>Stainless steel knob is oven-safe to 260°C / 500°F</li>
          <li>Capacity markings on interior for quick reference</li>
          <li>Lightest weight per litre in its class</li>
          <li>Designed for generations of daily use</li>
          <li>Dishwasher safe</li>
        </ul>`,
      },
      {
        value: 'specs', title: 'Specifications', html: `
        <table class="w-full text-sm">
          <tbody>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Capacity</td><td class="py-2 font-medium">2.2 L (26 cm) / 3.5 L (30 cm) / 4.2 L (32 cm)</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Material</td><td class="py-2 font-medium">Enamelled cast iron</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Weight (26 cm)</td><td class="py-2 font-medium">3.9 kg</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Depth</td><td class="py-2 font-medium">7.2 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Overall length (with handles)</td><td class="py-2 font-medium">34 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Oven safe to</td><td class="py-2 font-medium">260°C / 500°F</td></tr>
            <tr><td class="py-2 text-muted-foreground">Country of origin</td><td class="py-2 font-medium">France</td></tr>
          </tbody>
        </table>`,
      },
      {
        value: 'heat', title: 'Heat Source Compatibility', html: `
        <p class="mb-3">Suitable for all heat sources:</p>
        <div class="grid grid-cols-2 gap-2">
          <div class="flex items-center gap-2 text-sm"><span class="text-green-600">✓</span> Gas hob</div>
          <div class="flex items-center gap-2 text-sm"><span class="text-green-600">✓</span> Electric hob</div>
          <div class="flex items-center gap-2 text-sm"><span class="text-green-600">✓</span> Ceramic cooktop</div>
          <div class="flex items-center gap-2 text-sm"><span class="text-green-600">✓</span> Induction hob</div>
          <div class="flex items-center gap-2 text-sm"><span class="text-green-600">✓</span> Oven</div>
          <div class="flex items-center gap-2 text-sm"><span class="text-green-600">✓</span> Grill</div>
        </div>`,
      },
      {
        value: 'care', title: 'Care & Use', html: `
        <div class="space-y-3">
          <div>
            <p class="font-medium mb-1">Before First Use</p>
            <ul class="space-y-1"><li>Remove all packaging and labels</li><li>Wash in hot soapy water, rinse and dry thoroughly</li><li>Condition the interior by coating with a thin layer of vegetable oil</li></ul>
          </div>
          <div>
            <p class="font-medium mb-1">Cooking Tips</p>
            <ul class="space-y-1"><li>Always start on low to medium heat — cast iron retains heat exceptionally well</li><li>No need for high heat settings; medium is sufficient for most cooking</li><li>Use silicone, wooden, or heat-resistant nylon utensils</li><li>Metal utensils may be used with care but avoid scraping</li><li>Allow to cool before cleaning</li></ul>
          </div>
          <div>
            <p class="font-medium mb-1">Cleaning</p>
            <ul class="space-y-1"><li>Hand wash in warm soapy water with a nylon brush or pad</li><li>Dishwasher safe, though constant dishwashing may dull the finish over time (cosmetic only)</li><li>For stuck-on food, soak in warm soapy water for 15–20 minutes</li><li>Never store when still damp</li><li>Avoid knocking or bumping on hard surfaces to prevent chipping</li></ul>
          </div>
        </div>`,
      },
      {
        value: 'delivery', title: 'Payment, Delivery & Returns', html: `
        <div class="space-y-3">
          <div>
            <p class="font-medium mb-1">Payment Methods</p>
            <p>Visa, Mastercard, PayPal, Apple Pay, Klarna (Pay in 3)</p>
          </div>
          <div>
            <p class="font-medium mb-1">Delivery</p>
            <ul class="space-y-1"><li>Standard Delivery (3–5 business days): €10.00</li><li>Express Delivery (1–2 business days): €20.00</li><li>Complimentary delivery on orders over €100</li></ul>
          </div>
          <div>
            <p class="font-medium mb-1">Returns</p>
            <p>30-day return policy. Items must be unused and in original packaging. Return shipping is free.</p>
          </div>
        </div>`,
      },
      {
        value: 'warranty', title: 'Lifetime Warranty', html: `
        <p class="mb-2">This product is covered by a <strong>Lifetime Limited Warranty</strong>.</p>
        <p class="mb-2">The cookware is warranted to be free from defects in material and workmanship for normal household use. Defective cookware will be replaced free of charge.</p>
        <p class="text-xs text-muted-foreground">This warranty does not cover damage from abuse, commercial use, neglect, overheating, or use not in accordance with care instructions.</p>`,
      },
    ],
    editorialSections: [
      {
        title: 'Crafted by Artisans Since 1925',
        html: `<p class="text-base leading-relaxed mb-4">The first to pioneer colourful enamelled cast iron cookware, our foundry has been crafting these pieces by hand from the finest materials since 1925. In our workshop in Northern France, each piece passes through the hands of at least 15 artisans — cast individually in sand moulds, then hand-inspected at every stage of the process.</p><p class="text-base leading-relaxed">No two pieces are exactly alike. Each one carries the subtle marks of its handmade origin — a testament to nearly a century of craftsmanship that has been passed down through generations. When you cook with cast iron, you're not just using a tool — you're continuing a tradition.</p>`,
      },
    ],
    reviews: [
      { id: 1, author: 'Sarah M.', rating: 5, date: '2 weeks ago', title: 'Worth every penny!', content: 'This casserole is absolutely beautiful and cooks perfectly. The heat distribution is even and it retains heat wonderfully. I use it almost daily for everything from soups to roasts. The enamel coating makes cleanup incredibly easy.' },
      { id: 2, author: 'James K.', rating: 5, date: '1 month ago', title: 'Family heirloom quality', content: 'The volcanic orange colour is stunning on our stovetop. Already planning to buy more pieces. We\'ve made countless stews, braises, and even baked bread in it. The craftsmanship is evident in every detail.' },
      { id: 3, author: 'Emma L.', rating: 4, date: '2 months ago', title: 'Great but heavy', content: 'Excellent quality and beautiful design. Only downside is the weight — it\'s quite heavy when full, so moving it from stovetop to oven requires some effort. But the cooking results are fantastic!' },
      { id: 4, author: 'Michael R.', rating: 5, date: '3 months ago', title: 'Professional quality at home', content: 'As a home cook who takes food seriously, this casserole has transformed my cooking. The even heat distribution means no hot spots — everything browns uniformly and cooks at the same rate.' },
      { id: 5, author: 'Lisa T.', rating: 5, date: '4 months ago', title: 'Beautiful and functional', content: 'I was hesitant about the price but this is truly exceptional. Goes from stovetop to oven seamlessly, and looks gorgeous enough to serve at the table. Guests always compliment it.' },
      { id: 6, author: 'David H.', rating: 4, date: '5 months ago', title: 'Impressive craftsmanship', content: 'The quality is immediately apparent when you pick this up. Heavy, solid, and beautifully finished with no imperfections in the enamel. Retains heat better than anything I\'ve owned.' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FURNITURE — Kave Home-inspired (heaviest)
  // ═══════════════════════════════════════════════════════════════════════════

  'sofa-1': {
    accordions: [
      {
        value: 'composition', title: 'Composition & Materials', html: `
        <div class="space-y-3">
          <p class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Material Breakdown</p>
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b"><td class="py-1.5 text-muted-foreground">Frame</td><td class="py-1.5">Kiln-dried solid pine (Pinus pinaster) — 30%</td></tr>
              <tr class="border-b"><td class="py-1.5 text-muted-foreground">Seat foam</td><td class="py-1.5">PU foam — 25% (30 kg/m³ soft base + 20 kg/m³ hard layer + 20 kg/m³ soft top)</td></tr>
              <tr class="border-b"><td class="py-1.5 text-muted-foreground">Upholstery</td><td class="py-1.5">85% polyester bouclé, 15% acrylic — 15%</td></tr>
              <tr class="border-b"><td class="py-1.5 text-muted-foreground">Back cushions</td><td class="py-1.5">Feather-down blend wrapped around foam core — 14%</td></tr>
              <tr class="border-b"><td class="py-1.5 text-muted-foreground">Support panel</td><td class="py-1.5">Particle board E0 — 11%</td></tr>
              <tr><td class="py-1.5 text-muted-foreground">Legs</td><td class="py-1.5">Solid European oak, lacquered finish — 5%</td></tr>
            </tbody>
          </table>
          <p class="text-xs text-muted-foreground mt-2">Suspension: Sinuous steel springs across the seat base for even weight distribution and lasting support.</p>
        </div>`,
      },
      {
        value: 'dimensions', title: 'Dimensions', html: `
        <table class="w-full text-sm">
          <tbody>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Width</td><td class="py-2 font-medium">230 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Depth</td><td class="py-2 font-medium">95 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Height</td><td class="py-2 font-medium">78 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Seat height</td><td class="py-2 font-medium">44 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Seat depth</td><td class="py-2 font-medium">58 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Arm height</td><td class="py-2 font-medium">62 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Leg height</td><td class="py-2 font-medium">12 cm</td></tr>
            <tr><td class="py-2 text-muted-foreground">Weight</td><td class="py-2 font-medium">62 kg</td></tr>
          </tbody>
        </table>
        <p class="text-xs text-muted-foreground mt-3">⚠️ Please ensure minimum doorway width of 75 cm. This sofa does not disassemble for delivery.</p>`,
      },
      {
        value: 'delivery', title: 'Delivery & Assembly', html: `
        <div class="space-y-3">
          <div>
            <p class="font-medium mb-1">White Glove Delivery — $149</p>
            <p class="text-sm">Includes in-room placement, packaging removal, and a basic inspection. Two-person delivery team.</p>
          </div>
          <div>
            <p class="font-medium mb-1">Standard Delivery — $79</p>
            <p class="text-sm">Kerb-side drop-off. You'll need help carrying it inside.</p>
          </div>
          <div>
            <p class="font-medium mb-1">Lead Time</p>
            <p class="text-sm">2–4 weeks (made to order). You'll receive a delivery date confirmation via email once your sofa enters production.</p>
          </div>
          <div>
            <p class="font-medium mb-1">Assembly</p>
            <p class="text-sm">Legs attach with included bolts — approximately 10 minutes. Allen key included; no additional tools required. We recommend two people for unboxing and flipping.</p>
          </div>
        </div>`,
      },
      {
        value: 'care', title: 'Care Instructions', html: `
        <ul class="space-y-1.5">
          <li>Vacuum upholstery weekly using a soft brush attachment</li>
          <li>Blot spills immediately with a clean, dry cloth — do not rub</li>
          <li>Professional upholstery cleaning recommended once a year</li>
          <li>Rotate and flip seat cushions monthly for even wear</li>
          <li>Keep away from direct sunlight to prevent fading</li>
          <li>Do not place near radiators or other direct heat sources</li>
          <li>Bouclé fabric may pill initially — this is normal and reduces significantly after the first few weeks</li>
          <li>Use a fabric shaver for any persistent pilling</li>
          <li>Clean oak legs with a slightly damp cloth only</li>
        </ul>`,
      },
      {
        value: 'warranty', title: 'Returns & Warranty', html: `
        <div class="space-y-3">
          <div>
            <p class="font-medium mb-1">Returns</p>
            <ul class="space-y-1"><li>14-day return policy (item must be unused and in original packaging)</li><li>Return pickup fee: $149 (white glove collection)</li><li>Refund processed within 5–7 business days of collection</li></ul>
          </div>
          <div>
            <p class="font-medium mb-1">Warranty</p>
            <ul class="space-y-1"><li>Frame: 10-year structural warranty</li><li>Cushions: 2-year warranty against loss of shape</li><li>Upholstery: 1-year warranty (manufacturing defects only)</li><li>Excludes damage from pets, improper assembly, or abnormal use</li></ul>
          </div>
        </div>`,
      },
      {
        value: 'room', title: 'Room Guide & Styling', html: `
        <div class="space-y-3">
          <div>
            <p class="font-medium mb-1">Recommended Room Size</p>
            <p>Minimum 18 m² living area. The sofa commands visual presence — it works best as a room centrepiece rather than pushed against a wall.</p>
          </div>
          <div>
            <p class="font-medium mb-1">Placement Tips</p>
            <ul class="space-y-1"><li>Leave 60–90 cm clearance from walls for breathing room</li><li>Pair with a rug of at least 120×180 cm to anchor the seating area</li><li>Position 40–50 cm from a coffee table for comfortable reach</li></ul>
          </div>
          <div>
            <p class="font-medium mb-1">Style Notes</p>
            <p>The curved silhouette creates a soft, organic feel. Pair with angular side tables and geometric accessories for contrast. The bouclé texture pairs beautifully with natural materials like wood, rattan, and stone.</p>
          </div>
        </div>`,
      },
      {
        value: 'sustainability', title: 'Sustainability & Certifications', html: `
        <div class="space-y-2">
          <div class="flex items-start gap-2"><span class="text-green-600 mt-0.5">●</span><p><strong>FSC Mix Credit</strong> — The internal pine wood structure is FSC Mix Credit certified, made with a mix of materials from FSC-certified forests and controlled wood.</p></div>
          <div class="flex items-start gap-2"><span class="text-green-600 mt-0.5">●</span><p><strong>OEKO-TEX Standard 100</strong> — The fabric supplier is certified, guaranteeing environmentally safe and responsible textile production.</p></div>
          <div class="flex items-start gap-2"><span class="text-green-600 mt-0.5">●</span><p><strong>European Production</strong> — Manufactured in Europe, reducing transport emissions and enabling stricter quality control and working conditions.</p></div>
        </div>`,
      },
    ],
    editorialSections: [
      {
        title: 'Designed for Living',
        html: `<p class="text-base leading-relaxed mb-4">This iconic collection is defined by its wide proportions and flowing curved silhouette, creating a piece that conveys stability and serenity in any environment. The invisible-effect legs give the sofa a sense of visual lightness, elevating its presence and enhancing the contemporary aesthetic of your living room.</p><p class="text-base leading-relaxed">Upholstered in a sophisticated two-tone effect bouclé, it stands out for its subtle, tactile structure and stain-resistant treatment. The deep feather-down cushions are the kind you sink into after a long day — supportive enough to sit up and read, soft enough to curl up and nap.</p>`,
      },
    ],
    reviews: [
      { id: 1, author: 'Rachel T.', rating: 5, date: '1 week ago', title: 'Stunning centrepiece', content: 'The bouclé fabric is incredibly soft and the curved shape makes such a statement in our living room. Worth every week of the wait. The feather-down cushions are heavenly.' },
      { id: 2, author: 'Mark S.', rating: 4, date: '3 weeks ago', title: 'Beautiful but measure carefully', content: 'Absolutely gorgeous sofa. Make sure you measure your room AND your doorways — it\'s bigger than it looks in photos. We had to remove a door to get it in. Once in place though, it\'s perfect.' },
      { id: 3, author: 'Jenny L.', rating: 5, date: '1 month ago', title: 'Best sofa we\'ve ever owned', content: 'We spent months shopping for the right sofa and this was worth the investment. The cushions are perfectly balanced between soft and supportive. We spend every evening on it now.' },
    ],
  },

  'sofa-2': {
    accordions: [
      {
        value: 'composition', title: 'Composition & Materials', html: `
        <table class="w-full text-sm">
          <tbody>
            <tr class="border-b"><td class="py-1.5 text-muted-foreground">Frame</td><td class="py-1.5">Engineered hardwood with steel corner reinforcement</td></tr>
            <tr class="border-b"><td class="py-1.5 text-muted-foreground">Upholstery</td><td class="py-1.5">Soft-touch chenille (100% polyester)</td></tr>
            <tr class="border-b"><td class="py-1.5 text-muted-foreground">Seat cushions</td><td class="py-1.5">Pocket-sprung base + foam + fibre top layer</td></tr>
            <tr><td class="py-1.5 text-muted-foreground">Connectors</td><td class="py-1.5">Heavy-duty steel clips (included)</td></tr>
          </tbody>
        </table>`,
      },
      {
        value: 'dimensions', title: 'Dimensions', html: `
        <table class="w-full text-sm">
          <tbody>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Width (long side)</td><td class="py-2 font-medium">295 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Width (short side)</td><td class="py-2 font-medium">210 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Depth</td><td class="py-2 font-medium">100 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Height</td><td class="py-2 font-medium">82 cm</td></tr>
            <tr class="border-b"><td class="py-2 text-muted-foreground">Seat height</td><td class="py-2 font-medium">46 cm</td></tr>
            <tr><td class="py-2 text-muted-foreground">Weight</td><td class="py-2 font-medium">89 kg (all sections)</td></tr>
          </tbody>
        </table>
        <p class="text-xs text-muted-foreground mt-3">Individual sections are 100 cm wide — fits through standard doorways.</p>`,
      },
      {
        value: 'config', title: 'Modular Configurations', html: `
        <div class="space-y-2">
          <p>The Harlow comes in 3 sections that can be rearranged to suit your space:</p>
          <ul class="space-y-1.5">
            <li><strong>L-shape (default):</strong> Corner unit + 2-seater + chaise</li>
            <li><strong>U-shape:</strong> Add a second 2-seater module ($1,299, sold separately)</li>
            <li><strong>Straight:</strong> Remove the corner unit for a wide 3-seater</li>
          </ul>
          <p class="text-xs text-muted-foreground mt-2">Sections connect with steel clips underneath — no tools required. Rearrange in under 5 minutes.</p>
        </div>`,
      },
      {
        value: 'delivery', title: 'Delivery & Assembly', html: `
        <div class="space-y-2">
          <p><strong>White Glove Delivery — $199</strong> — Modular sections delivered and assembled in-room. Packaging removed.</p>
          <p><strong>Lead Time:</strong> 3–5 weeks (made to order)</p>
          <p><strong>Assembly:</strong> Sections click together with steel clips. No tools needed. 2 people recommended.</p>
        </div>`,
      },
      {
        value: 'care', title: 'Care Instructions', html: `
        <ul class="space-y-1.5">
          <li>Chenille covers are removable and <strong>dry-clean only</strong></li>
          <li>Vacuum weekly with soft upholstery attachment</li>
          <li>Blot spills immediately with a clean, damp cloth</li>
          <li>Do not use harsh chemicals or bleach</li>
          <li>Rotate cushions fortnightly for even wear</li>
          <li>Keep out of direct sunlight</li>
        </ul>`,
      },
      {
        value: 'warranty', title: 'Returns & Warranty', html: `
        <ul class="space-y-1.5">
          <li>14-day return policy (unused, original packaging)</li>
          <li>Return pickup: $199</li>
          <li>Frame warranty: 10 years</li>
          <li>Cushions: 2 years</li>
          <li>Upholstery: 1 year (defects only)</li>
        </ul>`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVEWEAR — Gymshark-inspired (lean but authentic)
  // ═══════════════════════════════════════════════════════════════════════════

  'gs-1': {
    modelInfo: 'Model is 6\'0" / 183 cm and wears size M.',
    accordions: [
      {
        value: 'details', title: 'Materials & Composition', html: `
        <table class="w-full text-sm">
          <tbody>
            <tr class="border-b"><td class="py-1.5 text-muted-foreground">Fabric</td><td class="py-1.5">95% Cotton, 5% Elastane</td></tr>
            <tr class="border-b"><td class="py-1.5 text-muted-foreground">Weight</td><td class="py-1.5">180 gsm</td></tr>
            <tr><td class="py-1.5 text-muted-foreground">Technology</td><td class="py-1.5">Sweat-wicking DRY technology</td></tr>
          </tbody>
        </table>`,
      },
      {
        value: 'fit', title: 'Fit & Features', html: `
        <ul class="space-y-1.5">
          <li><strong>Oversized fit</strong> — consider sizing down if you prefer a more regular fit</li>
          <li>Dropped shoulders for a strong silhouette</li>
          <li>Longer body length for full coverage during lifts</li>
          <li>Ribbed crew neck collar</li>
          <li>Flatlock seams to reduce chafing during movement</li>
          <li>Iconic graphic print</li>
        </ul>`,
      },
      {
        value: 'size', title: 'Size Guide', html: `
        <p class="mb-3 text-sm">On average, reviewers say this product runs <strong>true to size</strong>.</p>
        <table class="w-full text-xs">
          <thead><tr class="border-b"><th class="py-1.5 text-left">Size</th><th class="py-1.5 text-left">Chest (cm)</th><th class="py-1.5 text-left">Waist (cm)</th><th class="py-1.5 text-left">Body Length (cm)</th></tr></thead>
          <tbody>
            <tr class="border-b"><td class="py-1.5">XS</td><td>86–91</td><td>71–76</td><td>70</td></tr>
            <tr class="border-b"><td class="py-1.5">S</td><td>91–97</td><td>76–81</td><td>72</td></tr>
            <tr class="border-b"><td class="py-1.5">M</td><td>97–102</td><td>81–86</td><td>74</td></tr>
            <tr class="border-b"><td class="py-1.5">L</td><td>102–107</td><td>86–91</td><td>76</td></tr>
            <tr class="border-b"><td class="py-1.5">XL</td><td>107–117</td><td>91–102</td><td>78</td></tr>
            <tr><td class="py-1.5">XXL</td><td>117–127</td><td>102–112</td><td>80</td></tr>
          </tbody>
        </table>`,
      },
      {
        value: 'care', title: 'Care Instructions', html: `
        <ul class="space-y-1.5">
          <li>Machine wash at 30°C or below, inside out</li>
          <li>Do not tumble dry</li>
          <li>Do not iron directly on print or logo</li>
          <li>Do not use fabric softener (reduces sweat-wicking performance)</li>
          <li>Wash with similar colours</li>
        </ul>`,
      },
      {
        value: 'delivery', title: 'Delivery & Returns', html: `
        <div class="space-y-2">
          <p><strong>Standard Delivery:</strong> 3–5 business days — $5.00</p>
          <p><strong>Express Delivery:</strong> 1–2 business days — $12.00</p>
          <p><strong>Free delivery</strong> on orders over $60</p>
          <p class="mt-2"><strong>Returns:</strong> 30-day returns. Items must be unworn with tags attached. Free return shipping.</p>
        </div>`,
      },
    ],
  },

  'gs-5': {
    modelInfo: 'Model is 5\'11" / 180 cm and wears size M.',
    accordions: [
      {
        value: 'details', title: 'Materials & Composition', html: `
        <table class="w-full text-sm">
          <tbody>
            <tr class="border-b"><td class="py-1.5 text-muted-foreground">Fabric</td><td class="py-1.5">100% Nylon</td></tr>
            <tr class="border-b"><td class="py-1.5 text-muted-foreground">Weight</td><td class="py-1.5">127 gsm (ultra-lightweight)</td></tr>
            <tr><td class="py-1.5 text-muted-foreground">Construction</td><td class="py-1.5">Seamless knit</td></tr>
          </tbody>
        </table>`,
      },
      {
        value: 'fit', title: 'Fit & Features', html: `
        <ul class="space-y-1.5">
          <li><strong>Slim fit</strong> — second-skin contouring through the body</li>
          <li>Seamless construction eliminates stitching for zero irritation</li>
          <li>Geometric knit texture creates targeted ventilation zones</li>
          <li>Sweat-wicking finish pulls moisture from the skin</li>
          <li>Raglan sleeve for unrestricted arm movement</li>
          <li>Muscle-defining fit through chest and arms</li>
        </ul>`,
      },
      {
        value: 'size', title: 'Size Guide', html: `
        <p class="mb-3 text-sm">Slim fit — consider sizing <strong>up</strong> if you prefer a more relaxed feel.</p>
        <table class="w-full text-xs">
          <thead><tr class="border-b"><th class="py-1.5 text-left">Size</th><th class="py-1.5 text-left">Chest (cm)</th><th class="py-1.5 text-left">Waist (cm)</th></tr></thead>
          <tbody>
            <tr class="border-b"><td class="py-1.5">S</td><td>91–97</td><td>76–81</td></tr>
            <tr class="border-b"><td class="py-1.5">M</td><td>97–102</td><td>81–86</td></tr>
            <tr class="border-b"><td class="py-1.5">L</td><td>102–107</td><td>86–91</td></tr>
            <tr><td class="py-1.5">XL</td><td>107–117</td><td>91–102</td></tr>
          </tbody>
        </table>`,
      },
      {
        value: 'care', title: 'Care Instructions', html: `
        <ul class="space-y-1.5"><li>Machine wash at 30°C, inside out</li><li>Do not tumble dry</li><li>Do not use fabric softener</li><li>Do not iron</li></ul>`,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTWEAR — Nike-inspired (medium weight, heritage-forward)
  // ═══════════════════════════════════════════════════════════════════════════

  'tr-1': {
    accordions: [
      {
        value: 'benefits', title: 'Benefits', html: `
        <ul class="space-y-1.5">
          <li>Padded, low-cut collar lets you take your game anywhere — in comfort</li>
          <li>Foam midsole offers lightweight, responsive cushioning</li>
          <li>Rubber outsole with classic hoops pivot circle adds durable traction and heritage style</li>
          <li>Perforated toe box for breathability during all-day wear</li>
        </ul>`,
      },
      {
        value: 'details', title: 'Product Details', html: `
        <ul class="space-y-1.5">
          <li>Premium full-grain leather upper that breaks in beautifully</li>
          <li>Synthetic overlays for structure and durability</li>
          <li>Colour Shown: White/Black</li>
          <li>Style: DD1391-100</li>
          <li>Country/Region of Origin: Vietnam</li>
        </ul>
        <div class="mt-3 p-3 rounded-lg" style="background-color: #f0fdf4;">
          <p class="text-xs"><strong>♻ Sustainability:</strong> This product is made with at least 20% recycled content by weight.</p>
        </div>`,
      },
      {
        value: 'sizing', title: 'Size & Fit', html: `
        <p class="mb-3 text-sm">Runs <strong>true to size</strong>. For a snugger fit, go down half a size. For wider feet, go up half a size.</p>
        <table class="w-full text-xs">
          <thead><tr class="border-b"><th class="py-1.5 text-left">UK</th><th class="py-1.5 text-left">US</th><th class="py-1.5 text-left">EU</th><th class="py-1.5 text-left">CM</th></tr></thead>
          <tbody>
            <tr class="border-b"><td class="py-1.5">6</td><td>7</td><td>40</td><td>25</td></tr>
            <tr class="border-b"><td class="py-1.5">7</td><td>8</td><td>41</td><td>26</td></tr>
            <tr class="border-b"><td class="py-1.5">8</td><td>9</td><td>42.5</td><td>27</td></tr>
            <tr class="border-b"><td class="py-1.5">9</td><td>10</td><td>44</td><td>28</td></tr>
            <tr class="border-b"><td class="py-1.5">10</td><td>11</td><td>45</td><td>29</td></tr>
            <tr><td class="py-1.5">11</td><td>12</td><td>46</td><td>30</td></tr>
          </tbody>
        </table>`,
      },
      {
        value: 'delivery', title: 'Delivery & Returns', html: `
        <div class="space-y-2">
          <p><strong>Free standard delivery</strong> on all orders</p>
          <p>Express delivery: $12.00 (1–2 business days)</p>
          <p class="mt-2"><strong>Free returns within 30 days.</strong> Items must be unworn. Start your return online or in any store.</p>
        </div>`,
      },
      {
        value: 'care', title: 'Care', html: `
        <ul class="space-y-1.5">
          <li>Wipe clean with a damp cloth and mild soap</li>
          <li>Use a soft brush for the midsole and outsole</li>
          <li>Air dry at room temperature — avoid direct heat or sunlight</li>
          <li>Store with shoe trees or stuffed with paper to maintain shape</li>
          <li>Do not machine wash or tumble dry</li>
        </ul>`,
      },
    ],
    editorialSections: [
      {
        title: 'From the Court to the Streets',
        html: `<p class="text-base leading-relaxed">Created for the hardwood but taken to the streets, the basketball icon returns with classic details and throwback hoops flair. Iconic colour-blocking meets premium materials and plush padding for game-changing comfort that lasts. The styling possibilities are endless — how will you wear your Dunks?</p>`,
      },
    ],
    reviews: [
      { id: 1, author: 'Alex M.', rating: 5, date: '1 week ago', title: 'Perfect everyday shoe', content: 'Comfortable right out of the box. The leather quality is surprisingly good for the price. I\'ve been wearing them daily for 3 weeks and they\'re breaking in beautifully.' },
      { id: 2, author: 'Sam K.', rating: 4, date: '2 weeks ago', title: 'Runs slightly narrow', content: 'Beautiful shoe, great quality. Runs a bit narrow though — went up half a size and they fit perfectly. The Panda colourway goes with everything.' },
      { id: 3, author: 'Chris P.', rating: 5, date: '1 month ago', title: 'Classic for a reason', content: 'My third pair of Dunks. The retro is the best version — the leather is premium and the padding is noticeably better than the older releases.' },
    ],
  },

  'tr-2': {
    accordions: [
      {
        value: 'benefits', title: 'Benefits', html: `
        <ul class="space-y-1.5">
          <li>Nike Air cushioning adds lightweight, all-day comfort</li>
          <li>Durable full-grain leather upper develops character over time</li>
          <li>Pivot-point rubber outsole pattern provides excellent traction</li>
          <li>Padded collar and tongue for plush, secure fit</li>
        </ul>`,
      },
      {
        value: 'details', title: 'Product Details', html: `
        <ul class="space-y-1.5">
          <li>Full-grain leather and synthetic upper</li>
          <li>Nike Air unit in the heel</li>
          <li>Colour Shown: White/White</li>
          <li>Style: CW2288-111</li>
          <li>Country/Region of Origin: Vietnam</li>
        </ul>`,
      },
      {
        value: 'sizing', title: 'Size & Fit', html: `
        <p class="text-sm">Runs <strong>true to size</strong>. The leather upper will naturally mold to your foot over time.</p>`,
      },
      {
        value: 'delivery', title: 'Delivery & Returns', html: `
        <p><strong>Free standard delivery</strong> on all orders. Free returns within 30 days.</p>`,
      },
    ],
    editorialSections: [
      {
        title: 'The One That Started It All',
        html: `<p class="text-base leading-relaxed">The radiance lives on in the Nike Air Force 1 '07, the basketball original that puts a fresh spin on what you know best: durably stitched overlays, clean finishes and the perfect amount of flash to make you shine. Since 1982, the AF1 has been a canvas for self-expression — from the courts of Baltimore to the streets of every city in the world.</p>`,
      },
    ],
  },
};

// ─── Department-level fallback (used when a product has no specific enrichment) ─

export const departmentFallbackAccordions: Record<string, AccordionSection[]> = {
  'activewear': [
    { value: 'details', title: 'Materials & Fit', html: `<ul class="space-y-1.5"><li>Sweat-wicking performance fabric</li><li>Flatlock seams to reduce chafing</li><li>Machine wash at 30°C, inside out</li><li>Do not tumble dry</li><li>Do not use fabric softener on performance fabrics</li></ul>` },
    { value: 'size', title: 'Size Guide', html: `<p class="text-sm">Check size chart for best fit. Most styles run true to size. Oversized fits are labelled — consider sizing down if you prefer a regular silhouette.</p>` },
    { value: 'delivery', title: 'Delivery & Returns', html: `<p>Standard: 3–5 days ($5). Express: 1–2 days ($12). Free delivery over $60. 30-day free returns with tags attached.</p>` },
  ],
  'footwear': [
    { value: 'details', title: 'Product Details', html: `<ul class="space-y-1.5"><li>Premium upper materials</li><li>Cushioned midsole for all-day comfort</li><li>Rubber outsole with traction pattern</li></ul>` },
    { value: 'sizing', title: 'Size & Fit', html: `<p>Runs true to size. If between sizes, go up half a size. Width: Standard (D).</p>` },
    { value: 'delivery', title: 'Delivery & Returns', html: `<p>Free standard delivery. Free returns within 30 days. Items must be unworn.</p>` },
    { value: 'care', title: 'Care', html: `<ul class="space-y-1.5"><li>Wipe clean with a damp cloth</li><li>Air dry away from direct heat</li><li>Store with shoe trees to maintain shape</li></ul>` },
  ],
  'home-kitchen': [
    { value: 'details', title: 'Product Details', html: `<ul class="space-y-1.5"><li>Premium materials and construction</li><li>Designed for everyday use</li></ul>` },
    { value: 'care', title: 'Care & Use', html: `<ul class="space-y-1.5"><li>Follow the care instructions included with your product</li><li>Hand washing recommended for longevity</li></ul>` },
    { value: 'delivery', title: 'Shipping & Returns', html: `<p>Standard: 3–5 days (€10). Free shipping over €100. 30-day return policy — unused, original packaging.</p>` },
  ],
  'furniture': [
    { value: 'details', title: 'Product Specifications', html: `<p>Contact us for detailed dimensions and material specifications for this product.</p>` },
    { value: 'delivery', title: 'Delivery & Assembly', html: `<ul class="space-y-1.5"><li>White Glove Delivery available</li><li>Lead time: 2–5 weeks (made to order)</li><li>Please measure your doorways before ordering</li></ul>` },
    { value: 'care', title: 'Care Instructions', html: `<ul class="space-y-1.5"><li>Vacuum weekly with soft brush attachment</li><li>Blot spills immediately — do not rub</li><li>Professional cleaning recommended annually</li></ul>` },
    { value: 'warranty', title: 'Returns & Warranty', html: `<ul class="space-y-1.5"><li>14-day return policy (unused, original packaging)</li><li>Frame warranty: 10 years</li><li>Upholstery warranty: 1 year</li></ul>` },
  ],
};
