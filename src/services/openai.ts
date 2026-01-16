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
export type RendererType = 'text_only' | 'single_card' | 'carousel';

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
}

export interface LLMProductSearch {
  query: string;
  subcategory?: string;
  priceRange?: { min?: number; max?: number };
}

// Captures what the AI understood about the user's need
export interface LLMUnderstoodIntent {
  explicit_need: string;
  implicit_constraints: string[];
  inferred_context: string;
  decision_stage: 'exploring' | 'comparing' | 'ready_to_buy';
}

// Structured response fields for intelligent responses
export interface LLMResponseFields {
  intent_acknowledgment: string;
  selection_explanation: string;
  product_highlights: string;
  follow_up_question: string;
}

// Contextual follow-up suggestions for quick-reply buttons
export interface SuggestedFollowUp {
  label: string;
  query: string;
}

export interface LLMReasoning {
  intent_explanation: string;
  selection_reasoning: string;
  product_reasoning?: string[]; // Per-product reasoning from reranker
}

export interface LLMResponse {
  intent: LLMIntent;
  decision: LLMDecision;
  product_search: LLMProductSearch | null;
  understood_intent: LLMUnderstoodIntent;
  response: LLMResponseFields;
  suggested_follow_ups: SuggestedFollowUp[];
  reasoning: LLMReasoning;
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
  suggestedFollowUps: SuggestedFollowUp[];
  responseText: string; // Composed from response fields
  latency: {
    total: number;
    llm: number;
    search: number;
  };
}

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are Fin, an AI assistant that seamlessly handles BOTH shopping assistance AND customer support. You intelligently switch between these roles based on user intent.

## Your Two Roles

### Role 1: Shopping Assistant
When users want to discover, browse, or buy products, you help them find what they need with intelligent recommendations.

### Role 2: Support Agent
When users need help with orders, returns, accounts, or policies, you provide helpful, knowledgeable support responses.

## Intent Classification

### shopping_discovery — Show Products
User wants to browse, discover, compare, or purchase products.
**REQUIRED**: User must mention a SPECIFIC PRODUCT TYPE (jacket, dress, shoes, tops, jeans, coat, etc.)
Signals: product type mentioned, purchase intent, feature queries, comparisons

### support — Provide Support (Text Only)
User needs help with orders, returns, accounts, shipping, or policies.
Signals: "return", "order", "refund", "tracking", "delivery", "account", "password", "exchange", "cancel", "shipping"
**Response**: Actually help them! Provide useful information as if you have access to their account.

### ambiguous — Clarify First
Query has no specific product type AND no support signals.
Examples: "summer", "something nice", "help", "looking for ideas"
**Response**: Ask what type of product they're interested in, or if they need support help.

## Decision Rules

### When to show products (shopping_discovery):
- User mentions a SPECIFIC product type: jacket, dress, shoes, top, jeans, coat, shirt, sweater, boots, etc.
- "casual jacket for work" → YES (has "jacket")
- "red dress for party" → YES (has "dress")
- "running shoes" → YES (has "shoes")

### When to clarify (ambiguous):
- NO product type mentioned, just descriptors or occasions
- "summer" → NO product type, ask: "Are you looking for summer dresses, tops, shorts, or something else?"
- "something nice for a date" → NO product type, ask: "What kind of piece are you thinking — a dress, a nice top, or something else?"
- "gift for my mom" → NO product type, ask: "What does she usually wear? I can help with dresses, tops, jackets, or accessories."

### When to provide support (support):
- User mentions order, return, refund, shipping, account, or policy-related words
- "return" → Provide return policy and process
- "where is my order" → Offer to help track their order
- "refund" → Explain refund policy and timeline

## Output Schema

Always respond with a JSON object in this exact format:

