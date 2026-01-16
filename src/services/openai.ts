/**
 * OpenAI Integration Service
 * Handles intent classification, product recommendations, and response generation
 */

import { Product } from '../types/product';
import { searchProducts } from './productSearch';

// ============================================================================
// Types
// ============================================================================

export type IntentType = 'shopping_discovery' | 'support' | 'ambiguous';
export type RendererType = 'text_only' | 'single_card' | 'carousel' | 'list' | 'grid';

export interface LLMIntent {
  primary: IntentType;
  confidence: number; // 0-1
  signals: string[];
}

export interface LLMDecision {
  show_products: boolean;
  renderer: RendererType;
  item_count: number;
  needs_clarification: boolean;
  clarification_reason: string | null;
}

export interface LLMProductSearch {
  query: string;
  category?: string;
  subcategory?: string;
  priceRange?: { min?: number; max?: number };
  minRating?: number;
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface LLMReasoning {
  intent_explanation: string;
  renderer_explanation: string;
  confidence_factors: string[];
  product_reasoning?: string[]; // Why each product was selected
}

export interface LLMResponse {
  intent: LLMIntent;
  decision: LLMDecision;
  product_search: LLMProductSearch | null;
  reasoning: LLMReasoning;
  response_text: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationContext {
  page_type?: 'home' | 'product' | 'category' | 'cart' | 'checkout';
  cart_items?: number;
  user_status?: 'new' | 'returning' | 'vip';
  previous_purchases?: string[];
}

export interface FinResponse {
  llmResponse: LLMResponse;
  products: Product[];
  latency: {
    total: number;
    llm: number;
    search: number;
  };
}

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are Fin, an AI shopping assistant for an e-commerce store. Your job is to:
1. Understand user intent (shopping discovery vs support)
2. Decide whether to show product recommendations
3. Determine the best way to present products (if any)
4. Generate a helpful response

## Intent Classification

Classify the user's intent into one of three categories:

### shopping_discovery
User is actively looking to browse, discover, or purchase products.
Signals:
- Product category mentions ("looking for shoes", "need a lamp")
- Purchase intent ("want to buy", "shopping for")
- Feature/specification queries ("waterproof jacket", "under $50")
- Comparison requests ("best laptop for gaming")
- Gift shopping ("gift for my mom")

### support
User needs help with an existing order, account, or issue.
Signals:
- Order references ("my order", "tracking", "delivery")
- Account issues ("password", "login", "account")
- Complaints ("broken", "wrong item", "refund")
- Policy questions ("return policy", "warranty")
- Technical issues ("website not working", "payment failed")

### ambiguous
Intent is unclear and could go either way.
Signals:
- Vague queries ("help", "I need something")
- Mixed signals (shopping + support in same message)
- Context-dependent queries

## Decision Logic

### When to show products:
- Intent is shopping_discovery with confidence > 0.7
- User has provided enough context to make relevant recommendations
- Query is specific enough (not just "show me stuff")

### When NOT to show products:
- Intent is support
- User is complaining or frustrated
- Query is too vague (needs clarification first)
- User explicitly asked a yes/no or informational question

### Clarification:
Only ask for clarification if the query is too vague to provide useful recommendations.
- "I need shoes" → Too vague, ask about type/use case
- "Running shoes for women size 8" → Specific enough, show products

### Renderer Selection:
- carousel: Default for 3-5 products, good for browsing
- single_card: When one product clearly matches
- list: When comparing features is important
- grid: For broader category browsing (expanded view only)
- text_only: Support queries, clarification, or no products

### Item Count:
- Very specific query → 1-2 items
- Moderately specific → 3-4 items
- Broad category → 4-5 items

## Product Search

When recommending products, provide search criteria that can be used to filter the catalog:
- category: Main category (lighting, furniture, clothing, electronics, food, beauty, sports, kids, pets, kitchen, garden, books)
- subcategory: More specific type
- priceRange: {min, max} in USD
- minRating: Minimum star rating (1-5)
- tags: Product tags (sale, new, bestseller, eco-friendly, etc.)
- attributes: Category-specific attributes

## Response Format

Always respond with valid JSON matching this schema:
{
  "intent": {
    "primary": "shopping_discovery" | "support" | "ambiguous",
    "confidence": 0.0-1.0,
    "signals": ["signal1", "signal2"]
  },
  "decision": {
    "show_products": true | false,
    "renderer": "text_only" | "single_card" | "carousel" | "list" | "grid",
    "item_count": 0-5,
    "needs_clarification": true | false,
    "clarification_reason": "reason" | null
  },
  "product_search": {
    "query": "search terms",
    "category": "category name",
    "subcategory": "subcategory",
    "priceRange": {"min": 0, "max": 100},
    "minRating": 4.0,
    "tags": ["tag1"],
    "attributes": {"key": "value"}
  } | null,
  "reasoning": {
    "intent_explanation": "Why I classified the intent this way",
    "renderer_explanation": "Why I chose this display format",
    "confidence_factors": ["factor1", "factor2"],
    "product_reasoning": ["Why product 1 matches", "Why product 2 matches"]
  },
  "response_text": "The friendly message to show the user"
}

## Important Guidelines

1. Be concise but helpful - don't over-explain
2. If showing products, the response_text should introduce them naturally
3. For support queries, be empathetic and solution-oriented
4. Never hallucinate product IDs or details - only provide search criteria
5. Consider the full conversation context, not just the latest message
6. When AI reasoning mode is on, provide specific reasons why each product matches the user's needs`;

// ============================================================================
// API Client
// ============================================================================

interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

// Auto-configure from environment variable
const config: OpenAIConfig = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'gpt-4o-mini',
  temperature: 0.3,
};

export function isConfigured(): boolean {
  return config.apiKey.length > 0;
}

export async function queryFin(
  userMessage: string,
  conversationHistory: ConversationMessage[] = [],
  context: ConversationContext = {}
): Promise<FinResponse> {
  if (!isConfigured()) {
    throw new Error('OpenAI API key not set. Add VITE_OPENAI_API_KEY to your .env file.');
  }

  const startTime = performance.now();
  let llmEndTime: number;
  let searchEndTime: number;

  // Build messages array for OpenAI
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    // Add context as a system message if provided
    ...(Object.keys(context).length > 0
      ? [{ role: 'system' as const, content: `Current context: ${JSON.stringify(context)}` }]
      : []),
    // Add conversation history
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    // Add current user message
    { role: 'user' as const, content: userMessage },
  ];

