/**
 * Demo Mode Query Service
 * 
 * Uses the curated local catalog + a lightweight LLM prompt for fast,
 * controlled demos. No external database or HuggingFace fetches.
 * 
 * Architecture:
 *  1. User sends a message
 *  2. Lightweight GPT-4o call classifies intent + picks products from local catalog
 *  3. Returns FinResponse instantly (no 20s search delays)
 */

import { Product } from '../types/product';
import { searchDemoCatalog, getDemoProductById } from '../data/catalog';
import {
  FinResponse,
  LLMResponse,
  ConversationMessage,
  ConversationContext,
  SessionStateUpdate,
  SuggestedFollowUp,
  isConfigured,
} from './openai';

// ─── Demo System Prompt ──────────────────────────────────────────────────────

const DEMO_SYSTEM_PROMPT = `You are Fin, a smart shopping assistant.

## Catalog

You serve THREE stores depending on what the user asks about. Each query typically stays within ONE vertical:

### GYMSHARK — Tops & Tees (portrait images)
gs-1: Power T-Shirt $36 (oversized, sweat-wicking, lifting)
gs-2: Crest T-Shirt $22 (regular fit, everyday, cotton blend)
gs-3: Crest Oversized T-Shirt $26 (oversized, dropped shoulders)
gs-4: Legacy T-Shirt $28 (slim fit, tailored, breathable)
gs-5: Geo Seamless T-Shirt $36 (slim, seamless knit, ventilation)
gs-6: Oversized Performance T-Shirt $26 (mesh back, cardio)
gs-7: Lightweight Seamless T-Shirt $30 (ultra-light, stripe texture)
gs-8: Arrival T-Shirt $25 (regular fit, clean design)
gs-9: Critical Drop Arm Tank $24 (slim, deep armholes, arms day)
gs-10: Conditioning Club Oversized Tee $30 (heavyweight, graphic)

### TRAINERS — Multi-brand (square images)
tr-1: Nike Dunk Low Retro $120 (court classic, leather, colour-blocking)
tr-2: Nike Air Force 1 '07 $115 (the icon, full-grain leather, Air cushioning)
tr-3: Adidas Samba OG $110 (indoor football heritage, leather, gum sole)
tr-4: Adidas Gazelle $100 (1966 original, suede, herringbone outsole)
tr-5: New Balance 550 $110 (basketball-inspired, leather, court-to-street)
tr-6: New Balance 530 $110 (retro runner, ABZORB, silver accents)
tr-7: Nike Air Max 90 $130 (visible Air unit, layered upper, 1990 icon)
tr-8: Adidas Spezial $100 (handball heritage, slim suede, terrace favourite)
tr-9: New Balance 9060 $160 (futuristic, SBS cushioning, premium)
tr-10: Nike Cortez $90 (original Nike runner, leather, since 1972)

### KAVE HOME — Sofas (landscape images)
sofa-1: Alba 3-Seater Sofa $2199 (bouclé, curved, feather-down)
sofa-2: Harlow Modular Corner Sofa $3499 (L-shaped, chenille, modular)
sofa-3: Oslo 2-Seater Sofa $1599 (compact, Scandi, walnut legs)
sofa-4: Finley Chaise Sofa $2799 (chaise end, pocket-sprung)
sofa-5: Mila Compact Sofa $1299 (apartment-sized, removable covers)
sofa-6: Neva Velvet 3-Seater $2499 (velvet, rolled arms, brass legs)
sofa-7: Strand Leather Sofa $3199 (Italian leather, hardwood frame)
sofa-8: Camden Linen Sofa $1899 (relaxed linen, deep seats)
sofa-9: Kensington 4-Seater $3899 (grand, button tufting, feather-filled)
sofa-10: Luna Bouclé Sofa $2099 (curved, low profile, bouclé)

## Output JSON

{
  "intent": "shopping" | "support" | "clarify" | "product_detail" | "add_to_cart" | "refine",
  "response_text": "2-3 sentences max",
  "show_products": true | false,
  "product_ids": ["gs-1", "nb-3", ...],
  "renderer": "carousel" | "single_card" | "text_only",
  "follow_ups": [{"label": "Short label", "query": "What user would say"}],
  "card_reasons": {"gs-1": "10-15 word reason"},
  "session_update": {"mode": "neutral" | "shopping" | "support", "context": "brief"}
}

## Rules

1. Stay within ONE vertical per response — don't mix sofas with trainers
2. For broad category queries ("show me gym tees"), show 6-8 products
3. For specific queries ("tell me about the 530"), show 1 product as single_card
4. Keep responses SHORT — 2-3 sentences. Cards do the selling.
5. card_reasons: unique per product, what makes THIS one different from the others shown
6. For product_detail intent, show 1 product as single_card
7. For add_to_cart, acknowledge and confirm, set show_products to false
8. follow_ups: 2-3 options that make sense as next steps
9. For refine: user wants to adjust previous results ("something cheaper", "oversized fit")
10. If user asks about a product by name, FIND the matching ID and show it`;

