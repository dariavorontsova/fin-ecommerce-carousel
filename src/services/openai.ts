/**
 * OpenAI Integration Service
 * Handles intent classification, product recommendations, and response generation
 */

import { Product } from '../types/product';
import { searchProducts } from './productSearch';

// ============================================================================
// Types
// ============================================================================

export type IntentType = 'shopping_discovery' | 'support' | 'ambiguous' | 'refinement';
export type RendererType = 'text_only' | 'single_card' | 'carousel';
export type ConversationMode = 'neutral' | 'support' | 'shopping';

// Session state - tracks the conversation mode and context
// This is passed to the LLM and updated based on LLM decisions
export interface SessionState {
  // Current conversation mode - LLM determines and updates this
  conversationMode: ConversationMode;
  
  // If in support mode, what issue?
  supportContext?: {
    issueType: string; // 'return', 'order_tracking', 'complaint', 'account', etc.
    resolved: boolean;
  };
  
  // Shopping context for refinements
  shoppingContext?: {
    subcategory: string;
    query: string;
    constraints: string[];
  };
  
  // Products shown (for "show more" and avoiding repeats)
  productsShownThisSession: string[];
}

// LLM tells us how to update session state
export interface SessionStateUpdate {
  conversationMode: ConversationMode;
  supportContext?: {
    issueType: string;
    resolved: boolean;
  } | null;
  shoppingContext?: {
    subcategory: string;
    query: string;
    constraints: string[];
  } | null;
}

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
  reasoning: string; // Main response text with paragraphs (separated by \n\n)
  follow_up_question: string;
  // Legacy fields for backward compatibility
  intent_acknowledgment?: string;
  selection_explanation?: string;
  product_highlights?: string;
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
  // Session state update - LLM tells us how to update conversation state
  session_state_update: SessionStateUpdate;
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
  viewingProduct?: Product; // For PDP context - the product user is viewing
  // Session state - the LLM uses this to understand conversation context
  // and outputs an update to tell us how to change it
  sessionState?: SessionState;
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
  // Session state update from LLM - caller should use this to update their state
  sessionStateUpdate: SessionStateUpdate;
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

## Session State: Understanding Conversation Context

You receive session state that tells you where this conversation currently stands:

**conversation_mode**: 'neutral' | 'support' | 'shopping'
- neutral: Fresh conversation, no established context
- support: User has an active support issue (return, complaint, order problem, etc.)
- shopping: User has been browsing/shopping

**support_context** (if mode is 'support'):
- issue_type: What kind of support issue (return, order_tracking, complaint, account, etc.)
- resolved: Whether the issue has been resolved

**shopping_context** (if mode is 'shopping'):
- subcategory: What they were looking at (jackets, dresses, etc.)
- query: Their last search
- constraints: Any constraints mentioned (color, price, etc.)

**products_shown_this_session**: IDs of products already shown (to avoid repeats)

### How to Use Session State

1. **If conversation_mode is 'support' and support is NOT resolved**:
   - User may still need help with their issue
   - If they ask about shopping, acknowledge but check if their support issue is resolved first
   - Example: If they asked about a return and then say "show me jackets", respond: "Happy to show you jackets! Just to confirm — did you want to continue with the return process, or shall we move on to shopping?"

2. **If conversation_mode is 'shopping'**:
   - Use shopping_context for refinement queries like "cheaper", "different color", "show more"
   - These refer to the previous search context

3. **If conversation_mode is 'neutral'**:
   - Fresh start, classify intent normally

### Session State Update: YOU Decide When Mode Changes

You must output a session_state_update that tells us how the conversation state should change.

**When to set mode to 'support'**:
- User raises a post-purchase issue (return, complaint, order problem)
- Set support_context with the issue type
- resolved: false initially

**When to set support_context.resolved to true**:
- User confirms they're done with the support issue
- User explicitly moves on to something else ("actually, show me jackets" without returning to support)
- User says "thanks, that's all I needed" or similar

**When to set mode to 'shopping'**:
- User starts browsing for products
- Set shopping_context with what they're looking for

**When to set mode to 'neutral'**:
- User explicitly starts fresh or conversation has no active context

## Intent Classification

### Core Principle: Understand WHY, Not Just WHAT

You are an intelligent assistant, not a keyword matcher. Your job is to understand the USER'S UNDERLYING NEED.

**The key question**: "What is this person trying to accomplish?"