{
  "intent": {
    "primary": "shopping_discovery" | "support" | "ambiguous",
    "confidence": 0.0-1.0,
    "signals": ["detected signals"]
  },

  "decision": {
    "show_products": true | false,
    "renderer": "text_only" | "single_card" | "carousel",
    "item_count": 1-6,
    "needs_clarification": false
  },

  "product_search": {
    "query": "natural language search query",
    "subcategory": "jackets | dresses | tops | jeans | coats | etc.",
    "priceRange": {"min": number, "max": number} | null
  } | null,

  "understood_intent": {
    "explicit_need": "The literal request (e.g., 'casual jacket for work')",
    "implicit_constraints": ["office-appropriate", "versatile", "professional-casual"],
    "inferred_context": "professional setting with dress code flexibility",
    "decision_stage": "exploring | comparing | ready_to_buy"
  },

  "response": {
    "intent_acknowledgment": "Shows you understood the underlying need, not just keywords",
    "selection_explanation": "Why these specific products were chosen",
    "product_highlights": "Differentiation between products - when you'd pick each",
    "follow_up_question": "Contextual next step (NOT generic 'anything else?')"
  },

  "suggested_follow_ups": [
    {"label": "Short button text", "query": "What user would say if they clicked"}
  ],

  "reasoning": {
    "intent_explanation": "Why this classification",
    "selection_reasoning": "Why these products fit the understood intent"
  }
}

## Response Quality: The Four Components

Every product recommendation MUST include these elements:

### 1. Intent Acknowledgment
Show you understood the UNDERLYING need, not just keywords.
- BAD: "Here are some jackets!"
- GOOD: "For work, you'll want something professional in meetings but relaxed for everyday."

### 2. Selection Explanation
Explain WHY these specific products were chosen.
- BAD: "I found these options for you"
- GOOD: "I selected these for their clean lines and versatile colors that work in professional settings"

### 3. Product Differentiation
Help users understand WHEN they'd pick each option.
- BAD: "All great options!"
- GOOD: "The black one is understated and works anywhere. The orange adds personality — great for creative offices."

### 4. Contextual Follow-up
Offer a relevant next step that advances the shopping journey.
- BAD: "Is there anything else I can help you with?"
- GOOD: "Are you thinking traditional office or somewhere with a more relaxed dress code?"

## Response Template

Use this structure in your response fields:

response.intent_acknowledgment: "For [use case], you'll want [key consideration]."
response.selection_explanation: "I selected these for [specific reasoning about why these products fit]."
response.product_highlights: "[Product A] is [differentiation]. [Product B] is [differentiation]."
response.follow_up_question: "[Contextual question that helps narrow down OR offer to show related items]"

## Anti-Patterns to AVOID

These make you feel like a dumb search wrapper:
- Generic greetings: "I'd be happy to help!" (adds no value)
- Narrating actions: "Here are 4 jackets I found" (the cards speak for themselves)
- No reasoning: Showing products without explaining why
- Over-enthusiasm: "Great choice! These are amazing!" (feels fake)
- Generic follow-ups: "Anything else?" or "Let me know if you need help"
- Treating products as interchangeable: No differentiation

## Examples

### Query: "casual jacket for work"

understood_intent: {
  explicit_need: "casual jacket for work",
  implicit_constraints: ["office-appropriate", "versatile", "professional-casual", "clean lines"],
  inferred_context: "professional setting with some dress code flexibility",
  decision_stage: "exploring"
}

response: {
  intent_acknowledgment: "For work, you'll want something professional enough for meetings but not overdressed for everyday.",
  selection_explanation: "I selected these for their clean lines and versatile styling that transitions between formal and casual.",
  product_highlights: "The black Puma jacket is understated and works anywhere. The orange version adds personality — great if your office leans creative.",
  follow_up_question: "Are you thinking traditional office or somewhere with a more relaxed dress code?"
}

suggested_follow_ups: [
  {"label": "More formal options", "query": "Show me more formal work jackets"},
  {"label": "Budget under $100", "query": "Show me work jackets under $100"},
  {"label": "What pairs well", "query": "What would go well with these jackets?"}
]

### Query: "red dress for summer party"

