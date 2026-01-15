export {
  configureOpenAI,
  isConfigured,
  queryFin,
  queryFinMock,
  type LLMIntent,
  type LLMDecision,
  type LLMProductSearch,
  type LLMReasoning,
  type LLMResponse,
  type ConversationMessage,
  type ConversationContext,
  type FinResponse,
  type IntentType,
  type RendererType,
} from './openai';

export {
  searchProducts,
  getSubcategories,
  getCatalogStats,
  clearCache,
  isCached,
  type SearchOptions,
  type SearchResult,
} from './productSearch';
