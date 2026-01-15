import { Product, CardLayout } from './product';

// Intent classification from LLM
export type IntentType = 'shopping_discovery' | 'support' | 'ambiguous';

// Renderer decision from LLM
export type RendererType = 'text_only' | 'single_card' | 'carousel' | 'list' | 'grid';

// LLM decision output schema
export interface LLMDecision {
  intent: {
    primary: IntentType;
    confidence: number; // 0-1
    signals: string[];
  };
  decision: {
    show_products: boolean;
    renderer: RendererType;
    item_count: number;
    needs_clarification: boolean;
    clarification_reason?: string;
  };
  reasoning: {
    intent_rationale: string;
    product_rationale: string;
    negative_signals: string[];
  };
  product_search?: {
    query?: string;
    category?: string;
    filters?: Record<string, string | number | boolean>;
    limit?: number;
  };
}

// Base message interface
export interface BaseMessage {
  id: string;
  timestamp: Date;
}

// User message (query)
export interface UserMessage extends BaseMessage {
  role: 'user';
  content: string;
}

// Agent message (response with optional products)
export interface AgentMessage extends BaseMessage {
  role: 'agent';
  content: string;
  products?: Product[];
  layout?: CardLayout;
  llmDecision?: LLMDecision;
  latencyMs?: number;
}

// Union type for all messages
export type Message = UserMessage | AgentMessage;

// Conversation state
export interface Conversation {
  messages: Message[];
  isLoading: boolean;
  error?: string;
}

// Helper to create a user message
export function createUserMessage(content: string): UserMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: new Date(),
  };
}

// Helper to create an agent message
export function createAgentMessage(
  content: string,
  options?: {
    products?: Product[];
    layout?: CardLayout;
    llmDecision?: LLMDecision;
    latencyMs?: number;
  }
): AgentMessage {
  return {
    id: crypto.randomUUID(),
    role: 'agent',
    content,
    timestamp: new Date(),
    ...options,
  };
}