- If they need HELP with a purchase/order/account → support
- If they want to FIND/BUY products → shopping
- If genuinely unclear → clarify

### shopping_discovery — Show Products

Show products when you understand what the user needs — either explicitly or implicitly.

**Explicit**: User names a product type ("jacket", "dress", "jeans")
**Implicit**: User describes a NEED, OCCASION, or CONTEXT that implies what products would help

**Think like a knowledgeable sales assistant**:
- Customer says "I have a job interview" → You'd show professional attire (blazers, dress shirts)
- Customer says "kids party this weekend" → You'd show comfortable, casual pieces
- Customer says "beach vacation coming up" → You'd show light dresses, summer tops
- Customer says "need something for a date" → You'd show stylish, flattering pieces
- Customer says "it's freezing outside" → You'd show warm layers

The customer doesn't need to say "blazer" for you to know a job interview needs professional clothing. That's inference — that's intelligence.

**How to set subcategory**:
- **Specific need** → Pick ONE subcategory (e.g., "job interview" → blazers, "beach" → dresses)
- **Broad/exploratory** → Set subcategory to NULL and let the search find variety

**Examples of when to use NULL subcategory**:
- "winter clothes" → null (they want variety: coats, jackets, jumpers, hoodies)
- "something for a party" → null (could be dress, top, etc. - show options)
- "casual outfits" → null (multiple categories could work)
- "new wardrobe staples" → null (broad exploration)

**Examples of when to pick a subcategory**:
- "I need a jacket" → jackets
- "show me dresses" → dresses  
- "job interview outfit" → blazers (professional = specific type)
- "running gear" → specific athletic subcategory

**Rule**: If the user is EXPLORING broadly, use null. If they have a SPECIFIC item type in mind (explicit or inferable), use a subcategory.

### support — Provide Support (Text Only)

User needs help with something they've ALREADY purchased or an account issue — not shopping for new items.

**The key distinction**: POST-purchase issues vs PRE-purchase browsing.

**Clear support signals** (post-purchase problems):
- Order issues: "where's my order", "wrong item", "damaged", "never arrived"
- Undo purchase: "return this", "refund", "exchange this item"
- Account trouble: "can't log in", "password", "account locked"

**Clear shopping signals** (pre-purchase browsing):
- "I need a jacket" → shopping (wants to buy)
- "Show me dresses" → shopping
- "What do you have for..." → shopping

**Borderline cases** — use context and common sense:

| Query | Likely Intent | Why |
|-------|---------------|-----|
| "What's your return policy?" | Support (lean) | Pre-purchase research, but they want info not products |
| "Is this in stock?" | Depends | If viewing product → shopping. If asking about order → support |
| "Do you have this in blue?" | Shopping | Asking about availability = shopping |
| "Cancel" | Clarify | Could mean cancel order (support) or cancel search (neither) |
| "I bought the wrong size" | Support | Post-purchase problem |
| "What size should I get?" | Shopping | Pre-purchase question, might show products |

**Hybrid intents** — when user wants BOTH support AND shopping:

- "I need to return this jacket and find a replacement" → Handle support FIRST (acknowledge return), then pivot to shopping
- "This didn't fit, what else do you have?" → Acknowledge the issue, then show products
- "My order was wrong, recommend something better" → Empathize, then show products

For hybrid: Set intent to "support" but include a helpful product suggestion in your response if appropriate.

### ambiguous — Clarify ONLY When Truly Unclear

Clarify ONLY when you genuinely cannot infer what would help:
- No context at all: "help", "hi", "something"
- Conflicting signals: unclear if shopping vs support
- So vague that ANY recommendation would be a random guess

**DO NOT clarify when**:
- User has an occasion/event (party, interview, vacation, date, etc.)
- User has a context (weather, activity, setting)
- User uses vague terms like "outfit" or "something nice" BUT with context

**Test**: Would a smart sales assistant ask for clarification, or would they start showing options? If they'd show options, so should you.

### refinement — Modify Previous Search

User wants to adjust previous results: "cheaper", "different color", "show more", "something similar"
Keep the same product context and apply the modification.

### Support Response Guidelines
When intent is support, provide genuinely helpful information (see Support Knowledge Base below).

## Page Context

The user may be viewing a specific page type. This is provided in the context.

**If page_type is "product" and a viewing_product is provided**:
- User is on a Product Details Page viewing a specific item
- Queries like "matching", "similar", "goes with this", "pair with", "something like this but..." refer to the viewed product
- Include the viewed product when deciding what to search for
- Example: Viewing "Blue Cotton Shirt" + query "matching pants" → search for pants that match a blue shirt