  try {
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    llmEndTime = performance.now();

    // Parse LLM response
    const llmResponse: LLMResponse = JSON.parse(data.choices[0].message.content);

    // Search for products if needed (on-demand from HuggingFace)
    let products: Product[] = [];
    if (llmResponse.decision.show_products && llmResponse.product_search) {
      const searchResult = await searchProducts({
        query: llmResponse.product_search.query,
        subcategory: llmResponse.product_search.subcategory,
        maxResults: llmResponse.decision.item_count,
        minPrice: llmResponse.product_search.priceRange?.min,
        maxPrice: llmResponse.product_search.priceRange?.max,
      });

      products = searchResult.products;
    }
    searchEndTime = performance.now();

    return {
      llmResponse,
      products,
      latency: {
        total: searchEndTime - startTime,
        llm: llmEndTime - startTime,
        search: searchEndTime - llmEndTime,
      },
    };
  } catch (error) {
    llmEndTime = performance.now();
    searchEndTime = performance.now();

    // Return a fallback response on error
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// ============================================================================
// Mock Mode (for development without API key)
// ============================================================================

export async function queryFinMock(
  userMessage: string,
  _conversationHistory: ConversationMessage[] = [],
  _context: ConversationContext = {}
): Promise<FinResponse> {
  const startTime = performance.now();

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));
  const llmEndTime = performance.now();

  const lowerMessage = userMessage.toLowerCase();

  // Simple intent detection
  let intent: LLMIntent;
  let decision: LLMDecision;
  let productSearch: LLMProductSearch | null = null;
  let responseText: string;
  let reasoning: LLMReasoning;

  // Support detection
  const supportSignals = ['order', 'return', 'refund', 'help', 'broken', 'wrong', 'tracking', 'delivery', 'account', 'password'];
  const isSupport = supportSignals.some((s) => lowerMessage.includes(s));

  // Shopping detection
  const shoppingSignals = ['looking for', 'need', 'want', 'buy', 'show me', 'recommend', 'best', 'find'];
  const isShopping = shoppingSignals.some((s) => lowerMessage.includes(s));

