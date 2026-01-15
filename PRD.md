# E-commerce Carousel Decisioning Prototype
## Logic Testing + Messenger UI Variants

---

## Summary

Build an internal prototype to **test and iterate on the "when should Fin show product recommendations?" decision logic**, and to explore **card/carousel UI variants** inside a **pixel-perfect Messenger container**. 

The prototype uses an **LLM (OpenAI API)** to make real-time intent classification and rendering decisions—mirroring how the production system would work. A **debug panel** displays the LLM's reasoning, intent classification, and decision factors so we can understand *why* it chose a particular response format.

This prototype is a **behavior + UI sandbox** to converge on:
1. A v1 recommendation decision policy (what triggers cards/carousel vs text-only)
2. Rules for how many items to show and when
3. The v1 card layout and metadata configuration
4. Default vs Expanded messenger behavior

---

## Context: Why This Matters

Fin has been Intercom's AI support agent for years—trained to resolve issues, answer policy questions, and deflect tickets. Expanding into e-commerce recommendations represents a **fundamental behavior shift**:

| Support Agent Behavior | Sales/Recommendation Behavior |
|------------------------|------------------------------|
| Resolve issues | Inspire discovery |
| Be helpful, not pushy | Proactively suggest |
| Apologize when things go wrong | Highlight value and benefits |
| Answer precisely | Present options to choose from |
| Text-focused responses | Visual, browsable responses |

The challenge: Fin needs to **recognize when the user wants recommendations** (and show them compellingly) while **never showing products during support flows** (which feels jarring and tone-deaf).

We cannot design this logic in a document. We need to **prototype and test** across real query patterns to find the right decision boundaries.

---

## Problem

A product carousel is a compelling e-commerce affordance, but it becomes **jarring** if it appears in the wrong moments:

**Example of a false positive (BAD):**
> User: "I received my order last week and I'm having a problem with the furniture I bought. It is a wooden dining table, order number 45729, delivered on 15 September 2025. When I unpacked it, I noticed several issues. There is a deep scratch about 10 cm long on the tabletop that is clearly visible even after cleaning. One of the legs does not tighten properly..."
>
> ❌ Fin shows a carousel of table lamps

This is exactly what we must prevent. The user is filing a complaint—showing product recommendations here destroys trust.

**Example of a true positive (GOOD):**
> User: "I'm looking for a modern desk lamp"
>
> ✅ Fin shows 3-4 desk lamp options in a carousel with prices and ratings

We need a faster way than document-based ideation to:
- **Simulate decision behavior** across a wide range of queries and contexts
- **See the LLM's reasoning** for why it classified intent a certain way
- **Compare UI variants** (layouts, metadata density, card sizes)
- **Iterate quickly** through test cases and edge cases
- Produce an **implementable v1 policy** for ML/eng

---

## Goals

1. **Make "recommendation appropriateness" concrete** via an interactive input → LLM decision → rendered preview loop
2. **Show the LLM's reasoning** in a debug panel alongside the Messenger preview
3. **Render results inside pixel-perfect Messenger chrome** with Default and Expanded states
4. **Support configurable UI variants**: card metadata, layout (carousel/list/grid), item count
5. **Create a test harness**: seed dataset + regression set to catch decision failures
6. **Output a v1 decision policy** with examples and edge cases to hand to ML/eng

---

## Non-goals