**If page_type is "home" or "category" (or no viewing_product)**:
- No specific product context
- "Matching socks" without context → need to clarify "matching what?"
- "Something similar" without context → need to clarify "similar to what?"

## Output Schema

Always respond with a JSON object in this exact format:

{
  "intent": {
    "primary": "shopping_discovery" | "support" | "ambiguous" | "refinement",
    "confidence": 0.0-1.0,
    "signals": ["detected signals"]
  },

  "decision": {
    "show_products": true | false,
    "renderer": "text_only" | "single_card" | "carousel",
    "item_count": 8-10,  // DEFAULT 8-10 for variety. Use 1-2 for: "the best", "top pick", specific product by name, or brand+product combo
    "needs_clarification": false
  },

  "product_search": {
    "query": "natural language description of what to search for",
    "subcategory": "jackets | jumpers | dresses | tops | jeans | coats | etc." | null,  // null for broad/exploratory queries
    "priceRange": {"min": number, "max": number} | null
  } | null,

  "understood_intent": {
    "explicit_need": "The literal request (e.g., 'casual jacket for work')",
    "implicit_constraints": ["office-appropriate", "versatile", "professional-casual"],
    "inferred_context": "professional setting with dress code flexibility",
    "decision_stage": "exploring | comparing | ready_to_buy"
  },

  "response": {
    "intent_acknowledgment": "Brief acknowledgment for non-product responses (support/ambiguous only)",
    "selection_explanation": "",
    "product_highlights": "",
    "follow_up_question": "For clarification questions only"
  },

  "suggested_follow_ups": [
    {"label": "Quick reply option", "query": "What user would say"}
  ],

  "reasoning": {
    "intent_explanation": "Why this classification",
    "selection_reasoning": "Brief note on what products would fit"
  },

  "session_state_update": {
    "conversation_mode": "neutral" | "support" | "shopping",
    "support_context": {
      "issue_type": "return | order_tracking | complaint | account | refund | exchange",
      "resolved": true | false
    } | null,
    "shopping_context": {
      "subcategory": "jackets | dresses | etc.",
      "query": "what they searched for",
      "constraints": ["any constraints like color, price range"]
    } | null
  }
}

IMPORTANT: session_state_update is REQUIRED. You decide how the conversation state should change based on this message.

NOTE: For shopping_discovery, the actual response text is generated in Stage 2 AFTER products are selected. 
Stage 1 response fields are only used for support and ambiguous intents.

## For Support/Ambiguous Responses

When NOT showing products, write helpful responses:
- Support: Actually answer their question (see Support Knowledge Base)
- Ambiguous: Ask a clarifying question that helps identify what they need

Avoid:
- Generic greetings: "I'd be happy to help!" (adds no value)
- Over-enthusiasm: "Great choice!" (feels fake)

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

### Hybrid Intent Examples (Support + Shopping)

Query: "I need to return this jacket and find a replacement"
Response: "I can help with both! For the return, you have 28 days from delivery — just need it unworn with tags. Would you like me to start that process? In the meantime, what kind of jacket are you looking for as a replacement — similar style, or something different?"

Query: "This dress didn't fit, what else do you have?"
Response: "Sorry to hear that! You can return it within 28 days if it's unworn with tags. For a replacement, would you like me to show you similar dresses in a different size, or are you open to trying a different style?"

Query: "My order was wrong, recommend something better"
Response: "I'm sorry about the mix-up — that's frustrating. Let me help fix that. First, can you share your order number so I can look into what happened? And while we sort that out, I'd love to help you find something you'll love — what are you looking for?"

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

interface AnthropicConfig {
  apiKey: string;
  model: string;
}

// Auto-configure from environment variables
// Stage 1 (Classification): Use gpt-4o - fast and capable for intent classification
// Stage 2b (Reasoning): Use gpt-5.1 - best quality for user-facing reasoning
const config: OpenAIConfig = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'gpt-4o', // Stage 1: Fast model for classification + intent extraction
  temperature: 0.3,
};

const stage2Config: OpenAIConfig = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'gpt-4o', // Stage 2b: Testing faster model for reasoning (was gpt-5.1)
  temperature: 0.4,
};

const anthropicConfig: AnthropicConfig = {
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  model: 'claude-opus-4-5-20251101', // Best Claude model - state of the art reasoning & writing
};

