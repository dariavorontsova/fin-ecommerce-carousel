# Implementation Analysis: Fin E-commerce AI Shopping Assistant

> **START HERE** — This is the primary working document for the Fin E-commerce prototype.
> 
> Contains: Current state analysis, known problems, architecture, and complete implementation plan.
> 
> Related: [PRD.md](./PRD.md) for philosophy, success criteria, and UI specifications.

**Date**: 2026-01-16  
**Status**: READY FOR IMPLEMENTATION  
**Version**: 2.0 (Final after peer review)

---

## Executive Summary

We are building an AI shopping assistant that should demonstrate **fundamental superiority over traditional e-commerce search**. After multiple implementation iterations, the system is failing to meet its core goals. This document analyzes why, and provides a complete implementation plan.

**Current State**: The implementation behaves like a keyword-matching search wrapper with a chat UI, not an intelligent shopping assistant.

**Root Cause**: Two architectural mistakes:
1. Response generated BEFORE products are selected (causes hallucination)
2. Classification requires explicit keywords instead of inferring from context

**Solution**: Fix response timing first (architectural), then fix classification logic.

---

## 1. The Philosophy We're Demonstrating

### The Meta Goal

**Why should anyone use AI for e-commerce instead of traditional catalog browsing?**

Traditional e-commerce:
- User types keywords → database filter → results → user figures out what's relevant
- Zero understanding of WHY the user wants something

AI shopping should:
- Understand the intent BEHIND the query, not just keywords
- Recognize implicit constraints the user didn't explicitly state
- Reason about which products fit the USE CASE
- Explain WHY specific products were selected
- Guide the user toward a decision

**The key insight**: The AI's unique value is **synthesis and reasoning**. Any search filter can return "products tagged with X." Only AI can understand "casual jacket for work" means "professional enough for meetings, relaxed enough for everyday, versatile colors."

### The Four User Experience Goals

| Goal | What It Means |
|------|---------------|
| "It gets me" | AI demonstrates understanding of actual needs, including unspoken ones |
| "It's not just search" | Response shows reasoning, not just results |
| "It's helping me decide" | AI guides toward decision, not just dumps options |
| "It's actually faster" | Natural language beats clicking through filter menus |

### Success Criteria

1. User asking "casual jacket for work" receives products selected for **office-appropriateness**, not just any jackets
2. The response **references actual product names** and explains why each was chosen
3. Each product is **differentiated** — why you'd pick one vs another
4. Follow-up suggestions **advance the shopping journey** — not generic "anything else?"
5. The experience feels like talking to **someone who knows fashion**, not querying a database

### AI Reasoning on Cards (Key Differentiator)

Traditional product cards show **deterministic metadata**:
- Star rating (4.5 stars)
- Review count (338 reviews)
- Tags ("New", "Sale", "Best Seller")
- Category labels

This is **old-world differentiation** — the user still has to interpret what these numbers mean for their specific need.

**AI Reasoning on Cards** replaces generic metadata with **contextual, per-product reasoning**:

| Traditional Card | AI Reasoning Card |
|------------------|-------------------|
| ★★★★½ (338 reviews) | "Great for creative offices — adds personality without being too loud" |
| "Best Seller" badge | "Versatile enough for client meetings and casual Fridays" |
| "Relaxed fit" tag | "The relaxed cut works well if you're on your feet at a kids' party" |

**Why this matters**:
- Rating/reviews tell you what OTHER people thought — not whether it fits YOUR need
- AI reasoning tells you WHY this product matches YOUR specific query
- If AI is good enough, it doesn't need to rely on metadata, categories, and SKUs to make smart recommendations
- Price remains visible (critical for decision-making) but the primary differentiator becomes the reasoning

**Implementation**: The `product_insights` from Stage 2b should include a brief `card_reason` (1 line, ~10-15 words) that appears on the card when AI Reasoning mode is enabled.

**UI**: Toggle exists in prototype (`aiReasoningMode`). When ON:
- Card shows: Image, Product Name, Price, **AI Reason** (1 line)
- Card hides: Rating, review count, description, tags

---

## 2. Current Architecture (What's Broken)