// ─── Demo Query Function ─────────────────────────────────────────────────────

interface DemoLLMResponse {
  intent: string;
  response_text: string;
  show_products: boolean;
  product_ids: string[];
  renderer: string;
  follow_ups: { label: string; query: string }[];
  card_reasons?: Record<string, string>;
  session_update: {
    mode: string;
    context: string;
  };
}

export async function queryFinDemo(
  userMessage: string,
  conversationHistory: ConversationMessage[] = [],
  _context: ConversationContext = {}
): Promise<FinResponse> {
  const startTime = performance.now();

  // Build messages for lightweight LLM call
  const messages = [
    { role: 'system' as const, content: DEMO_SYSTEM_PROMPT },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  let demoResponse: DemoLLMResponse;

  if (isConfigured()) {
    try {
      console.log('[DemoMode] Calling LLM for intent classification...');
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Fast + cheap for demo classification
          messages,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error('API error: ' + await response.text());
      }

      const data = await response.json();
      const llmTime = performance.now();
      console.log(`[DemoMode] LLM response in ${(llmTime - startTime).toFixed(0)}ms`);
      
      demoResponse = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('[DemoMode] LLM error, falling back to local search:', error);
      demoResponse = localFallback(userMessage);
    }
  } else {
    // No API key — use local keyword matching
    console.log('[DemoMode] No API key, using local fallback');
    demoResponse = localFallback(userMessage);
  }

  const llmEndTime = performance.now();

  // Resolve product IDs to actual products
  let products: Product[] = [];
  if (demoResponse.show_products && demoResponse.product_ids.length > 0) {
    products = demoResponse.product_ids
      .map(id => getDemoProductById(id))
      .filter((p): p is Product => p !== undefined);

    // Attach card_reasons as aiReasoning
    if (demoResponse.card_reasons) {
      products = products.map(p => {
        const reason = demoResponse.card_reasons?.[p.id];
        return reason ? { ...p, aiReasoning: reason } : p;
      });
    }
  }

  // If LLM returned IDs we don't have, try local search as fallback
  if (demoResponse.show_products && products.length === 0) {
    console.warn('[DemoMode] No products resolved from LLM IDs, trying local search');
    products = searchDemoCatalog(userMessage, 6);
  }

  const endTime = performance.now();

  // Map to FinResponse format
  const intentMap: Record<string, string> = {
    shopping: 'shopping_discovery',
    support: 'support',
    clarify: 'ambiguous',
    product_detail: 'shopping_discovery',
    add_to_cart: 'shopping_discovery',
    refine: 'refinement',
  };

  const llmResponse: LLMResponse = {
    intent: {
      primary: (intentMap[demoResponse.intent] || 'shopping_discovery') as any,
      confidence: 0.95,
      signals: ['demo_mode', demoResponse.intent],
    },
    decision: {
      show_products: products.length > 0,
      renderer: (demoResponse.renderer || 'carousel') as any,
      item_count: products.length,
      needs_clarification: demoResponse.intent === 'clarify',
    },
    product_search: products.length > 0 ? {
      query: userMessage,
      subcategory: undefined,
    } : null,
    understood_intent: {
      explicit_need: userMessage,
      implicit_constraints: [],
      inferred_context: 'demo mode',
      decision_stage: 'exploring',
    },
    response: {
      reasoning: demoResponse.response_text,
      follow_up_question: '',
    },
    suggested_follow_ups: (demoResponse.follow_ups || []).map(f => ({
      label: f.label,
      query: f.query,
    })),
    reasoning: {
      intent_explanation: `Demo mode: ${demoResponse.intent}`,
      selection_reasoning: `Selected ${products.length} products from local catalog`,
    },
    session_state_update: {
      conversationMode: (demoResponse.session_update?.mode || 'shopping') as any,
      supportContext: demoResponse.intent === 'support' ? {
        issueType: 'general',
        resolved: false,
      } : null,
      shoppingContext: demoResponse.intent !== 'support' ? {
        subcategory: '',
        query: userMessage,
        constraints: [],
      } : null,
    },
  };

  const sessionStateUpdate: SessionStateUpdate = llmResponse.session_state_update;

  const suggestedFollowUps: SuggestedFollowUp[] = llmResponse.suggested_follow_ups;

  return {
    llmResponse,
    products,
    suggestedFollowUps,
    responseText: demoResponse.response_text,
    latency: {
      total: endTime - startTime,
      llm: llmEndTime - startTime,
      search: endTime - llmEndTime,
    },
    sessionStateUpdate,
  };
}