export function isConfigured(): boolean {
  // Either OpenAI or Anthropic key works
  const configured = config.apiKey.length > 0 || anthropicConfig.apiKey.length > 0;
  console.log('[Config] OpenAI key:', config.apiKey ? 'SET' : 'NOT SET');
  console.log('[Config] Anthropic key:', anthropicConfig.apiKey ? 'SET' : 'NOT SET');
  return configured;
}

// ============================================================================
// LLM Product Reranking (Retrieve & Rerank pattern)
// ============================================================================

// Combined rerank + response generation prompt
// This generates the response AFTER seeing the actual products
const RERANK_AND_RESPOND_PROMPT = `You are a product selection AI for a fashion shopping assistant.

## Your Task

Select the best products (max 10) and write a thoughtful response that demonstrates understanding.

## Selection Rules

- Match products to the USE CASE, not just category
- Provide VARIETY: different price points, styles
- If specific attributes mentioned (color, price), prioritize exact matches
- Only select products that genuinely match

## Item Count

- **Default: 8-10 items** for browsing/discovery queries (show depth and variety)
- 6 items minimum for general shopping queries

**Show only 1-2 items when:**
- User asks for "the best", "top pick", "your recommendation" (singular)
- User asks for a SPECIFIC product by name ("do you have the X?", "show me the ASOS leather jacket")
- User names a specific brand + product type combo ("North Face ski jacket")

When showing 1-2 items, your response should be confident: "Yes, here it is" or "This is my top pick because..."

## Response Writing — BE CONCISE

**NEVER repeat what the user just said.** They know what they asked.

**Keep it SHORT.** 2-3 sentences total. The cards do the heavy lifting.

**Structure:**
1. One sentence on the key needs (warmth, waterproof, etc.) — NOT a lecture
2. One sentence calling out 1-2 standouts BY NAME with a quick "why"
3. End with a short follow-up question

**Good example:**
"For skiing you'll want waterproof and insulated — the Volcom has a snow skirt to keep powder out, and the Columbia is warmest of the bunch. What temps are you expecting?"

**Bad example (too long):**
"For a first-time ski trip, it's crucial to focus on warmth, waterproofing, and comfort. You'll need a jacket that can handle snow and cold temperatures, while also being easy to move in. As a beginner, having practical features like snow skirts and functional pockets will enhance your experience. The selected items offer a range of options..."

**For specific queries** (like "show me black jackets"):
- Even shorter — 1-2 sentences max
- They know what they want, just highlight differences

**For single-item requests** ("do you have X?" or "what's your best Y?"):
- Be confident and direct: "Yes, here it is" or "This is my top pick"
- One sentence on why it's a good choice
- **CRITICAL: Drive toward PURCHASE, not more discovery**
- Example: "Yes! The ASOS leather biker is a classic — great reviews and versatile. Want me to check your size?"

**DO NOT** suggest "see similar styles" or "matching items" for single-item results — that derails the purchase decision.

## Follow-up Questions — Match the Intent

**For broad/discovery queries:** Help narrow down:
- "What temperatures are you expecting?" 
- "Want me to focus on jackets, pants, or base layers?"
- "Any budget in mind?"

**For single-item / perfect match (1-2 items):** Drive toward PURCHASE:
- "Want me to add it to your cart?"
- "Should I check if your size is in stock?"
- "Ready to grab it?"

**NEVER** suggest more discovery ("see similar", "matching items") when showing a single perfect match — that derails purchase.

**NEVER** ask random category questions that don't flow from the conversation.

## card_reason — Help Them DECIDE (Varied Framing)

Practical info that helps compare options. BUT vary your framing — no templates.

**BANNED STARTS (never use):**
- "Pick this if..."
- "Choose this if..."
- "Go for this if..."
- "Add this if..."
- "This is perfect for..."
- "This jacket/coat/jumper..."

**Good examples (notice: all different framings):**

- "Warmest option here; quilt lining for serious cold"
- "Budget pick at £35, solid quality for the price"
- "The dressy one, works for office or dinner out"
- "Oversized fit leaves room for chunky sweaters underneath"
- "Lightweight but warm, won't weigh you down on commute"
- "Neutral color pairs with everything you own"
- "Most coverage, longline hits below the knee"
- "Statement piece, the hot pink stands out on grey days"

**Don't use em-dashes (—)** they take up too much space on cards.

**The pattern:** Lead with WHAT makes it different, not "pick this if you want X"

Each card = different practical angle + different framing.

## Output Format

Return JSON:
{
  "selected_ids": ["id1", "id2", ...],
  "response": {
    "reasoning": "2-3 SHORT sentences total. Key needs + 1-2 standouts by name. No fluff, no lectures. Example: 'For skiing you want waterproof and warm — the Volcom has a snow skirt, the Columbia is the warmest here.'",
    "follow_up_question": "Short helpful question (under 10 words)"
  },
  "product_insights": [
    {
      "id": "product_id",
      "why_selected": "Brief reason",
      "best_for": "Who/when",
      "differentiator": "What's unique vs others shown",
      "card_reason": "Help them DECIDE: warmth level, value, best use case, what makes it different. Practical, not cheeky. Each card = different angle."
    }
  ],
  "suggested_follow_ups": [
    {"label": "Short label", "query": "What user would say"}
  ]
}

If no good matches, set selected_ids to [] and explain briefly.`;

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
  card_reason?: string; // Brief reason shown ON the card (10-15 words)
}