understood_intent: {
  explicit_need: "red dress for summer party",
  implicit_constraints: ["fun but not too formal", "summer-appropriate", "party-ready", "statement piece"],
  inferred_context: "social event, wants to stand out",
  decision_stage: "exploring"
}

response: {
  intent_acknowledgment: "For a summer party, red is a great choice for standing out — you'll want something fun but not too formal.",
  selection_explanation: "I picked these because they balance the party vibe with summer comfort — breathable fabrics and playful styles.",
  product_highlights: "The midi length works for both garden parties and evening events. The mini makes a bolder statement if you want to turn heads.",
  follow_up_question: "Indoor or outdoor event? That might affect the fabric weight."
}

## Support Knowledge Base (Use for support intent)

When intent is SUPPORT, you have access to this information and should respond helpfully:

### Return Policy
- Returns accepted within 28 days of delivery
- Items must be unworn with tags attached
- Free returns via prepaid label (sent to email)
- Refunds processed within 5-7 business days after we receive the item

### Order Tracking
- Orders ship within 1-2 business days
- Standard delivery: 3-5 business days
- Express delivery: 1-2 business days
- Tracking link sent via email when shipped
- If user asks about a specific order, offer to look it up with their order number

### Exchanges
- We don't do direct exchanges — return for refund, then place new order
- This ensures you get the item you want faster

### Account Issues
- Password reset available via "Forgot Password" on login page
- Account issues can be escalated to support team
- Order history visible in account dashboard

### Refunds
- Original payment method refunded
- 5-7 business days after item received
- Sale items are final sale (no refunds)

### Example Support Responses

Query: "return"
Response: "I can help with your return! Our policy allows returns within 28 days of delivery — items need to be unworn with tags attached. Would you like me to start a return for a specific order? I just need your order number."

Query: "where is my order"
Response: "I'd be happy to help track your order! Once an order ships, you'll receive a tracking link via email (usually within 1-2 business days of ordering). If you have your order number, I can look up the status for you. Alternatively, you can check your order history in your account dashboard."

Query: "refund"
Response: "Refunds are processed within 5-7 business days after we receive your returned item. The money goes back to your original payment method. Is there a specific order you're wondering about? I can check on the status if you have the order number."

## Important Notes

1. The response fields are SEPARATE from product_search. Product search is for retrieval, response fields are for the message.
2. Never hallucinate product IDs — only provide search criteria.
3. suggested_follow_ups should have 2-3 contextual options, NOT generic ones.
4. If no products match, be honest: "I couldn't find exact matches for X because..."
5. Consider conversation context for multi-turn interactions.
6. For SUPPORT queries: Be genuinely helpful! Don't just acknowledge — provide the information they need.
7. For AMBIGUOUS queries: Don't guess at product type — ask what category they're interested in.`;

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
  model: 'gpt-4o', // Fast, capable, good for intent detection
  temperature: 0.3,
};

export function isConfigured(): boolean {
  return config.apiKey.length > 0;
}

// ============================================================================
// LLM Product Reranking (Retrieve & Rerank pattern)
// ============================================================================

const RERANK_PROMPT = `You are a product selection AI. Given a user's shopping query and their understood intent, select the products that BEST match what the user is looking for.

Consider:
- Semantic fit to the USE CASE (e.g., "work" → professional styling, "summer party" → fun/light fabrics)
- Exact matches (color, style, type mentioned in query)
- Price if mentioned
- Quality signals (ratings, reviews)
- DIVERSITY: include a range of options (understated to bold, different price points)

IMPORTANT: Only select products that genuinely match the query. If the user asks for "red dress" and no products have "red" in the name/description, return an empty selection rather than showing non-red items.

Return a JSON object with:
{
  "selected_ids": ["id1", "id2", ...],  // IDs of products to show (max 6, in order of relevance)
  "overall_reasoning": "Brief explanation of the selection strategy",
  "product_insights": [
    {
      "id": "product_id",
      "why_selected": "Why this product fits the user's need",
      "best_for": "When/who would choose this option",
      "differentiator": "What makes this one unique vs others"
    }
  ]
}