// ─── Local Fallback (No API Key) ─────────────────────────────────────────────

function localFallback(userMessage: string): DemoLLMResponse {
  const q = userMessage.toLowerCase();

  // Support detection
  const supportWords = ['return', 'refund', 'order', 'tracking', 'broken', 'wrong', 'delivery'];
  if (supportWords.some(w => q.includes(w))) {
    return {
      intent: 'support',
      response_text: "I can help with that! Could you share your order number so I can look into this for you?",
      show_products: false,
      product_ids: [],
      renderer: 'text_only',
      follow_ups: [
        { label: 'Track my order', query: 'Where is my order?' },
        { label: 'Start a return', query: 'I want to return an item' },
      ],
      session_update: { mode: 'support', context: 'support inquiry' },
    };
  }

  // Try local search
  const results = searchDemoCatalog(userMessage, 6);
  
  if (results.length > 0) {
    const brand = results[0].brand;
    const subcat = results[0].subcategory;
    return {
      intent: 'shopping',
      response_text: `Here are some ${subcat} from ${brand} that match what you're looking for.`,
      show_products: true,
      product_ids: results.map(p => p.id),
      renderer: results.length === 1 ? 'single_card' : 'carousel',
      follow_ups: [
        { label: 'Tell me more', query: `Tell me more about the ${results[0].name}` },
        { label: 'Something different', query: `Show me different ${subcat}` },
      ],
      session_update: { mode: 'shopping', context: `${brand} ${subcat}` },
    };
  }

  // Nothing matched — clarify
  return {
    intent: 'clarify',
    response_text: "I can help you find what you need! Are you looking for gym tops, trainers, or sofas?",
    show_products: false,
    product_ids: [],
    renderer: 'text_only',
    follow_ups: [
      { label: 'Gymshark tops', query: 'Show me Gymshark t-shirts' },
      { label: 'Trainers', query: 'Show me trainers' },
      { label: 'Sofas', query: 'Show me sofas' },
    ],
    session_update: { mode: 'neutral', context: '' },
  };
}