// Result from combined rerank + response generation
interface RerankAndRespondResult {
  selected_ids: string[];
  response: {
    reasoning: string; // Main response with paragraphs
    follow_up_question: string;
  };
  product_insights: ProductInsight[];
  suggested_follow_ups: SuggestedFollowUp[];
}

/**
 * Combined rerank + response generation
 * 
 * This is the key architectural fix: generate response AFTER seeing actual products.
 * The LLM sees the product candidates and:
 * 1. Selects the best matches
 * 2. Writes a response that references actual product names
 * 3. Generates per-product insights for card_reason display
 * 4. Creates contextual follow-up suggestions
 */
async function rerankAndRespond(
  userQuery: string,
  understoodIntent: LLMUnderstoodIntent | null,
  candidates: Product[],
  maxResults: number = 10,
  viewingProduct?: Product // The product user is viewing (for PDP context)
): Promise<RerankAndRespondResult> {
  // Fallback for no candidates or no API key
  if (!isConfigured() || candidates.length === 0) {
    return {
      selected_ids: candidates.slice(0, maxResults).map(p => p.id),
      response: {
        reasoning: '',
        follow_up_question: '',
      },
      product_insights: [],
      suggested_follow_ups: []
    };
  }

  // Prepare candidate info for the LLM (include enough detail for good responses)
  const candidateInfo: ProductCandidate[] = candidates.slice(0, 30).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    brand: p.brand,
    rating: p.rating,
  }));

  // Build context about what the user wants
  let intentContext = understoodIntent
    ? `
User's understood intent:
- Explicit need: ${understoodIntent.explicit_need}
- Implicit constraints: ${understoodIntent.implicit_constraints.join(', ')}
- Context: ${understoodIntent.inferred_context}
- Decision stage: ${understoodIntent.decision_stage}`
    : '';

  // Add viewing product context - THIS IS CRITICAL for generating good card_reasons
  if (viewingProduct) {
    intentContext += `

IMPORTANT - User is viewing this product (use this for card_reason context):
- Product: "${viewingProduct.name}"
- Type: ${viewingProduct.subcategory}
- Brand: ${viewingProduct.brand}
- Description: ${viewingProduct.description || 'N/A'}

The user wants items that match/complement THIS product. Each card_reason should reference how the recommended item works WITH the ${viewingProduct.subcategory} they're viewing.`;
  }

  const userPrompt = `User query: "${userQuery}"${intentContext}

Product candidates to choose from:
${JSON.stringify(candidateInfo, null, 2)}

IMPORTANT: Select ${Math.min(maxResults, 8)}-${maxResults} products (aim for depth and variety). Use the EXACT id values from the candidates above.
Return JSON with selected_ids (array of product IDs), response, product_insights, and suggested_follow_ups.`;

  try {
    const rerankApiStart = performance.now();
    console.log('[RerankAndRespond] Processing', candidateInfo.length, 'candidates for:', userQuery);
    
    let rawContent: string;
    
    // Use gpt-5.1 for Stage 2b (best quality for user-facing reasoning)
    console.log('[RerankAndRespond] Using OpenAI:', stage2Config.model);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stage2Config.apiKey}`,
      },
      body: JSON.stringify({
        model: stage2Config.model, // gpt-5.1 for quality reasoning
        messages: [
          { role: 'system', content: RERANK_AND_RESPOND_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: stage2Config.temperature, // Slightly higher for creative card_reasons
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RerankAndRespond] OpenAI API error:', errorText);
      throw new Error('OpenAI API error: ' + errorText);
    }

    const data = await response.json();
    const rerankApiEnd = performance.now();
    console.log(`[RerankAndRespond] API call took ${(rerankApiEnd - rerankApiStart).toFixed(0)}ms`);
    
    rawContent = data.choices[0].message.content;
    
    console.log('[RerankAndRespond] Raw LLM response:', rawContent.substring(0, 500));
    
    // Extract JSON from response (Claude sometimes wraps in markdown code blocks)
    let jsonContent = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }
    
    const result: RerankAndRespondResult = JSON.parse(jsonContent);

    console.log('[RerankAndRespond] Selected IDs:', JSON.stringify(result.selected_ids));
    console.log('[RerankAndRespond] Candidate IDs (first 10):', JSON.stringify(candidateInfo.map(c => c.id).slice(0, 10)));
    console.log('[RerankAndRespond] Requested max:', maxResults, '| Selected count:', result.selected_ids.length);

    // Validate that selected IDs exist in candidates
    const candidateIdSet = new Set(candidateInfo.map(c => c.id));
    const validIds = result.selected_ids.filter(id => candidateIdSet.has(id));
    const invalidIds = result.selected_ids.filter(id => !candidateIdSet.has(id));
    
    if (invalidIds.length > 0) {
      console.error('[RerankAndRespond] INVALID IDs not in candidates:', JSON.stringify(invalidIds));
      console.error('[RerankAndRespond] Valid IDs:', JSON.stringify(validIds));
    }

    // If LLM returned invalid IDs, try to salvage by using valid ones
    if (validIds.length < result.selected_ids.length && validIds.length > 0) {
      console.warn('[RerankAndRespond] Using only valid IDs:', validIds.length, 'of', result.selected_ids.length);
      result.selected_ids = validIds;
    }

    return result;
  } catch (error) {
    console.error('[RerankAndRespond] Error:', error);
    // Fallback
    return {
      selected_ids: candidates.slice(0, maxResults).map(p => p.id),
      response: {
        reasoning: 'Here are some options I found that might work for you.',
        follow_up_question: '',
      },
      product_insights: [],
      suggested_follow_ups: []
    };
  }
}

/**
 * Compose the final response text from structured response fields
 * Now uses the reasoning field which contains properly formatted paragraphs
 */
function composeResponseText(response: LLMResponseFields, hasProducts: boolean): string {
  // New format: use reasoning field directly (already has paragraphs)
  if (response.reasoning) {
    const parts: string[] = [response.reasoning];
    if (response.follow_up_question) {
      parts.push(response.follow_up_question);
    }
    return parts.filter(p => p.trim()).join('\n\n').trim();
  }

  // Legacy fallback for old response format
  if (!hasProducts) {
    return response.intent_acknowledgment || response.follow_up_question || '';
  }

  const parts: string[] = [];
  if (response.intent_acknowledgment) {
    parts.push(response.intent_acknowledgment);
  }
  if (response.product_highlights) {
    parts.push(response.product_highlights);
  }
  if (response.follow_up_question) {
    parts.push(response.follow_up_question);
  }

  return parts.filter(p => p.trim()).join(' ').trim();
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

  // Build context string for LLM - includes session state
  let contextString = '';
  
  // Page context
  if (context.page_type) {
    contextString += `Page: ${context.page_type}`;
  }
  if (context.viewingProduct) {
    contextString += `\nViewing product: "${context.viewingProduct.name}" (${context.viewingProduct.subcategory}, ${context.viewingProduct.brand}, £${context.viewingProduct.price})`;
  }
  
  // Session state - THIS IS KEY: pass full session state to LLM
  if (context.sessionState) {
    const ss = context.sessionState;
    contextString += `\n\nSession State:`;
    contextString += `\n- conversation_mode: ${ss.conversationMode}`;
    
    if (ss.supportContext) {
      contextString += `\n- support_context: { issue_type: "${ss.supportContext.issueType}", resolved: ${ss.supportContext.resolved} }`;
    }
    
    if (ss.shoppingContext) {
      contextString += `\n- shopping_context: { subcategory: "${ss.shoppingContext.subcategory}", query: "${ss.shoppingContext.query}", constraints: [${ss.shoppingContext.constraints.map(c => `"${c}"`).join(', ')}] }`;
    }
    
    if (ss.productsShownThisSession.length > 0) {
      contextString += `\n- products_shown_this_session: ${ss.productsShownThisSession.length} products already shown (avoid repeats)`;
    }
  }
  
  // Build messages array for OpenAI
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    // Add context (page + session state)
    ...(contextString
      ? [{ role: 'system' as const, content: `Current context:\n${contextString}` }]
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
    // === TIMING: Stage 1 - Intent Classification ===
    const stage1Start = performance.now();
    console.log('[Timing] Stage 1 START - Intent Classification');
    console.log('[Stage 1] Using model:', config.model);
    
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
    console.log(`[Timing] Stage 1 COMPLETE - ${(llmEndTime - stage1Start).toFixed(0)}ms`);

    // Parse LLM response (Stage 1: classification + understood_intent)
    const llmResponse: LLMResponse = JSON.parse(data.choices[0].message.content);

    // Initialize response variables
    let products: Product[] = [];
    let responseText = '';
    let suggestedFollowUps: SuggestedFollowUp[] = llmResponse.suggested_follow_ups || [];

    // For non-product responses (support, ambiguous), use Stage 1 response
    if (!llmResponse.decision.show_products) {
      responseText = composeResponseText(llmResponse.response, false);
    }

    // For product responses, use Stage 2b (rerank + respond)
    if (llmResponse.decision.show_products && llmResponse.product_search) {
      // === TIMING: Product Search ===
      const searchStart = performance.now();
      console.log('[Timing] Product Search START');
      
      // Step 1: Coarse retrieval - get candidates by category
      // Exclude products already shown this session (for "show more" / "different options")
      const excludeIds = context.sessionState?.productsShownThisSession || [];
      const searchResult = await searchProducts({
        query: llmResponse.product_search.query,
        subcategory: llmResponse.product_search.subcategory,
        maxResults: 30, // Get many candidates for reranking
        minPrice: llmResponse.product_search.priceRange?.min,
        maxPrice: llmResponse.product_search.priceRange?.max,
        excludeIds,
      });
      
      const searchEnd = performance.now();
      console.log(`[Timing] Product Search COMPLETE - ${(searchEnd - searchStart).toFixed(0)}ms (found ${searchResult.products.length} candidates)`);

      if (searchResult.products.length > 0) {
        // === TIMING: Stage 2b - Rerank + Respond ===
        const stage2Start = performance.now();
        console.log('[Timing] Stage 2b START - Rerank + Respond');
        
        // Step 2: Combined rerank + response generation (THE KEY FIX)
        // Response is generated AFTER seeing actual products
        // Pass viewing product for contextual card_reasons
        const rerankResult = await rerankAndRespond(
          userMessage,
          llmResponse.understood_intent,
          searchResult.products,
          llmResponse.decision.item_count,
          context.viewingProduct // Pass PDP context for better card_reasons
        );
        
        const stage2End = performance.now();
        console.log(`[Timing] Stage 2b COMPLETE - ${(stage2End - stage2Start).toFixed(0)}ms`);

        // Get the selected products in order and attach AI reasoning
        const insightsMap = new Map(
          rerankResult.product_insights.map(p => [p.id, p])
        );
        
        console.log('[QueryFin] Reranker selected IDs:', rerankResult.selected_ids);
        console.log('[QueryFin] Search result product IDs:', searchResult.products.map(p => p.id).slice(0, 10), '...');
        
        const selectedProducts = rerankResult.selected_ids
          .map(id => {
            const product = searchResult.products.find(p => p.id === id);
            if (!product) {
              console.warn('[QueryFin] Product ID not found in search results:', id);
              return undefined;
            }
            
            // Attach card_reason as aiReasoning for display on cards
            const insight = insightsMap.get(id);
            if (insight?.card_reason) {
              return { ...product, aiReasoning: insight.card_reason };
            }
            return product;
          })
          .filter((p): p is Product => p !== undefined);

        console.log('[QueryFin] Final product count:', selectedProducts.length);
        products = selectedProducts;

        // Use response from Stage 2b (which references actual products)
        if (products.length > 0) {
          responseText = composeResponseText(rerankResult.response, true);
          suggestedFollowUps = rerankResult.suggested_follow_ups || suggestedFollowUps;
          
          // Store product insights for debugging
          llmResponse.reasoning.product_reasoning = rerankResult.product_insights.map(
            p => `${p.why_selected} (${p.differentiator})`
          );
        } else {
          // Reranker found no good matches
          responseText = composeResponseText(rerankResult.response, false);
          llmResponse.decision.show_products = false;
        }
      } else {
        // No candidates found at all from coarse retrieval
        // This could be: (a) category doesn't exist in catalog, (b) inference was wrong, (c) filters too narrow
        
        const inferredSubcategory = llmResponse.product_search?.subcategory?.toLowerCase() || '';
        const userQuery = userMessage.toLowerCase();
        
        // Categories we DON'T have in our ASOS clothing catalog
        const notInCatalog = ['shoes', 'trainers', 'boots', 'heels', 'sandals', 'bags', 'accessories', 'jewellery', 'watches'];
        const categoryNotInCatalog = notInCatalog.some(cat => 
          inferredSubcategory.includes(cat) || userQuery.includes(cat)
        );
        
        // Check if the LLM inferred a category the user didn't explicitly mention
        const wasInferred = inferredSubcategory && !userQuery.includes(inferredSubcategory);
        
        if (categoryNotInCatalog) {
          // Category doesn't exist in our catalog
          responseText = `Our catalog focuses on clothing like jackets, dresses, tops, and trousers — I don't have ${inferredSubcategory || 'that category'}. Would you like me to help you find something else?`;
        } else if (wasInferred) {
          // LLM inferred a category that might be wrong
          responseText = `I tried to find ${inferredSubcategory} based on your request, but couldn't find good matches. Could you tell me more about what you're looking for?`;
        } else {
          // General no-results
          responseText = `I couldn't find products matching that. Our catalog has jackets, dresses, tops, jeans, coats, and more. What would you like to explore?`;
        }
        llmResponse.decision.show_products = false;
      }
    }
    searchEndTime = performance.now();

    // Get session state update from LLM (with fallback)
    const sessionStateUpdate: SessionStateUpdate = llmResponse.session_state_update || {
      conversationMode: llmResponse.intent.primary === 'support' ? 'support' : 
                       llmResponse.intent.primary === 'shopping_discovery' ? 'shopping' : 'neutral',
      supportContext: null,
      shoppingContext: null,
    };

    // === TIMING SUMMARY ===
    const totalTime = searchEndTime - startTime;
    console.log(`[Timing] ========== TOTAL: ${totalTime.toFixed(0)}ms ==========`);
    console.log(`[Timing] Stage 1 (Classification): ${(llmEndTime - startTime).toFixed(0)}ms`);
    console.log(`[Timing] Stage 2 (Search + Rerank): ${(searchEndTime - llmEndTime).toFixed(0)}ms`);
    
    return {
      llmResponse,
      products,
      suggestedFollowUps,
      responseText,
      latency: {
        total: searchEndTime - startTime,
        llm: llmEndTime - startTime,
        search: searchEndTime - llmEndTime,
      },
      sessionStateUpdate,
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
    // Determine support issue type
    const issueType = lowerMessage.includes('return') || lowerMessage.includes('refund') ? 'return' :
                     lowerMessage.includes('tracking') || lowerMessage.includes('order') ? 'order_tracking' :
                     lowerMessage.includes('account') || lowerMessage.includes('password') ? 'account' : 'general';
    
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
        reasoning: "I understand you need help with your order.",
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
      session_state_update: {
        conversationMode: 'support',
        supportContext: { issueType, resolved: false },
        shoppingContext: null,
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
        item_count: 8,
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
        reasoning: `I've pulled together a variety of ${detectedCategory} with good reviews and different styles.\n\nYou'll see options ranging from casual everyday pieces to more polished looks.`,
        follow_up_question: 'Any particular style or price range you have in mind?',
      },
      suggested_follow_ups: [
        { label: 'Under $50', query: `Show me ${detectedCategory} under $50` },
        { label: 'Most popular', query: `What are the most popular ${detectedCategory}?` },
      ],
      reasoning: {
        intent_explanation: `User mentioned ${detectedCategory}`,
        selection_reasoning: 'Showing variety of options in the category',
      },
      session_state_update: {
        conversationMode: 'shopping',
        supportContext: null,
        shoppingContext: {
          subcategory: detectedCategory,
          query: userMessage,
          constraints: [],
        },
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
        reasoning: "I'd love to help you find something!",
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
      session_state_update: {
        conversationMode: 'neutral',
        supportContext: null,
        shoppingContext: null,
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
    sessionStateUpdate: llmResponse.session_state_update,
  };
}