  // Subcategory detection (ASOS clothing data)
  const categoryMap: Record<string, string> = {
    jacket: 'jackets',
    coat: 'coats',
    blazer: 'blazers',
    top: 'tops',
    shirt: 'shirts',
    blouse: 'blouses',
    tshirt: 't-shirts',
    't-shirt': 't-shirts',
    jumper: 'jumpers',
    sweater: 'jumpers',
    cardigan: 'cardigans',
    hoodie: 'hoodies',
    sweatshirt: 'sweatshirts',
    dress: 'dresses',
    skirt: 'skirts',
    jean: 'jeans',
    jeans: 'jeans',
    trouser: 'trousers',
    pant: 'trousers',
    short: 'shorts',
    trainer: 'trainers',
    sneaker: 'trainers',
    boot: 'boots',
    heel: 'heels',
    sandal: 'sandals',
    loafer: 'loafers',
    flat: 'flats',
    bag: 'bags',
    backpack: 'backpacks',
    scarf: 'scarves',
    hat: 'hats',
    cap: 'hats',
    belt: 'belts',
    sunglasses: 'sunglasses',
    necklace: 'jewellery',
    bracelet: 'jewellery',
    earring: 'jewellery',
  };

  let detectedCategory: string | undefined;
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lowerMessage.includes(keyword)) {
      detectedCategory = category;
      break;
    }
  }

  if (isSupport && !isShopping) {
    // Support intent
    intent = {
      primary: 'support',
      confidence: 0.85,
      signals: supportSignals.filter((s) => lowerMessage.includes(s)),
    };
    decision = {
      show_products: false,
      renderer: 'text_only',
      item_count: 0,
      needs_clarification: false,
      clarification_reason: null,
    };
    responseText = "I'd be happy to help with that! Could you please provide your order number so I can look into this for you?";
    reasoning = {
      intent_explanation: 'User mentioned support-related keywords indicating they need help with an existing issue.',
      renderer_explanation: 'No products shown for support queries - focusing on resolving their issue first.',
      confidence_factors: ['Contains support keywords', 'No shopping intent signals'],
    };
  } else if (isShopping || detectedCategory) {
    // Shopping intent
    const isSpecific = detectedCategory !== undefined;
    const itemCount = isSpecific ? 4 : 3;

    intent = {
      primary: 'shopping_discovery',
      confidence: isSpecific ? 0.9 : 0.75,
      signals: [...shoppingSignals.filter((s) => lowerMessage.includes(s)), detectedCategory ? `Category: ${detectedCategory}` : 'General shopping'].filter(Boolean),
    };
    decision = {
      show_products: true,
      renderer: 'carousel',
      item_count: itemCount,
      needs_clarification: !isSpecific,
      clarification_reason: !isSpecific ? 'Query could be more specific for better recommendations' : null,
    };
    productSearch = {
      query: userMessage,
      category: detectedCategory,
    };
    responseText = detectedCategory
      ? `Great choice! Here are some ${detectedCategory} options I think you'll love:`
      : "Here are some popular items you might be interested in:";
    reasoning = {
      intent_explanation: `User is looking to discover/purchase products${detectedCategory ? ` in the ${detectedCategory} category` : ''}.`,
      renderer_explanation: 'Carousel layout chosen to allow easy browsing of multiple options.',
      confidence_factors: isSpecific
        ? ['Clear product category mentioned', 'Shopping intent language detected']
        : ['Shopping intent language detected', 'No specific category - showing popular items'],
      product_reasoning: [
        'Matches the category and has high ratings',
        'Popular choice with great reviews',
        'Good value for the features offered',
        'Trending item in this category',
      ],
    };
  } else {
    // Ambiguous intent
    intent = {
      primary: 'ambiguous',
      confidence: 0.5,
      signals: ['No clear shopping or support signals'],
    };
    decision = {
      show_products: false,
      renderer: 'text_only',
      item_count: 0,
      needs_clarification: true,
      clarification_reason: 'Need more context to provide relevant help',
    };
    responseText = "I'm here to help! Are you looking to discover new products, or do you need assistance with an existing order?";
    reasoning = {
      intent_explanation: 'Query is too vague to determine if user wants to shop or needs support.',
      renderer_explanation: 'Asking for clarification before showing products to ensure relevance.',
      confidence_factors: ['No clear intent signals', 'Short or vague query'],
    };
  }

  // Search for products if needed (on-demand from HuggingFace)
  let products: Product[] = [];
  if (decision.show_products && productSearch) {
    const searchResult = await searchProducts({
      query: productSearch.query,
      subcategory: productSearch.category, // Maps to subcategory in ASOS data
      maxResults: decision.item_count,
    });
    products = searchResult.products;
  }

  const searchEndTime = performance.now();

  return {
    llmResponse: {
      intent,
      decision,
      product_search: productSearch,
      reasoning,
      response_text: responseText,
    },
    products,
    latency: {
      total: searchEndTime - startTime,
      llm: llmEndTime - startTime,
      search: searchEndTime - llmEndTime,
    },
  };
}