### Current Flow

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Classification + Response Generation (gpt-4o)     │
│  ─────────────────────────────────────────────────────────  │
│  Outputs:                                                   │
│  • intent, decision, product_search                         │
│  • response fields (intent_acknowledgment, product_highlights) │  ← PROBLEM: Written BLIND
│  • suggested_follow_ups, reasoning                          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2a: Coarse Retrieval (no LLM)                        │
│  • Filter catalog by subcategory                            │
│  • Get 30 candidates                                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2b: LLM Reranking (gpt-4o-mini)                      │
│  • Select 4-6 best matches                                  │
│  • Generate per-product insights                            │  ← These insights are THROWN AWAY
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Response uses Stage 1 text + Stage 2b products
(Text can't reference actual products = HALLUCINATION)
```

### The Eight Problems

| # | Problem | Impact |
|---|---------|--------|
| 1 | Response generated BEFORE products selected | Hallucinated product names, generic differentiation |
| 2 | Classification requires explicit keywords | "kids party, cold" fails; "jacket" works |
| 3 | Product insights from reranker thrown away | Lost value; response can't use them |
| 4 | No conversation memory | "show me more" returns same products |
| 5 | No refinement support | "something cheaper" treated as new search |
| 6 | Item count logic broken | Single results for broad queries |
| 7 | Follow-ups generated before products known | Generic, not contextual |
| 8 | Empty results handling weak | No graceful degradation |

---

## 3. Target Architecture (The Fix)

### New Flow

```
User Query + Conversation Context
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Classification Only (gpt-4o)                      │
│  ─────────────────────────────────────────────────────────  │
│  Outputs:                                                   │
│  • intent (shopping/support/ambiguous/refinement)           │
│  • decision (show_products, renderer, item_count)           │
│  • product_search (query, subcategory — can be inferred)    │
│  • understood_intent (explicit + implicit needs)            │
│  • NO response text (moved to Stage 2)                      │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2a: Coarse Retrieval (no LLM)                        │
│  • Filter by subcategory (inferred or explicit)             │
│  • Exclude products_shown_this_session                      │
│  • Get 30 candidates                                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2b: Rerank + Respond (gpt-4o-mini)                   │  ← KEY CHANGE
│  ─────────────────────────────────────────────────────────  │
│  Inputs: user query, understood_intent, candidates          │
│  Outputs:                                                   │
│  • selected_ids (products to show)                          │
│  • response (references ACTUAL product names)               │
│  • product_insights (per-product reasoning)                 │
│  • suggested_follow_ups (contextual to results)             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Response with ACCURATE product references
```

---

## 4. Implementation Plan

### Priority 1: Fix Response Timing (THE ARCHITECTURAL FIX)

**What**: Combine rerank + response generation into single Stage 2b call

**Why**: This is the root cause of hallucination. Response generated AFTER products selected automatically gives:
- Accurate product references
- Real differentiation (can name actual products)
- Better selection explanation
- Contextual follow-ups

**File**: `src/services/openai.ts`

**Change**: Replace `RERANK_PROMPT` with `RERANK_AND_RESPOND_PROMPT`:

```typescript
const RERANK_AND_RESPOND_PROMPT = `You are a product selection and response AI for a fashion shopping assistant.

## Your Task

Given a user's query, their understood intent, and product candidates:
1. Select the products that BEST match the user's need (max 6)
2. Write a response that demonstrates understanding and reasoning
3. Generate contextual follow-up suggestions

## Selection Rules

- Match products to the USE CASE, not just the category
- Consider implicit constraints (e.g., "work" → professional styling)
- Provide VARIETY: different price points, styles, formality levels
- If user asked for specific attributes (color, price), prioritize exact matches

## Item Count Rules

- Default to 4-6 items for discovery/browsing queries
- Return 1-2 items only if user asked for "the best" or "your top recommendation"
- Never return fewer than 2 items for browsing intent unless catalog is limited
- If many good matches exist, show variety

## Response Quality Rules

Your response MUST:
1. **Acknowledge intent**: Show you understood the underlying need, not just keywords
2. **Explain selection**: Why THESE specific products (reference actual names)
3. **Differentiate products**: When would you pick each one? (use actual product names)
4. **Contextual follow-up**: Relevant next step, NOT "anything else?"

IMPORTANT: You can see the actual products. Reference them BY NAME in product_highlights.

## If No Good Matches

If the candidates don't match the query well:
- Acknowledge the gap honestly
- Explain what's available instead
- Ask if alternatives would help

Example: "I couldn't find red dresses specifically, but I have some great burgundy and coral options that might work. Would you like to see those?"

## Output Format

Return JSON:
{
  "selected_ids": ["id1", "id2", ...],
  "response": {
    "intent_acknowledgment": "For [use case], you'll want [key consideration].",
    "selection_explanation": "I selected these because [reasoning about THESE SPECIFIC products].",
    "product_highlights": "[Actual Product Name] is [differentiation]. [Another Product Name] is [differentiation].",
    "follow_up_question": "[Contextual question based on what was shown]"
  },
  "product_insights": [
    {
      "id": "product_id",
      "why_selected": "Why this product fits the user's need",
      "best_for": "When/who would choose this option",
      "differentiator": "What makes this unique vs others shown",
      "card_reason": "Brief 10-15 word reason shown ON the card (e.g., 'Perfect for creative offices — adds personality without being too loud')"
    }
  ],
  "suggested_follow_ups": [
    {"label": "Different price range", "query": "Show me similar but under £50"},
    {"label": "Other colors", "query": "Do these come in other colors?"},
    {"label": "Complete the look", "query": "What would go well with these?"}
  ]
}`;
```

**Also update `rerankProducts` function** to:
1. Accept `understoodIntent` parameter
2. Return response fields (not just selected_ids)
3. Use the new prompt

**Update `queryFin` function** to:
1. Use response from Stage 2b (not Stage 1)
2. Compose `responseText` from Stage 2b's response fields

---

### Priority 2: Fix Classification Prompt (Allow Inference)

**What**: Update SYSTEM_PROMPT to allow inference from context, not just keywords

**Why**: Without this, queries like "kids party", "interview", "beach vacation" all fail.

**File**: `src/services/openai.ts`

**Change**: Replace classification section (lines ~113-127) with:

```typescript
### shopping_discovery — Show Products

Show products when you can INFER what the user needs:

**Explicit product types** (always show products):
- User mentions: "jacket", "dress", "jeans", "top", "coat", "sweater", etc.
- Example: "casual jacket for work" → subcategory: "jackets"

**Inferable from context** (infer category and show products):
- Occasion: "kids party" → casual/comfortable; "wedding" → formal; "interview" → professional
- Weather: "cold weather" → warm layers (jumpers, coats); "summer" → light pieces
- Activity: "travel" → comfortable, wrinkle-resistant; "date night" → stylish

When inferring, set subcategory to your best guess for what category fits:
- "kids party, cold" → subcategory: "jumpers" (warm, casual, easy to move)
- "job interview" → subcategory: "blazers" (professional)
- "beach vacation" → subcategory: "dresses" (light, summery)

**Decision Matrix:**

| Has Category | Has Context | Action |
|--------------|-------------|--------|
| ✅ "jacket" | ✅ "for work" | SHOW: jackets filtered for work-appropriate |
| ✅ "jacket" | ❌ none | SHOW: jackets (follow-up: "What's the occasion?") |
| ❌ none | ✅ "kids party, cold" | SHOW: infer warm casual (jumpers/cardigans) |
| ❌ none | ❌ none | CLARIFY: "What type of clothing?" |

**When to clarify** (genuinely ambiguous):
- No category AND no context: "help", "something nice", "ideas"
- Conflicting signals: unclear if shopping vs support
- Single word with no context: "summer", "blue", "cheap"

**Key principle**: If a knowledgeable sales assistant could reasonably recommend products, so should you. Don't ask "what type of clothing?" when the user said "cold weather kids' party" — you can infer warm casual layers.
```

**Also update the output schema section** to clarify subcategory can be inferred:

```typescript
"product_search": {
  "query": "natural language description of what to search for",
  "subcategory": "jackets | jumpers | dresses | etc. (can be INFERRED from context)",
  "priceRange": {"min": number, "max": number} | null
}
```

---

### Priority 3: Add Conversation Memory

**What**: Track products shown, handle "show more" / "different options"

**Why**: Basic conversational continuity. Users expect to refine, not restart.

**File**: `src/App.tsx`

**Changes**:

1. Add state for tracking shown products:

```typescript
// Add to App component state:
const [productsShownThisSession, setProductsShownThisSession] = useState<string[]>([]);
```

2. Update when products are shown:

```typescript
// In handleSend, after getting response:
if (response.products.length > 0) {
  setProductsShownThisSession(prev => [
    ...prev,
    ...response.products.map(p => p.id)
  ]);
}
```

3. Pass to queryFin:

```typescript
// Update queryFin call:
response = await queryFin(content, history, {
  ...context,
  productsShownThisSession
});
```

4. Add "Clear conversation" to also clear shown products:

```typescript
const clearConversation = () => {
  setMessages([]);
  setProductsShownThisSession([]); // Add this
  clearSavedConversation();
};
```

**File**: `src/services/openai.ts`

**Changes**:

1. Update `ConversationContext` interface:

```typescript
export interface ConversationContext {
  page_type?: 'home' | 'product' | 'category' | 'cart' | 'checkout';
  cart_items?: number;
  user_status?: 'new' | 'returning' | 'vip';
  previous_purchases?: string[];
  productsShownThisSession?: string[];  // ADD THIS
}
```

2. Update `searchProducts` call to exclude shown products:

```typescript
// In queryFin, when calling searchProducts:
const searchResult = await searchProducts({
  query: llmResponse.product_search.query,
  subcategory: llmResponse.product_search.subcategory,
  maxResults: 30,
  excludeIds: context.productsShownThisSession || [],  // ADD THIS
  minPrice: llmResponse.product_search.priceRange?.min,
  maxPrice: llmResponse.product_search.priceRange?.max,
});
```

**File**: `src/services/productSearch.ts`

**Changes**:

1. Update `SearchOptions` interface:

```typescript
export interface SearchOptions {
  query?: string;
  subcategory?: string;
  maxResults?: number;
  minPrice?: number;
  maxPrice?: number;
  excludeIds?: string[];  // ADD THIS
}
```

2. Add exclusion filter:

```typescript
// In searchProducts, after category filtering:
if (options.excludeIds && options.excludeIds.length > 0) {
  results = results.filter(p => !options.excludeIds!.includes(p.id));
}
```

---

### Priority 4: Add Refinement Handling

**What**: Support "cheaper", "in blue", "more formal", etc.

**Why**: Table-stakes for shopping assistant.

**File**: `src/services/openai.ts`

**Changes to SYSTEM_PROMPT**:

Add new intent type and detection logic:

```typescript
### refinement — Modify Previous Search

User wants to adjust the previous product search without starting over.

**Signals**:
- Price: "cheaper", "under $50", "more affordable", "higher end"
- Color: "in blue", "darker colors", "something red"
- Style: "more formal", "more casual", "something edgier"
- Quantity: "show me more", "other options", "different ones", "any others?"
- Similarity: "like that first one", "similar to the black one"

**How to handle**:
- Set intent.primary = "refinement"
- Set product_search.query to describe the refinement
- The system will apply this to the previous search context

**Examples**:
- "Something cheaper" → refinement, query: "similar style but lower price"
- "In blue" → refinement, query: "same type but blue color"
- "Show me more" → refinement, query: "more options, exclude already shown"

**NOT refinement** (these are new searches):
- "Now show me dresses" → new search for dresses
- "What about shoes?" → new search for shoes
- "I need a jacket" → new search (restates product type)
```

**Update intent type**:

```typescript
export type IntentType = 'shopping_discovery' | 'support' | 'ambiguous' | 'refinement';
```

**Update queryFin to handle refinement**:

```typescript
// In queryFin, after getting LLM response:
if (llmResponse.intent.primary === 'refinement') {
  // Use previous search context if available
  // For now, just ensure we exclude already-shown products
  // The "productsShownThisSession" exclusion handles "show me more"
  
  // For attribute refinements (color, price), the LLM's product_search.query
  // will include the refinement, and the reranker will filter accordingly
}
```

---

### Priority 5: Handle Empty/Poor Results Gracefully

**What**: When inference leads to no products or poor matches

**Why**: The catalog is ASOS fashion — some inferred categories won't exist

**This is handled in the RERANK_AND_RESPOND_PROMPT** (Priority 1), but also add to `queryFin`:

```typescript
// After reranking, if no products selected:
if (products.length === 0) {
  // Check if it was an inference miss
  const inferredCategory = llmResponse.product_search?.subcategory;
  const wasInferred = !userMessage.toLowerCase().includes(inferredCategory || '');
  
  if (wasInferred) {
    responseText = `I tried to find ${inferredCategory} based on your request, but our catalog doesn't have great matches. Would you like me to suggest something else, or could you tell me more specifically what you're looking for?`;
  } else {
    responseText = `I couldn't find products matching "${llmResponse.product_search?.query}". Our catalog focuses on fashion items like jackets, dresses, tops, and trousers. Would you like to try a different search?`;
  }
  llmResponse.decision.show_products = false;
}
```

---

### Priority 6: Update Stage 1 to Remove Response Generation

**What**: Stage 1 should only classify and extract intent, not generate response

**Why**: Response fields are now generated in Stage 2b with actual products

**File**: `src/services/openai.ts`

**Remove from SYSTEM_PROMPT output schema**:
- `response.intent_acknowledgment`
- `response.selection_explanation`
- `response.product_highlights`
- `response.follow_up_question`
- `suggested_follow_ups` (moved to Stage 2b)

**Keep in Stage 1**:
- `intent`
- `decision`
- `product_search`
- `understood_intent`
- `reasoning`

**Update LLMResponse interface**:

```typescript
export interface LLMResponse {
  intent: LLMIntent;
  decision: LLMDecision;
  product_search: LLMProductSearch | null;
  understood_intent: LLMUnderstoodIntent;
  reasoning: LLMReasoning;
  // Response fields now come from Stage 2b, not here
}
```

**Create new interface for Stage 2b output**:

```typescript
export interface RerankAndRespondResult {
  selected_ids: string[];
  response: {
    intent_acknowledgment: string;
    selection_explanation: string;
    product_highlights: string;
    follow_up_question: string;
  };
  product_insights: ProductInsight[];
  suggested_follow_ups: SuggestedFollowUp[];
}
```

---

### Priority 7: Wire AI Reasoning to Product Cards

**What**: Display per-product AI reasoning on cards instead of generic metadata

**Why**: This is a key differentiator. Traditional metadata (ratings, tags) tells users what others thought — AI reasoning tells users why THIS product fits THEIR specific need.

**Philosophy**: If AI is good enough, it doesn't need ratings, categories, and SKUs to make smart recommendations. The reasoning IS the value.

**Files**: `src/App.tsx`, `src/components/ProductCard.tsx` (or equivalent)

**Changes**:

1. **Pass `product_insights` to the card renderer**:

The `product_insights` from Stage 2b includes `card_reason` for each product. This needs to flow from `queryFin` → `handleSend` → `AgentMessage` → `ProductCard`.

```typescript
// In the message/product data structure, include:
interface ProductWithInsight extends Product {
  card_reason?: string;  // From product_insights[].card_reason
}
```

2. **Update ProductCard to show AI reason when `aiReasoningMode` is ON**:

```typescript
// ProductCard component (pseudocode)
if (aiReasoningMode && product.card_reason) {
  // Show: Image, Name, Price, card_reason
  // Hide: Rating, reviewCount, description, tags, badges
  return (
    <Card>
      <Image />
      <Name />
      <Price />
      <AIReason>{product.card_reason}</AIReason>  {/* NEW */}
    </Card>
  );
} else {
  // Show traditional metadata
  return (
    <Card>
      <Image />
      <Name />
      <Price />
      <Rating />
      <Description />
      {/* etc */}
    </Card>
  );
}
```

3. **Style the AI reason**:
- Font: Slightly smaller than product name, but readable
- Color: Muted but not gray (this is valuable content)
- Length: 1-2 lines max (~50-80 characters)
- Tone: Conversational, specific to user's query

**Examples of good card_reason text**:
- "Great for creative offices — adds personality without being too loud"
- "The relaxed fit works well if you're on your feet all day"
- "Versatile enough for client meetings and casual Fridays"
- "Warm without bulk — perfect for running around at a kids' party"

**Test**: 
1. Enable "AI Reasoning on Cards" toggle
2. Query "casual jacket for work"
3. Verify cards show brief AI reason instead of star rating

---

### Priority 8: Page Context (PDP Awareness)

**What**: Add page context selector so LLM knows if user is viewing a specific product

**Why**: When on a Product Details Page, queries like "find matching socks" or "something similar" refer to the product being viewed. Without this context, the LLM can't interpret these correctly.

**Key insight**: Only PDP actually changes behavior. Home/Category pages don't provide specific product context.

**UI Changes** (`src/App.tsx`):

1. Add dropdown selector in settings panel:

```typescript
// State
const [pageContext, setPageContext] = useState<'home' | 'category' | 'product'>('home');
const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

// UI - Dropdown
<Select value={pageContext} onValueChange={setPageContext}>
  <SelectItem value="home">Home Page</SelectItem>
  <SelectItem value="category">Category Page</SelectItem>
  <SelectItem value="product">Product Details Page</SelectItem>
</Select>

// When "product" selected, show product picker
{pageContext === 'product' && (
  <Select value={viewingProduct?.id} onValueChange={(id) => setViewingProduct(findProduct(id))}>
    {allProducts.slice(0, 20).map(p => (
      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
    ))}
  </Select>
)}
```

2. Pass to queryFin:

```typescript
await queryFin(content, history, {
  ...context,
  pageContext,
  viewingProduct: pageContext === 'product' ? viewingProduct : null
});
```

**Prompt Changes** (`src/services/openai.ts`):

Add to SYSTEM_PROMPT:

```typescript
## Page Context

The user may be viewing a specific page. This affects how to interpret their query.

**If page_type is "product" and a viewingProduct is provided**:
- User is on a Product Details Page viewing a specific item
- Queries like "matching", "similar", "goes with this", "something like this but..." refer to the viewed product
- Include the viewed product context in your reasoning

**If page_type is "home" or "category"**:
- No specific product context
- "Matching socks" → matching to WHAT? Need to clarify
- "Something similar" → similar to WHAT? Need to clarify

Example:
- Page: PDP viewing "ASOS Blue Cotton Shirt"
- Query: "What pants would go with this?"
- → Search for pants that complement a blue cotton shirt (no clarification needed)
```

**Context format passed to LLM**:

```json
{
  "page_context": {
    "type": "product",
    "viewing_product": {
      "name": "ASOS Blue Cotton Shirt",
      "description": "Classic fit cotton shirt in light blue",
      "category": "shirts",
      "price": 35
    }
  }
}
```

**Test cases**:

| Page | Query | Expected |
|------|-------|----------|
| PDP (Blue Shirt) | "What pants would match?" | Shows pants that go with blue shirts |
| PDP (Blue Shirt) | "Something similar but cheaper" | Shows similar shirts, lower price |
| Home | "What pants would match?" | Clarify: "Match with what?" |
| Category (Dresses) | "Something cheaper" | Could infer: cheaper dresses (weak signal) |

**Note**: For the prototype, Home and Category behave the same (no specific product). Only PDP changes behavior.

---

### Priority 9 (Deferred): Update Mock Mode

**What**: Make `queryFinMock` consistent with new behavior

**Status**: DEFERRED

**Reason**: For testing, use LLM mode with API key. Mock mode will be updated to match once real behavior is validated and stable.

**Note**: Mock mode currently has the same architectural problems (response before products). This is acceptable for development without API key but should not be used for validating the fix.

---

## 5. File-by-File Change Summary

### `src/services/openai.ts`

| Section | Change |
|---------|--------|
| `SYSTEM_PROMPT` classification | Allow inference from context (Priority 2) |
| `SYSTEM_PROMPT` output schema | Remove response fields (Priority 6) |
| `SYSTEM_PROMPT` intents | Add "refinement" type (Priority 4) |
| `RERANK_PROMPT` | Replace with `RERANK_AND_RESPOND_PROMPT` (Priority 1) |
| `rerankProducts` function | Return response fields, follow-ups (Priority 1) |
| `queryFin` function | Use Stage 2b response, handle refinements (Priorities 1, 4, 5) |
| `ConversationContext` interface | Add `productsShownThisSession` (Priority 3) |
| `LLMResponse` interface | Remove response fields (Priority 6) |
| NEW: `RerankAndRespondResult` | Add interface for Stage 2b output (Priority 1) |

### `src/services/productSearch.ts`

| Section | Change |
|---------|--------|
| `SearchOptions` interface | Add `excludeIds` field (Priority 3) |
| `searchProducts` function | Filter out excluded IDs (Priority 3) |

### `src/App.tsx`

| Section | Change |
|---------|--------|
| Component state | Add `productsShownThisSession` state (Priority 3) |
| Component state | Add `pageContext` and `viewingProduct` state (Priority 8) |
| `handleSend` | Track shown products, pass to queryFin, attach card_reason to products (Priorities 3, 7) |
| `clearConversation` | Also clear shown products (Priority 3) |
| Settings panel | Add page context dropdown + product selector when PDP (Priority 8) |

### `src/components/ProductCard.tsx` (or card component)

| Section | Change |
|---------|--------|
| Card render | Conditionally show `card_reason` when `aiReasoningMode` is ON (Priority 7) |
| Props | Accept `card_reason` and `aiReasoningMode` props (Priority 7) |

---

## 6. Test Cases for Validation

### Must Pass (Blockers)

These MUST work before considering the fix complete:

| # | Query | Expected Behavior | Validates |
|---|-------|-------------------|-----------|
| 1 | "casual jacket for work" | Shows jackets, response mentions ACTUAL product names | Basic flow + no hallucination |
| 2 | "kids party tomorrow, cold weather" | Shows warm casual options (jumpers/cardigans), NOT "what type?" | Inference from context |
| 3 | "interview next week" | Shows professional options (blazers/shirts) | Inference from occasion |
| 4 | "beach vacation" | Shows light summer pieces | Inference from activity |
| 5 | "red dress for party" | Shows dresses, prioritizes red ones | Semantic reranking |
| 6 | [After #1] "show me more" | Shows DIFFERENT jackets (not same ones) | Conversation memory |
| 7 | [After #1] "something cheaper" | Shows lower-priced jackets | Refinement handling |
| 8 | "return my order" | Provides return policy info, NO products | Support detection |
| 9 | "summer" | Clarifies: "dresses, tops, or shorts?" | Genuinely vague |
| 10 | "help" | Clarifies: shopping or support? | Genuinely ambiguous |

### Quality Checks

| Check | How to Verify |
|-------|---------------|
| No hallucinated products | Response mentions only products actually shown in carousel |
| Real differentiation | "Product X is... Product Y is..." uses actual names from results |
| Contextual follow-ups | Follow-up suggestions relate to actual products/query |
| Variety in results | 4-6 products with different price points/styles |
| AI Reasoning on Cards | Toggle ON → cards show brief contextual reason instead of star rating |
| Page Context (PDP) | On PDP viewing blue shirt, "what matches?" → shows matching items without clarifying |

### Regression Tests (Must Not Break)

| Query | Expected | Why |
|-------|----------|-----|
| "jacket" (explicit keyword) | Shows jackets | Basic keyword still works |
| "I need to return" | Support response | Support detection unchanged |
| "Is the [product] available in size M?" | Single card + answer | Product inquiry works |

---

## 7. Implementation Order

Execute in this exact order:

### Day 1: Core Architecture Fix

1. **Update `RERANK_PROMPT` → `RERANK_AND_RESPOND_PROMPT`** (Priority 1)
   - New prompt with response generation
   - Item count rules
   - Empty results handling

2. **Update `rerankProducts` function** (Priority 1)
   - Accept understoodIntent
   - Return RerankAndRespondResult
   - Use new prompt

3. **Update `queryFin` function** (Priority 1)
   - Use response from Stage 2b
   - Compose responseText from Stage 2b fields

4. **Test**: Query "casual jacket for work"
   - Verify response mentions actual product names
   - Verify no hallucination

### Day 1: Classification Fix

5. **Update SYSTEM_PROMPT classification section** (Priority 2)
   - Allow inference from context
   - Add decision matrix
   - Clarify when to clarify

6. **Test**: Query "kids party tomorrow, cold weather"
   - Should show warm casual products
   - Should NOT ask "what type of clothing?"

### Day 1 or 2: Conversation Memory

7. **Add productsShownThisSession state** to App.tsx (Priority 3)
8. **Update handleSend** to track shown products (Priority 3)
9. **Update queryFin** to accept/use shown products (Priority 3)
10. **Update searchProducts** to exclude IDs (Priority 3)

11. **Test**: Query "casual jacket" then "show me more"
    - Second response should show DIFFERENT jackets

### Day 2: Refinements

12. **Add refinement intent type** (Priority 4)
13. **Add refinement detection to SYSTEM_PROMPT** (Priority 4)

14. **Test**: Query "casual jacket" then "something cheaper"
    - Should show lower-priced jackets from same category

### Day 2: AI Reasoning on Cards

15. **Attach card_reason to products** in handleSend (Priority 7)
    - Map product_insights to products by ID
    - Include card_reason in product data passed to cards

16. **Update ProductCard** to show AI reason (Priority 7)
    - When aiReasoningMode ON: show card_reason instead of rating/description
    - Style: 1-2 lines, conversational, specific to query

17. **Test**: Toggle "AI Reasoning on Cards" ON, query "casual jacket for work"
    - Cards should show brief contextual reason
    - NOT star ratings or generic description

### Day 2 (Optional): Page Context

18. **Add page context dropdown** to settings panel (Priority 8)
    - Options: Home Page, Category Page, Product Details Page
19. **Add product selector** shown only when PDP selected (Priority 8)
20. **Update queryFin** to pass page context to LLM (Priority 8)
21. **Add page context handling to SYSTEM_PROMPT** (Priority 8)

22. **Test**: Select "Product Details Page", pick a blue shirt, query "what pants would match?"
    - Should show pants that go with blue shirts
    - Should NOT ask "match with what?"

### Day 2: Cleanup

23. **Remove response fields from Stage 1 schema** (Priority 6)
24. **Run full test suite** (Section 6)
25. **Fix any regressions**

---

## 8. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Rerank+response too slow | Low | Medium | gpt-4o-mini is fast; monitor latency |
| Inference too aggressive (shows wrong products) | Medium | Low | Reranker will filter; graceful empty handling |
| Conversation memory breaks on refresh | Low | Low | localStorage already persists messages; add product IDs too |
| Refinement detection incorrect | Medium | Low | Falls back to new search; not catastrophic |

---

## 9. Success Metrics

### Quantitative

- **Test pass rate**: 10/10 Must Pass tests (Section 6)
- **Latency**: Total response time < 3 seconds
- **Hallucination rate**: 0% (response never mentions products not in carousel)

### Qualitative

- Response feels like talking to a knowledgeable sales assistant
- Follow-ups are contextual, not generic
- Products shown match the USE CASE, not just category

---

## 10. Appendix: Key Files Reference

| File | Key Sections |
|------|--------------|
| `src/services/openai.ts` | SYSTEM_PROMPT, RERANK_PROMPT, queryFin, rerankProducts |
| `src/services/productSearch.ts` | searchProducts, SearchOptions |
| `src/App.tsx` | handleSend, conversation state |
| `PRD.md` | Philosophy (lines 20-105), Success criteria (lines 85-93) |
| `PRD-carousel-logic.md` | Response quality guidelines (lines 264-370) |

---

## 11. Conclusion

The implementation has been failing because of two architectural mistakes:

1. **Response timing**: Generating response BEFORE products are selected causes hallucination
2. **Classification logic**: Requiring explicit keywords prevents inference

The fix is:
1. **Generate response AFTER selecting products** (Priority 1 — the key fix)
2. **Allow the LLM to infer categories from context** (Priority 2)
3. **Track conversation state for continuity** (Priorities 3-4)

**The LLM is capable of doing what we need.** We just need to give it the right information at the right time.