- Shipping production carousel behavior or ML classifier
- Perfect product ranking/recommendations (we'll use mock data)
- Building customer-facing admin/settings
- Mobile SDK implementation (desktop Messenger simulation only)
- Real product catalog integration (static mock data is fine)

---

## Users

- **Design**: Iterate on decision rules and UI variants
- **PM/leadership**: Align on expected behavior, review edge cases
- **ML/eng**: Translate policy into implementation; use test suite for validation

---

## Key Questions This Prototype Must Answer

### Decision Logic Questions
1. When is a carousel/cards the right response vs text-only?
2. What are the "no-go" contexts where recommendations feel wrong?
3. How specific must a query be before we show products? (vs asking for clarification)
4. How many items should we show? When 1 vs 3 vs 5+?
5. Can we blend support resolution with follow-up recommendations?

### UI Questions
1. What metadata makes cards feel trustworthy and clickable?
2. When should we use carousel vs vertical list vs grid?
3. How does Expanded messenger state change the optimal layout?
4. What's the minimum viable card that still feels intentional?

---

## Product Behavior: Decision Model

### Core Principle: The LLM Makes the Call

The LLM (OpenAI API) evaluates each user message and decides:
1. **Intent classification**: Is this support, shopping/discovery, or ambiguous?
2. **Rendering decision**: Text-only, single card, or multi-item carousel/list/grid?
3. **Product search criteria**: What to look for in the catalog (if showing products)
4. **Item count**: How many products to show (if any)?
5. **Reasoning**: Why this classification and rendering choice?

This mirrors the production architecture where Fin's underlying model makes these decisions. The prototype lets us **tune the prompt/instructions** and **see the reasoning** to develop the right policy.

### Output Schema (Strict JSON)

```json
{
  "intent": {
    "primary": "shopping_discovery | support | ambiguous",
    "sub_type": "browsing | product_inquiry | comparison | null",
    "confidence": 0.0-1.0,
    "signals": ["list of detected signals"]
  },
  "decision": {
    "show_products": true | false,
    "renderer": "text_only | single_card | carousel | list | grid",
    "item_count": 0-6,
    "needs_clarification": true | false,
    "clarification_reason": "string | null"
  },
  "product_search": {
    "query": "natural language search query for catalog",
    "category": "lighting | furniture | clothing | electronics | food | beauty | sports | kids | pets | kitchen | garden | books | null",
    "subcategory": "string | null",
    "constraints": ["under $100", "modern style", "for women", etc.],
    "sort_by": "relevance | price_low | price_high | rating | newest"
  },
  "reasoning": {
    "intent_explanation": "Why this intent classification",
    "renderer_explanation": "Why this rendering choice", 
    "confidence_factors": ["What increased/decreased confidence"]
  },
  "response": {
    "message_text": "The conversational response text"
  }
}
```

**Key change:** The LLM outputs `product_search` criteria, NOT specific product IDs. A separate filter function searches the mock catalog with these criteria and returns matching products. This:
- Prevents the LLM from hallucinating product IDs
- Mirrors production (where you'd call a real recommendation API)
- Keeps the LLM focused on intent/decision, not product selection

### Product Selection Flow

```
User Query → LLM Decision → product_search criteria → Filter Function → Products → Render
```

1. LLM analyzes query and outputs decision + search criteria
2. Filter function runs against mock catalog:
   - Matches category/subcategory
   - Applies constraints (price, style, attributes)
   - Sorts by specified order
   - Returns top N items (based on `item_count`)
3. UI renders the returned products

**Filter function examples:**
```typescript
// LLM outputs: { category: "lighting", subcategory: "desk lamps", constraints: ["modern", "under $100"] }
// Filter returns: Products matching category + style + price constraint

// LLM outputs: { category: "food", constraints: ["vegan", "gluten-free"] }  
// Filter returns: Products with matching dietary attributes

// LLM outputs: { category: "clothing", constraints: ["women", "EU 38", "running"] }
// Filter returns: Products matching gender + size + activity
```

### Response Text Guidelines

The LLM generates `message_text` alongside the product decision. Guidelines for the system prompt:

**Rules for response text:**
- **1-2 sentences max** before showing products
- **Don't narrate** what you're showing ("Here are 3 lamps") — the cards speak for themselves
- **DO explain your selection** briefly ("These work well with dark wood" or "Range of prices for you")
- **For single card:** be specific about why this one ("This one's our most popular for small desks")
- **For clarification:** ask ONE question, offer 2-3 options inline ("What type of shoes? Running, casual, or dress?")
- **Never apologize** for showing products
- **Keep it tight** — the cards are the content; the text is connective tissue

**Examples:**

| Scenario | Good ✓ | Bad ✗ |
|----------|--------|-------|
| Showing 3 lamps | "These would complement a dark wood desk nicely:" | "Here are 3 modern desk lamps I found for you based on your request:" |
| Single recommendation | "This one's popular for home offices—great reviews on the dimmer." | "I recommend the Aurelia Task Lamp which has a rating of 4.7 stars." |
| Clarification | "Running, casual, or something dressier?" | "I'd be happy to help you find shoes! Could you please tell me what type of shoes you're looking for?" |

---

### Intent Classification

The LLM classifies user messages into one of three primary intents:

#### `shopping_discovery` — Show Products
User is looking to browse, discover, compare, or purchase products.

**Sub-types:**

| Sub-type | Description | Response Pattern |
|----------|-------------|------------------|
| `browsing` | Open-ended discovery | Carousel/grid with variety |
| `product_inquiry` | Question about a specific product | Single card + answer the question |
| `comparison` | Wants to compare options | 2-3 cards with comparison focus |

**Signals:**
- Explicit: "recommend", "show me", "looking for", "suggest", "what do you have"
- Comparative: "best", "top rated", "popular", "similar to", "alternatives"
- Purchase-adjacent: "how much is", "is X in stock", "different colors/sizes"
- Browsing: "what's new", "on sale", "under $X"

**Example queries → expected behavior:**
| Query | Intent | Sub-type | Show Products? | Item Count |
|-------|--------|----------|----------------|------------|
| "I'm looking for a modern desk lamp" | shopping_discovery | browsing | Yes, carousel | 3-4 |
| "Recommend me running shoes, EU 37, women's, for treadmill" | shopping_discovery | browsing | Yes, carousel | 3-4 |
| "What's your best selling coffee table?" | shopping_discovery | browsing | Yes, single card | 1 |
| "Show me something like the Reig lamp but cheaper" | shopping_discovery | comparison | Yes, carousel | 2-3 |
| "Is the Reig lamp dimmable?" | shopping_discovery | product_inquiry | Yes, single card | 1 |
| "What sizes does the Oak table come in?" | shopping_discovery | product_inquiry | Yes, single card | 1 |

#### `product_inquiry` — Special Handling

When the sub-type is `product_inquiry`:
- User is asking a **question about a specific product** (not complaining about it)
- Show a **single card** for the product being asked about
- **Answer the specific question** in `message_text`
- **Don't suggest alternatives** unless they ask

**Detection pattern:**
- Product name mentioned + question format
- No complaint language ("broken", "damaged", "problem")
- No ownership indicators ("my [product]" + issue)
- No order numbers

**Example:**
> "Is the Reig lamp dimmable?"
> → Single card for Reig lamp + text answering the question

**Contrast with support:**
> "My Reig lamp isn't dimming properly"
> → Support intent (ownership + problem implied)

#### `support` — Never Show Products
User is seeking help with an issue, asking about policy, or has a complaint.

**Signals:**
- Order issues: "my order", "tracking", "delivery", "didn't arrive", "wrong item"
- Complaints: "problem", "issue", "broken", "damaged", "scratch", "defective"
- Returns/refunds: "return", "refund", "exchange", "cancel"
- Policy: "shipping policy", "warranty", "how do I", "can I"
- Account: "password", "login", "account", "subscription"
- Frustration language: "frustrated", "disappointed", "unacceptable"

**Example queries → expected behavior:**
| Query | Intent | Show Products? | Why Not |
|-------|--------|----------------|---------|
| "I received my order and the table has a deep scratch" | support | ❌ No | Complaint flow |
| "Where is my order #45729?" | support | ❌ No | Order tracking |
| "Can I return this if it doesn't fit?" | support | ❌ No | Policy question |
| "The package was missing washers" | support | ❌ No | Complaint |
| "How do I reset my password?" | support | ❌ No | Account issue |
| "My Reig lamp isn't dimming properly" | support | ❌ No | Ownership + problem |

#### `ambiguous` — May Need Clarification
Intent is unclear; could be support or shopping depending on context.

**Example queries:**
| Query | Why Ambiguous | Action |
|-------|---------------|--------|
| "I need shoes" | Too vague to recommend | Ask clarifying question |
| "Tell me about the Reig lamp" | Could be pre-purchase research OR post-purchase question | Lean toward shopping_discovery with product card |
| "This isn't what I expected" | Complaint or seeking alternatives? | Lean toward support, ask what they need help with |

### Clarification Logic

**Core principle: Only clarify when truly necessary to make a useful recommendation.**

The LLM should ask for clarification **only when**:
- The query is so vague that any recommendation would be a guess
- Multiple product categories could apply and user hasn't indicated which

**Examples:**
| Query | Clarify? | Why |
|-------|----------|-----|
| "I need shoes" | Yes | No category, no constraints—recommendations would be random |
| "I need something for my living room" | Yes | Too broad—furniture? decor? lighting? |
| "Looking for a gift" | Yes | No indication of recipient, price range, or category |
| "I'm looking for a modern desk lamp" | **No** | Clear category + style preference—show options |
| "Running shoes for women" | **No** | Clear enough to show relevant products |
| "Something like the Reig but different" | **No** | Reference point exists—show alternatives |

**Anti-pattern to avoid:** Over-clarifying when the user has given enough context. If they said "modern desk lamp," don't ask about price range—just show a range of prices.

### Item Count Decision Logic

How many products to show depends on query specificity and confidence:

| Query Specificity | Confidence | Item Count | Rationale |
|-------------------|------------|------------|-----------|
| Very specific (brand + model + constraint) | High | 1 | "Best" or most relevant single item |
| Specific (clear category + 1-2 constraints) | High | 2-3 | Curated shortlist |
| Moderate (clear category, open to options) | Medium-High | 3-4 | Browsable set |
| Broad (general category, exploratory) | Medium | 4-5 | Discovery set |
| Very broad (needs more context) | Low | 0 | Clarify first |

**Examples:**
| Query | Specificity | Item Count |
|-------|-------------|------------|
| "Which one do you think is best for a dark wood desk?" | Very specific | 1 |
| "Show me modern desk lamps under $100" | Specific | 2-3 |
| "I'm looking for a modern desk lamp" | Moderate | 3-4 |
| "What desk lamps do you have?" | Broad | 4-5 |
| "I need a lamp" | Very broad | 0 (clarify) |

### Negative Signal Detection (Never Show Products)

Even if a query *could* be interpreted as shopping-related, the LLM should suppress product display when it detects:

1. **Active complaint signals**
   - Damage/defect language: "broken", "scratch", "defective", "missing parts"
   - Order problems: "wrong item", "didn't receive", "lost package"
   - Frustration indicators: "unacceptable", "disappointed", "third time"

2. **Support flow context**
   - User mentioned order number
   - User mentioned specific past purchase with a problem
   - Conversation history includes unresolved support issue

3. **Explicit rejection of sales**
   - "I don't want recommendations"
   - "Just help me with my issue"
   - User ignored previous product suggestions

4. **Sensitive contexts**
   - Refund/cancellation in progress
   - Account security issues
   - Legal/warranty disputes

### Support → Opportunity Transitions

After resolving a support issue, there *may* be an opportunity to offer relevant products. This requires careful handling:

**Acceptable transition pattern:**
1. Fully resolve the support issue first
2. Confirm resolution with user ("Is there anything else I can help with?")
3. If user seems satisfied AND products are naturally relevant, *optionally* offer
4. Frame as helpful, not pushy ("By the way, if you're looking for X, we have some great options")

**Never acceptable:**
- Showing products while support issue is unresolved
- Pivoting to sales after complaint without acknowledgment
- Recommending the same/similar product that had issues

**For v1 prototype:** Focus on clear-cut cases. Support = no products. Shopping = show products. We can explore transitions after establishing the core boundaries.

---

## Conversation Context

### How Conversation History Works

The prototype maintains conversation state and passes context to the LLM for multi-turn awareness.

#### Messages Passed to LLM

For v1, pass **all messages from current session** to the LLM. Conversations in the prototype won't be long enough to hit token limits. This gives the LLM full context for nuanced decisions.

```json
{
  "messages": [
    { "role": "user", "content": "I'm looking for a desk lamp" },
    { "role": "assistant", "content": "Here are some modern options:", "products_shown": ["light-001", "light-003"] },
    { "role": "user", "content": "Do you have anything cheaper?" }
  ]
}
```

#### Conversation Context Object

In addition to raw messages, compute and pass a structured context object:

```json
{
  "conversation_context": {
    "products_shown_this_session": ["light-001", "light-003", "light-005"],
    "products_clicked": ["light-001"],
    "turns_since_last_products": 0,
    "has_unresolved_support_issue": false,
    "user_rejected_recommendations": false,
    "clarification_given": true
  }
}
```

**Context signals the LLM should use:**

| Signal | Impact |
|--------|--------|
| `products_shown_this_session` | Avoid showing same products again; can reference "the ones I showed you" |
| `turns_since_last_products` | If many turns without products, maybe time to offer again |
| `has_unresolved_support_issue` | Strong signal to NOT show products |
| `user_rejected_recommendations` | Don't keep pushing products |
| `clarification_given` | User already clarified once—don't ask again |

#### Future Enhancement (v1.5)

If conversations get longer:
- Implement sliding window (last 6 turns verbatim)
- Add LLM-generated summary for older context: "Prior context: User asked about desk lamps, was shown 3 options, asked about pricing"

---

## Prototype Scope

### 1. Messenger UI Container

Render the preview inside a pixel-perfect Messenger simulation with **two states**:

#### Default State
- Standard Messenger width (~400px)
- Conversation thread with scrolling
- Product cards constrained to fit within message width
- Best for: Horizontal carousel, vertical list
- Cards may show 2 items with peek/scroll indicator

#### Expanded State  
- Wider Messenger (~700px+)
- More space for product display
- Supports grid layout (2x2 or 2x3)
- Product cards can be larger with more metadata
- Triggered by: User preference, message content, or card click

Both states include:
- Header (Fin branding, back arrow, menu, close)
- Thread (user bubbles in purple/blue, assistant messages in gray)
- Composer (text input, attachment, emoji, GIF, voice icons)
- Consistent Intercom visual language

### 2. Decision Debug Panel

A panel **outside the Messenger** showing the LLM's reasoning and performance:

```
┌─────────────────────────────────────────┐
│ DECISION DEBUG                          │
├─────────────────────────────────────────┤
│ Intent: shopping_discovery              │
│ Sub-type: browsing                      │
│ Confidence: 0.89                        │
│                                         │
│ Signals Detected:                       │
│ • "looking for" → discovery language    │
│ • "modern desk lamp" → product category │
│ • No support indicators                 │
│                                         │
│ Product Search:                         │
│ • Category: lighting                    │
│ • Subcategory: desk lamps               │
│ • Constraints: ["modern"]               │
│ • Results: 4 products matched           │
│                                         │
│ Rendering Decision: carousel            │
│ Item Count: 3                           │
│                                         │
│ Reasoning:                              │
│ "User expressed clear shopping intent   │
│ with category (desk lamp) and style     │
│ preference (modern). No constraints on  │
│ price/brand, so showing 3 options       │
│ across price range for discovery."      │
│                                         │
│ Negative Signals: None                  │
│ Clarification Needed: No                │
│                                         │
├─────────────────────────────────────────┤
│ ⏱ Performance                           │
│ Total: 847ms                            │
│ ├─ LLM decision: 612ms                  │
│ └─ Product search: 235ms                │
└─────────────────────────────────────────┘
```

This panel is critical for:
- Understanding *why* the LLM made a decision
- Identifying prompt improvements
- Building intuition for edge cases
- Documenting decision patterns for ML/eng
- **Assessing production feasibility** (is latency acceptable?)

### 3. Card/Carousel UI Configuration

The prototype supports configurable UI variants through toggles:

#### A. Card Content Mode (Key Decision)

This is a fundamental choice about where Fin's intelligence is expressed:

| Mode | Card Content | Chat Bubble | Philosophy |
|------|--------------|-------------|------------|
| **Standard Metadata** | Product DB data (price, rating, description) | AI reasoning ("The Edison is great for small spaces...") | AI narrates around products |
| **AI Reasoning** | AI-generated "why this matches" pitch | Simple intro ("Here are some desk lamps:") | AI annotates on products |

**AI Reasoning Mode (recommended for differentiation):**
- Card shows 2-3 line AI-generated pitch explaining WHY this product matches the user's query
- Minimal metadata: product name + price only
- Example: Instead of generic "Energy-efficient LED desk lamp with adjustable arm..." → "Modern iconic design that would complement your dark wood desk. Great reviews and energy efficient."

**Why this matters:**
- Generic metadata is just data retrieval—any search filter can do that
- The AI's unique value is **synthesis + reasoning**: understanding the user's needs and explaining why specific items match
- This is where Fin can differentiate from basic e-commerce filtering

**Implementation:**
- Toggle: "AI Reasoning on Cards" (on/off)
- When ON: LLM generates per-product reasoning based on user query context
- When OFF: Cards show standard DB metadata; reasoning appears in chat bubbles

#### B. Card Metadata Toggles (Standard Mode)

When AI Reasoning mode is OFF, these metadata elements can be toggled:

| Metadata | Toggle | Notes |
|----------|--------|-------|
| Product Image | Yes/No | Primary visual |
| Product Title | Yes/No | Always on for v1 |
| Price | Yes/No | — |
| Rating (stars + count) | Yes/No | e.g., ★4.5 (338) |
| Description | Yes/No | 1-2 line truncated snippet |
| Variant indicator | Yes/No | e.g., "3 colors available" |
| Promo badge | Yes/No | e.g., "Sale", "Selling Fast", "New" |
| Add to Cart CTA | Yes/No | Button in card |
| View Details CTA (large) | Yes/No | Full-width button |
| View Details CTA (compact) | Yes/No | Icon/link style |

*Note: When AI Reasoning mode is ON, most metadata toggles are disabled—cards show only image, AI pitch, name, and price.*

#### D. Layout Options

| Layout | Description | Best For |
|--------|-------------|----------|
| **Carousel** | Horizontal scroll, 2 cards visible + peek | Default state, browsing |
| **Vertical List** | Stacked cards with thumbnail + details | Default state, comparison |
| **Grid** | 2-column grid, multiple rows visible | Expanded state, discovery |

#### E. Messenger State

| State | Width | Layouts Available |
|-------|-------|-------------------|
| Default | ~400px | Carousel, Vertical List |
| Expanded | ~700px+ | Carousel, Vertical List, Grid |

#### Future Consideration (Post-v1)
- **Price badge placement**: Overlay on image vs. inline with other metadata
- Ensure architecture supports this flexibility even if not exposed in v1 UI

### 4. Prompt Playground

Controls for tuning the LLM decision logic:

- **System prompt editor**: Full text editing of the system prompt
- **Policy rules field**: Additional structured rules (e.g., "Never show products if order number mentioned")
- **Model selector**: GPT-4, GPT-4-turbo, GPT-3.5-turbo
- **Temperature control**: 0.0 - 1.0
- **Run button**: Execute and see results
- **Save version**: Snapshot prompt version for comparison
- **Compare versions**: Side-by-side results across test set

### 5. Test Harness

#### Seed Dataset (~60-100 queries)
Categorized by expected behavior:

**Shopping/Discovery (expect products):**
- Direct requests: "Show me...", "Recommend...", "I'm looking for..."
- Comparisons: "What's better...", "Similar to...", "Cheaper than..."
- Browse: "What's new", "Best sellers", "On sale"
- Product inquiries: "Is X dimmable?", "What sizes does Y come in?"

**Support (never show products):**
- Complaints: Damage, missing items, wrong order
- Order tracking: "Where is my order?"
- Policy: Returns, refunds, shipping, warranty
- Account: Login, password, billing

**Ambiguous (test clarification logic):**
- Vague: "I need shoes", "Something for my kitchen"
- Could-be-either: "Tell me about [product]", "Is this good?"

**Edge Cases (critical for false positive prevention):**
- Long complaint with product names mentioned
- Support question that includes price/product references
- Post-purchase question that isn't a complaint
- Product inquiry vs. ownership complaint distinction

#### Golden 20 Regression Set
Must-pass queries that catch regressions:
- 10 clear shopping queries → must show products
- 5 clear support queries → must NOT show products  
- 5 tricky edge cases → must handle correctly

Each test records:
- Input query
- Expected decision (show_products, renderer, item_count)
- Actual decision
- Pass/Fail
- Notes
- **Latency** (for performance tracking)

### 6. Context Simulation Toggles

Simulate contextual signals that affect decisions:

| Context | Options | Impact |
|---------|---------|--------|
| Page context | Home, Collection, Search, PDP, Cart, Checkout | Higher confidence on collection/PDP |
| Product in view | Yes/No | May enable "similar items" suggestions |
| Cart status | Empty, Has items | May affect recommendations |
| User status | Anonymous, Logged in | Personalization potential |
| Conversation history | Clean, Has support issue, Has previous recs | Affects negative signals |

### 7. Logging

Persist per-run data for analysis:
- Timestamp
- Input message + context toggles
- Prompt version / model / temperature
- Full JSON decision output
- Product search criteria + results count
- Chosen UI variant configuration
- **Response latency** (total, LLM, search)
- Manual notes/tags

---

## UI Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              HEADER / NAV                                │
├──────────────────┬───────────────────────┬───────────────────────────────┤
│                  │                       │                               │
│  INPUT PANEL     │   DEBUG PANEL         │   MESSENGER PREVIEW           │
│                  │                       │                               │
│  ┌────────────┐  │  Intent: shopping     │   ┌─────────────────────┐     │
│  │ User query │  │  Sub-type: browsing   │   │      Fin Header     │     │
│  │            │  │  Confidence: 0.89     │   ├─────────────────────┤     │
│  └────────────┘  │                       │   │                     │     │
│                  │  Product Search:      │   │   Conversation      │     │
│  Context:        │  • lighting/desk lamp │   │   Thread            │     │
│  ○ Page: [PDP▼]  │  • ["modern"]         │   │                     │     │
│  ○ Cart: [No ▼]  │                       │   │   ┌─────┐ ┌─────┐   │     │
│  ○ User: [Anon▼] │  Rendering: carousel  │   │   │Card │ │Card │   │     │
│                  │  Items: 3             │   │   └─────┘ └─────┘   │     │
│  ──────────────  │                       │   │                     │     │
│                  │  ⏱ 847ms (LLM: 612)   │   │   Do any catch...   │     │
│  UI Config:      │                       │   ├─────────────────────┤     │
│  ☑ Image         │  Reasoning:           │   │   Composer          │     │
│  ☑ Price         │  "User expressed      │   └─────────────────────┘     │
│  ☑ Rating        │   clear shopping      │                               │
│  ☐ Description   │   intent..."          │   [Default] [Expanded]        │
│  Layout: [Carousel▼]                     │                               │
│                  │                       │                               │
│  [Run Query]     │                       │                               │
│                  │                       │                               │
├──────────────────┴───────────────────────┴───────────────────────────────┤
│                           TEST HARNESS / RESULTS                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Query                          │ Expected │ Actual  │ Time │ Status│  │
│  │ "I'm looking for a desk lamp"  │ carousel │ carousel│ 847ms│ ✓ Pass│  │
│  │ "My order has a scratch"       │ text     │ text    │ 523ms│ ✓ Pass│  │
│  │ "I need shoes"                 │ clarify  │ carousel│ 634ms│ ✗ Fail│  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Deliverables

1. **Working prototype** (internal shareable URL)
2. **v1 decision policy document**: Rules + examples + "never show products here" list
3. **Recommended v1 card configuration** + deferred variants list
4. **Seed test set + Golden 20 regression set** with documented expected behaviors

---

## Open Questions (Track Explicitly)

### Decision Logic
- [x] ~~How do we handle "product question that isn't a complaint"?~~ → `product_inquiry` sub-type
- [ ] What's the right confidence threshold for showing products vs. clarifying?
- [ ] Should we ever show products after resolving support, or is that v2?

### UI/UX
- [ ] What metadata is reliably available across customer product catalogs?
- [ ] Does the production Messenger support Expanded state, or is that a prototype-only concept?
- [ ] What's the max reasonable item count before it feels overwhelming?

### Technical
- [ ] What latency is acceptable for the LLM decision call in production?
- [ ] How will the carousel block be rendered in the actual Messenger pipeline?

### Future (v1.5)
- [ ] Multi-turn test scenarios (conversation arrays, not just single queries)
- [ ] Conversation summarization for long sessions
- [ ] A/B comparison of prompt versions across full test set

---

## Technical Approach

### Recommended Stack

**Frontend: Vite + React + TypeScript**
- Faster dev iteration than Next.js for a prototype
- No SSR complexity needed—this is a client-side testing tool
- Hot reload for rapid UI iteration

**Styling: Tailwind CSS + shadcn/ui**
- Utility-first for quick iteration on card variants
- [shadcn/ui](https://ui.shadcn.com/) for standard UI components (buttons, toggles, cards, inputs)
- Custom components for Messenger chrome and ProductCard (pixel-perfect Intercom replica)
- Easy to match Intercom's design tokens

**LLM Integration: OpenAI API**
- Direct API calls for decision logic
- Structured output (JSON mode) for reliable parsing
- Multiple model options for comparison

**State/Storage: localStorage + JSON export**
- Prompt versions saved locally
- Test results exportable as JSON
- No backend needed for v1

**Testing: Vitest**
- Unit tests for decision parsing
- Snapshot tests for UI variants

### Key Technical Decisions

1. **LLM does the real work**: The prompt engineering is the product. The UI is the viewport into the LLM's decisions.

2. **Separation of concerns**: LLM outputs search criteria → Filter function finds products. This prevents hallucinated product IDs and mirrors production architecture.

3. **Modular card renderer**: Build the card component to accept a configuration object, not hardcoded variants. This enables rapid toggling.

4. **Decision schema is the contract**: The JSON schema above is the interface between prompt tuning and UI rendering. Keep it stable.

5. **Mock product catalog**: 100+ products across 12 diverse categories. Rich enough metadata to test all card fields and decision scenarios (dietary, sizing, compatibility, etc.).

---

## Example Test Scenarios

### Scenario 1: Clear Shopping Intent
**Input:** "I'm looking for a modern desk lamp"
**Expected:**
- Intent: shopping_discovery (0.9+ confidence)
- Sub-type: browsing
- Renderer: carousel
- Items: 3-4
- Product search: { category: "lighting", subcategory: "desk lamps", constraints: ["modern"] }
- No clarification needed

### Scenario 2: Clear Support Intent
**Input:** "I received my order last week and the table has a deep scratch. Order #45729."
**Expected:**
- Intent: support (0.95+ confidence)
- Renderer: text_only
- Items: 0
- Negative signals: complaint language, order number, damage description

### Scenario 3: Vague Query (Needs Clarification)
**Input:** "I need shoes"
**Expected:**
- Intent: ambiguous (0.5 confidence)
- Renderer: text_only
- needs_clarification: true
- Clarification: "Running, casual, or something dressier?"

### Scenario 4: Single Item Response
**Input:** "Which desk lamp do you think would look best on a dark wood desk?"
**Expected:**
- Intent: shopping_discovery (0.85 confidence)
- Sub-type: browsing
- Renderer: single_card
- Items: 1
- Reasoning: User asked for a specific recommendation ("which one"), not options to browse

### Scenario 5: False Positive Prevention
**Input:** "The lamp I ordered came with a broken shade. The Reig glass table lamp, order from last week."
**Expected:**
- Intent: support (0.95 confidence)
- Renderer: text_only
- Items: 0
- Reasoning: Despite product name mentioned, this is a complaint about a specific order

### Scenario 6: Product Inquiry (New)
**Input:** "Is the Reig lamp dimmable?"
**Expected:**
- Intent: shopping_discovery (0.85 confidence)
- Sub-type: product_inquiry
- Renderer: single_card
- Items: 1
- Product search: { query: "Reig lamp" }
- Message text should answer the dimming question + show the product card

### Scenario 7: Product Inquiry vs Support Distinction
**Input:** "My Reig lamp isn't dimming properly"
**Expected:**
- Intent: support (0.9 confidence)
- Renderer: text_only
- Items: 0
- Reasoning: "My" + product + problem = ownership complaint, not pre-purchase inquiry

---

## Success Criteria

The prototype is successful when we can:

1. **Reliably distinguish** shopping intent from support intent across 50+ test queries
2. **Explain** the decision logic through visible LLM reasoning
3. **Prevent false positives**: Zero product carousels shown during clear support/complaint flows
4. **Handle product inquiries correctly**: Show single card + answer the question
5. **Configure and compare** card UI variants rapidly
6. **Track latency** to assess production feasibility
7. **Document** a v1 policy that ML/eng can implement with clear examples

---

## Appendix: Design Reference Notes

### Card Layouts Observed in Mockups

**Carousel (Default messenger):**
- 2 cards visible with horizontal scroll
- Right arrow indicator for more items
- Cards ~180px wide

**Vertical List (Default messenger):**
- Thumbnail left, details right
- Full width of message area
- 3 items visible without scroll

**Grid (Expanded messenger):**
- 2-3 columns
- 2 rows visible (4-6 items)
- Larger card format with more metadata

### Metadata Configurations Observed

**Minimal:**
- Image, Title, Price (overlay)

**Standard:**
- Image, Title, Price, Rating, short description

**Rich:**
- Image, Title, Price, Rating, Description, "View details" CTA

### Messenger Chrome Elements

- Back arrow (left)
- Intercom asterisk logo
- "Fin" title
- Menu dots (right)
- Close X (right)
- Gray/cream background (#f7f7f2 or similar)
- Purple/blue user message bubbles
- Gray assistant message bubbles
- Bottom composer with attachment, emoji, GIF, voice icons
- Send button (arrow)

---

## Appendix: Implementation Milestones

Incremental build plan with testable checkpoints. Each milestone is verified before proceeding.

### Milestone 1: Project Foundation ✅
- [x] Vite + React 19 + TypeScript
- [x] Tailwind CSS with Intercom-inspired color tokens
- [x] Project structure: `src/components`, `src/data`, `src/hooks`, `src/types`, `src/utils`
- [x] Dev server running at localhost:5173

### Milestone 2: Mock Product Data ✅
- [x] TypeScript types for `Product`, `CardConfig`, `ProductAttributes`
- [x] 102 products across 12 diverse categories
- [x] Category-specific attributes (dietary, skin type, pet type, age range, etc.)
- [x] Helper functions: `searchProducts`, `getProductsByCategory`, `getProductsByDietary`, etc.

### Milestone 3: Messenger Chrome ✅
- [x] `MessengerHeader` — Logo, title, back/menu/close controls
- [x] `MessengerComposer` — Input field, action icons (attach, emoji, GIF, mic), send button
- [x] `MessengerThread` — Scrollable message container
- [x] `Messenger` — Combined shell with Default (400px) and Expanded (700px) states
- [x] Smooth animated transitions between states

### Milestone 4: Product Card Component 🔄
- [ ] Single `ProductCard` component with all metadata fields
- [ ] Accepts `CardConfig` for toggling visibility of each field
- [ ] Supports: image, title, price, originalPrice, rating, description, variants, badges, CTAs
- [ ] Responsive sizing for different layouts

### Milestone 5: Layout Components
- [ ] `CarouselLayout` — Horizontal scroll, 2 cards visible + peek indicator
- [ ] `ListLayout` — Vertical stack with thumbnail + details
- [ ] `GridLayout` — 2-column grid for expanded state
- [ ] Navigation controls (arrows, dots) where appropriate

### Milestone 6: Message Thread ✅
- [x] `UserMessage` — Purple/blue bubble, right-aligned
- [x] `AgentMessage` — Gray bubble with Fin avatar, left-aligned, can contain cards/carousel
- [x] `MessageBubble` — Component that renders appropriate bubble based on message role
- [x] `TypingIndicator` — Animated dots shown when agent is "thinking"
- [x] `EmptyState` — Welcome message shown when no messages
- [x] Auto-scroll to latest message
- [x] Message types with full TypeScript support
- [x] Demo conversation with product recommendations
- [ ] Message list with proper spacing and scroll behavior
- [ ] Typing indicator (optional)

### Milestone 7: OpenAI Integration ✅
- [x] API client for OpenAI with structured JSON output
- [x] System prompt with decision logic and response guidelines
- [x] Parse and validate response against schema
- [x] Product search function that filters mock catalog based on LLM criteria
- [x] Error handling and loading states
- [x] Mock mode for development without API key
- [x] Toggle between Mock and LLM modes in UI

### Milestone 8: Debug Panel
- [ ] Display intent classification, confidence, signals
- [ ] Show product search criteria and results count
- [ ] Display LLM reasoning text
- [ ] Latency breakdown (total, LLM, search)
- [ ] Collapsible sections for cleaner view

### Milestone 9: Input Panel + UI Config
- [ ] Query input text area
- [ ] Context simulation toggles (page, cart, user status)
- [ ] Card metadata toggles (image, price, rating, etc.)
- [ ] Layout selector (carousel, list, grid)
- [ ] Messenger state toggle (default/expanded)
- [ ] "Run Query" button

### Milestone 10: Test Harness
- [ ] Test case data structure with expected outcomes
- [ ] Seed dataset (~60-100 queries across categories)
- [ ] Golden 20 regression set
- [ ] Run tests and display pass/fail results
- [ ] Track latency per test
- [ ] Export results as JSON

### Future Enhancements (Post-v1)
- [ ] Multi-turn conversation test scenarios
- [ ] Prompt version comparison (side-by-side)
- [ ] Conversation history summarization
- [ ] Price badge placement toggle (overlay vs inline)
- [ ] Import/export test sets for team sharing