If NO products match well, return:
{
  "selected_ids": [],
  "overall_reasoning": "None of the candidates match the query well because...",
  "product_insights": []
}`;

interface ProductCandidate {
  id: string;
  name: string;
  description: string;
  price: number;
  brand: string;
  rating?: number;
}

interface ProductInsight {
  id: string;
  why_selected: string;
  best_for: string;
  differentiator: string;
}

interface RerankResult {
  selected_ids: string[];
  overall_reasoning: string;
  product_insights: ProductInsight[];
}

/**
 * Use LLM to rerank/select the best products from candidates
 * This is the key to semantic search - the LLM actually reads and understands product descriptions
 */
async function rerankProducts(
  userQuery: string,
  understoodIntent: LLMUnderstoodIntent | null,
  candidates: Product[],
  maxResults: number = 6
): Promise<RerankResult> {
  if (!isConfigured() || candidates.length === 0) {
    // Fallback: return first N candidates
    return {
      selected_ids: candidates.slice(0, maxResults).map(p => p.id),
      overall_reasoning: 'LLM not configured, returning top candidates by default order',
      product_insights: []
    };
  }

  // Prepare candidate info for the LLM (keep it concise to save tokens)
  const candidateInfo: ProductCandidate[] = candidates.slice(0, 30).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    brand: p.brand,
    rating: p.rating,
  }));

  // Include understood intent to help with semantic matching
  const intentContext = understoodIntent
    ? `\nUser's understood intent:
- Explicit need: ${understoodIntent.explicit_need}
- Implicit constraints: ${understoodIntent.implicit_constraints.join(', ')}
- Context: ${understoodIntent.inferred_context}`
    : '';

  const userPrompt = `User query: "${userQuery}"${intentContext}

Candidate products (select up to ${maxResults} that best match):
${JSON.stringify(candidateInfo, null, 2)}

Select the products that best match the user's query and intent. Return JSON with selected_ids, overall_reasoning, and product_insights for each selected product.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cheap for reranking
        messages: [
          { role: 'system', content: RERANK_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2, // Slightly higher for more diverse insights
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Rerank API error:', await response.text());
      return {
        selected_ids: candidates.slice(0, maxResults).map(p => p.id),
        overall_reasoning: 'Rerank API failed, using default order',
        product_insights: []
      };
    }

    const data = await response.json();
    const result: RerankResult = JSON.parse(data.choices[0].message.content);

    console.log('[Rerank] Selected:', result.selected_ids.length, 'products');
    console.log('[Rerank] Reasoning:', result.overall_reasoning);

    return result;
  } catch (error) {
    console.error('Rerank error:', error);
    return {
      selected_ids: candidates.slice(0, maxResults).map(p => p.id),
      overall_reasoning: 'Rerank failed, using default order',
      product_insights: []
    };
  }
}

/**
 * Compose the final response text from structured response fields
 */
function composeResponseText(response: LLMResponseFields, hasProducts: boolean): string {
  if (!hasProducts) {
    // For non-product responses, just use intent acknowledgment or a simple message
    return response.intent_acknowledgment || response.follow_up_question || '';
  }

  // Compose the full response from the four components
  const parts: string[] = [];

  // 1. Intent acknowledgment + selection explanation
  if (response.intent_acknowledgment) {
    parts.push(response.intent_acknowledgment);
  }
  if (response.selection_explanation) {
    parts.push(response.selection_explanation);
  }

  // 2. Product highlights (differentiation)
  if (response.product_highlights) {
    parts.push('');  // Add spacing
    parts.push(response.product_highlights);
  }

  // 3. Contextual follow-up
  if (response.follow_up_question) {
    parts.push('');  // Add spacing
    parts.push(response.follow_up_question);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
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
    // Using Retrieve & Rerank pattern:
    // 1. Coarse retrieval: Get many candidates by category
    // 2. LLM Reranking: Have LLM select the best matches for the full semantic query
    let products: Product[] = [];
    let responseText = composeResponseText(llmResponse.response, llmResponse.decision.show_products);

    if (llmResponse.decision.show_products && llmResponse.product_search) {
      // Step 1: Coarse retrieval - get MORE candidates than needed for reranking
      const searchResult = await searchProducts({
        query: llmResponse.product_search.query,
        subcategory: llmResponse.product_search.subcategory,
        maxResults: 30, // Get many candidates for reranking
        minPrice: llmResponse.product_search.priceRange?.min,
        maxPrice: llmResponse.product_search.priceRange?.max,
      });

      if (searchResult.products.length > 0) {
        // Step 2: LLM Reranking - have LLM select the best matches
        const rerankResult = await rerankProducts(
          userMessage, // Use original user query for semantic matching
          llmResponse.understood_intent, // Pass understood intent for better matching
          searchResult.products,
          llmResponse.decision.item_count
        );

        // Get the selected products in order
        const selectedProducts = rerankResult.selected_ids
          .map(id => searchResult.products.find(p => p.id === id))
          .filter((p): p is Product => p !== undefined);

        products = selectedProducts;

        // If LLM found no good matches, be honest
        if (products.length === 0) {
          responseText = `I found some ${llmResponse.product_search.subcategory || 'products'}, but none that closely match "${userMessage}". ${rerankResult.overall_reasoning}`;
          llmResponse.decision.show_products = false;
        } else {
          // Add rerank reasoning to the response
          llmResponse.reasoning.product_reasoning = rerankResult.product_insights.map(
            p => `${p.why_selected} (${p.differentiator})`
          );
        }
      } else {
        // No candidates found at all
        const query = llmResponse.product_search.query?.toLowerCase() || '';
        const shoeWords = ['shoe', 'shoes', 'sneaker', 'trainer', 'running', 'boot', 'heel', 'sandal'];
        const isShoeQuery = shoeWords.some(w => query.includes(w));

        if (isShoeQuery) {
          responseText = `I'm sorry, we don't currently have shoes or footwear in our catalog. Our collection focuses on clothing like jackets, dresses, tops, and trousers. Would you like me to help you find something else?`;
        } else {
          responseText = `I couldn't find any products matching "${llmResponse.product_search.query}". Try searching for items like jackets, dresses, tops, jeans, or coats.`;
        }
        llmResponse.decision.show_products = false;
      }
    }
    searchEndTime = performance.now();

    return {
      llmResponse,
      products,
      suggestedFollowUps: llmResponse.suggested_follow_ups || [],
      responseText,
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
  };

  let detectedCategory: string | undefined;
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lowerMessage.includes(keyword)) {
      detectedCategory = category;
      break;
    }
  }

  // Support detection
  const supportSignals = ['order', 'return', 'refund', 'broken', 'wrong', 'tracking', 'delivery', 'account', 'password'];
  const isSupport = supportSignals.some((s) => lowerMessage.includes(s));

  // Default LLM response structure
  let llmResponse: LLMResponse;
  let responseText: string;

  if (isSupport) {
    // Support intent
    llmResponse = {
      intent: {
        primary: 'support',
        confidence: 0.85,
        signals: supportSignals.filter((s) => lowerMessage.includes(s)),
      },
      decision: {
        show_products: false,
        renderer: 'text_only',
        item_count: 0,
        needs_clarification: false,
      },
      product_search: null,
      understood_intent: {
        explicit_need: userMessage,
        implicit_constraints: ['needs assistance', 'existing order or account'],
        inferred_context: 'customer support inquiry',
        decision_stage: 'exploring',
      },
      response: {
        intent_acknowledgment: "I understand you need help with your order.",
        selection_explanation: '',
        product_highlights: '',
        follow_up_question: "Could you please provide your order number so I can look into this for you?",
      },
      suggested_follow_ups: [
        { label: 'Track my order', query: 'Where is my order?' },
        { label: 'Return an item', query: 'How do I return something?' },
      ],
      reasoning: {
        intent_explanation: 'User mentioned support-related keywords',
        selection_reasoning: 'No products shown for support queries',
      },
    };
    responseText = "I understand you need help with your order. Could you please provide your order number so I can look into this for you?";
  } else if (detectedCategory) {
    // Shopping intent with detected category
    llmResponse = {
      intent: {
        primary: 'shopping_discovery',
        confidence: 0.9,
        signals: [`Category: ${detectedCategory}`, 'product type detected'],
      },
      decision: {
        show_products: true,
        renderer: 'carousel',
        item_count: 4,
        needs_clarification: false,
      },
      product_search: {
        query: userMessage,
        subcategory: detectedCategory,
      },
      understood_intent: {
        explicit_need: userMessage,
        implicit_constraints: ['looking for options', 'wants to see variety'],
        inferred_context: `browsing ${detectedCategory}`,
        decision_stage: 'exploring',
      },
      response: {
        intent_acknowledgment: `I see you're looking for ${detectedCategory}.`,
        selection_explanation: `I've selected a range of popular ${detectedCategory} with good reviews and variety in style.`,
        product_highlights: 'These offer different styles from casual to more polished looks.',
        follow_up_question: 'Any particular style or price range in mind?',
      },
      suggested_follow_ups: [
        { label: 'Under $50', query: `Show me ${detectedCategory} under $50` },
        { label: 'Most popular', query: `What are the most popular ${detectedCategory}?` },
      ],
      reasoning: {
        intent_explanation: `User mentioned ${detectedCategory}`,
        selection_reasoning: 'Showing variety of options in the category',
      },
    };
    responseText = `I see you're looking for ${detectedCategory}. I've selected a range of popular options with good reviews and variety in style. These offer different looks from casual to more polished. Any particular style or price range in mind?`;
  } else {
    // Ambiguous intent
    llmResponse = {
      intent: {
        primary: 'ambiguous',
        confidence: 0.5,
        signals: ['No clear product type mentioned'],
      },
      decision: {
        show_products: false,
        renderer: 'text_only',
        item_count: 0,
        needs_clarification: true,
      },
      product_search: null,
      understood_intent: {
        explicit_need: userMessage,
        implicit_constraints: [],
        inferred_context: 'unclear what user is looking for',
        decision_stage: 'exploring',
      },
      response: {
        intent_acknowledgment: "I'd love to help you find something!",
        selection_explanation: '',
        product_highlights: '',
        follow_up_question: 'Are you looking for a specific type of clothing, like jackets, dresses, or tops?',
      },
      suggested_follow_ups: [
        { label: 'Browse jackets', query: 'Show me jackets' },
        { label: 'Browse dresses', query: 'Show me dresses' },
        { label: 'Browse tops', query: 'Show me tops' },
      ],
      reasoning: {
        intent_explanation: 'Query too vague to determine product type',
        selection_reasoning: 'Asking for clarification to provide relevant results',
      },
    };
    responseText = "I'd love to help you find something! Are you looking for a specific type of clothing, like jackets, dresses, or tops?";
  }

  // Search for products if needed
  let products: Product[] = [];
  if (llmResponse.decision.show_products && llmResponse.product_search) {
    const searchResult = await searchProducts({
      query: llmResponse.product_search.query,
      subcategory: llmResponse.product_search.subcategory,
      maxResults: llmResponse.decision.item_count,
    });
    products = searchResult.products;

    // If no products found, update response
    if (products.length === 0) {
      responseText = `I couldn't find any products matching "${llmResponse.product_search.query}". Try searching for items like jackets, dresses, tops, jeans, or coats.`;
      llmResponse.decision.show_products = false;
    }
  }

  const searchEndTime = performance.now();

  return {
    llmResponse,
    products,
    suggestedFollowUps: llmResponse.suggested_follow_ups,
    responseText,
    latency: {
      total: searchEndTime - startTime,
      llm: llmEndTime - startTime,
      search: searchEndTime - llmEndTime,
    },
  };
}
