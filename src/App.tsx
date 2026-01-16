import { useState, useCallback, useRef, useEffect } from 'react';
import { Messenger } from './components/messenger';
import { CardConfig, DEFAULT_CARD_CONFIG, CardLayout, MessengerState, Product } from './types/product';
import { Message, createUserMessage, createAgentMessage, LLMDecision } from './types/message';
import { getAllProducts } from './data/products';
import {
  queryFinMock,
  queryFin,
  isConfigured,
  ConversationMessage,
  FinResponse,
  searchProducts,
  isCached,
  SearchResult,
  SessionState,
} from './services';

// shadcn/ui components
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import { Separator } from './components/ui/separator';
import { Input } from './components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';

// LocalStorage key for persisting conversation
const CONVERSATION_STORAGE_KEY = 'fin-ecommerce-conversation';

// Helper to create demo conversation with products
function createDemoConversation(products: Product[]): Message[] {
  // Get jackets for the first query
  const jackets = products.filter(p => p.subcategory === 'jackets').slice(0, 5);
  // Get dresses for variety
  const dresses = products.filter(p => p.subcategory === 'dresses').slice(0, 4);

  return [
    createUserMessage("I'm looking for a nice winter jacket"),
    createAgentMessage(
      "Here are some great jacket options for you:",
      {
        products: jackets.length > 0 ? jackets : products.slice(0, 5),
        layout: 'carousel',
      }
    ),
    createUserMessage("These look great! Do you have any dresses?"),
    createAgentMessage(
      "Of course! Here are some stylish dresses:",
      {
        products: dresses.length > 0 ? dresses : products.slice(15, 19),
        layout: 'carousel',
      }
    ),
  ];
}

// Helper to save conversation to localStorage
function saveConversation(messages: Message[]) {
  try {
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.warn('Failed to save conversation:', e);
  }
}

// Helper to load conversation from localStorage
function loadConversation(): Message[] | null {
  try {
    const saved = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load conversation:', e);
  }
  return null;
}

// Helper to clear saved conversation
function clearSavedConversation() {
  try {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear conversation:', e);
  }
}

function App() {
  const [messengerState, setMessengerState] = useState<MessengerState>('default');
  const [cardLayout, setCardLayout] = useState<CardLayout>('carousel');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiReasoningMode, setAiReasoningMode] = useState(false);
  const [cardConfig, setCardConfig] = useState<CardConfig>({
    ...DEFAULT_CARD_CONFIG,
    showViewDetailsLarge: false,
  });
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // LLM Integration state
  const [lastResponse, setLastResponse] = useState<FinResponse | null>(null);
  const conversationHistoryRef = useRef<ConversationMessage[]>([]);
  const llmConfigured = isConfigured();
  
  // Session state: tracks conversation mode, support context, shopping context
  // This is the key for intelligent conversation handling
  const [sessionState, setSessionState] = useState<SessionState>({
    conversationMode: 'neutral',
    productsShownThisSession: [],
  });
  
  // Page context: simulate which page user is on (affects query interpretation)
  const [pageContext, setPageContext] = useState<'home' | 'category' | 'product'>('home');
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Product preview state (using subcategory since all products are 'clothing')
  const [previewSubcategory, setPreviewSubcategory] = useState<string>('');

  // Live search state (on-demand HuggingFace)
  const [liveSearchQuery, setLiveSearchQuery] = useState('');
  const [liveSearching, setLiveSearching] = useState(false);
  const [lastSearchResult, setLastSearchResult] = useState<SearchResult | null>(null);

  // Load products and restore conversation on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const products = await getAllProducts();
        setAllProducts(products);
        
        // Try to restore saved conversation, otherwise start empty
        const savedConversation = loadConversation();
        if (savedConversation && savedConversation.length > 0) {
          setMessages(savedConversation);
        }
        // Otherwise messages stay empty (user can load demo)
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Persist conversation whenever it changes
  useEffect(() => {
    // Don't save during initial load
    if (!productsLoading) {
      saveConversation(messages);
    }
  }, [messages, productsLoading]);

  // Handle sending a new message - uses LLM if configured, otherwise mock
  const handleSend = useCallback(async (content: string) => {
    // Add user message
    const userMsg = createUserMessage(content);
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build conversation history from messages
      const history: ConversationMessage[] = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      let response: FinResponse;

      if (llmConfigured) {
        // Pass full context including session state
        response = await queryFin(content, history, {
          page_type: pageContext,
          viewingProduct: pageContext === 'product' && viewingProduct ? viewingProduct : undefined,
          sessionState, // Pass full session state to LLM
        });
      } else {
        // Use mock mode
        response = await queryFinMock(content, history, { sessionState });
      }

      setLastResponse(response);
      
      // Update session state based on LLM response
      // The LLM tells us how to update the state - we don't write rules here
      if (response.sessionStateUpdate) {
        const update = response.sessionStateUpdate;
        setSessionState((prev: SessionState) => ({
          conversationMode: update.conversationMode,
          // Convert null to undefined for optional fields
          supportContext: update.supportContext ?? undefined,
          shoppingContext: update.shoppingContext ?? undefined,
          // Keep tracking products shown (accumulate, don't replace)
          productsShownThisSession: [
            ...prev.productsShownThisSession,
            ...response.products.map(p => p.id),
          ],
        }));
      } else if (response.products.length > 0) {
        // Fallback: just track products shown
        setSessionState((prev: SessionState) => ({
          ...prev,
          productsShownThisSession: [
            ...prev.productsShownThisSession,
            ...response.products.map(p => p.id),
          ],
        }));
      }

      // Update conversation history
      conversationHistoryRef.current = [
        ...history,
        { role: 'user', content },
        { role: 'assistant', content: response.responseText },
      ];

      // Map LLM response to our LLMDecision format
      const llmDecision: LLMDecision = {
        intent: {
          primary: response.llmResponse.intent.primary,
          confidence: response.llmResponse.intent.confidence,
          signals: response.llmResponse.intent.signals,
        },
        decision: {
          show_products: response.llmResponse.decision.show_products,
          renderer: response.llmResponse.decision.renderer,
          item_count: response.llmResponse.decision.item_count,
          needs_clarification: response.llmResponse.decision.needs_clarification,
        },
        reasoning: {
          // Map from service field names to message type field names
          intent_rationale: response.llmResponse.reasoning.intent_explanation,
          product_rationale: response.llmResponse.reasoning.selection_reasoning,
          negative_signals: response.llmResponse.reasoning.product_reasoning || [],
        },
        product_search: response.llmResponse.product_search ? {
          query: response.llmResponse.product_search.query,
          category: response.llmResponse.product_search.subcategory,
        } : undefined,
      };

      // Create agent message with products
      const agentResponse = createAgentMessage(
        response.responseText,
        {
          products: response.products,
          layout: cardLayout,
          llmDecision,
          latencyMs: response.latency.total,
        }
      );

      setMessages(prev => [...prev, agentResponse]);
    } catch (error) {
      console.error('Error querying Fin:', error);
      // Show error message
      const errorMsg = createAgentMessage(
        "I'm sorry, I encountered an error processing your request. Please try again.",
      );
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, llmConfigured, cardLayout, sessionState, pageContext, viewingProduct]);

  const toggleConfig = (key: keyof CardConfig) => {
    setCardConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearConversation = () => {
    setMessages([]);
    // Reset session state to fresh start
    setSessionState({
      conversationMode: 'neutral',
      productsShownThisSession: [],
    });
    clearSavedConversation();
  };

  const loadDemoConversation = () => {
    if (allProducts.length > 0) {
      setMessages(createDemoConversation(allProducts));
    }
  };

  // Preview products from a specific subcategory
  const previewProducts = (subcategory: string) => {
    const subcategoryProducts = allProducts.filter(p => p.subcategory === subcategory).slice(0, 6);
    if (subcategoryProducts.length === 0) return;

    // Capitalize subcategory for display
    const label = subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
    const previewMsg = createAgentMessage(
      `Here are our ${label}:`,
      {
        products: subcategoryProducts,
        layout: cardLayout,
      }
    );
    setMessages(prev => [...prev, previewMsg]);
  };

  // Live search from HuggingFace (on-demand)
  const handleLiveSearch = async () => {
    if (!liveSearchQuery.trim()) return;
    
    setLiveSearching(true);
    try {
      const result = await searchProducts({
        query: liveSearchQuery,
        maxResults: 6,
      });
      
      setLastSearchResult(result);
      
      // Show results in messenger
      if (result.products.length > 0) {
        const searchMsg = createAgentMessage(
          `Found ${result.totalMatches} products for "${liveSearchQuery}" (${result.searchTime}ms${result.fromCache ? ', cached' : ', fetched'}):`,
          {
            products: result.products,
            layout: cardLayout,
          }
        );
        setMessages(prev => [...prev, searchMsg]);
      } else {
        const noResultsMsg = createAgentMessage(
          `No products found for "${liveSearchQuery}". Try: jacket, dress, boots, jeans, etc.`
        );
        setMessages(prev => [...prev, noResultsMsg]);
      }
    } catch (error) {
      console.error('Live search error:', error);
      const errorMsg = createAgentMessage(
        'Failed to search products. Check console for details.'
      );
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLiveSearching(false);
    }
  };

  // Get available subcategories (ones that have products)
  const availableSubcategories = [...new Set(allProducts.map(p => p.subcategory))].sort();

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Left side: Config Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-neutral-100 border-r border-neutral-200 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              Fin E-commerce Prototype
            </h1>
          </div>

          {/* Messenger State */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Messenger State
            </Label>
            <ToggleGroup 
              type="single" 
              value={messengerState}
              onValueChange={(v) => v && setMessengerState(v as MessengerState)}
              className="justify-start"
            >
              <ToggleGroupItem value="default" size="sm">
                Default
              </ToggleGroupItem>
              <ToggleGroupItem value="expanded" size="sm">
                Expanded
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Layout Selector */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Card Layout
            </Label>
            <ToggleGroup 
              type="single" 
              value={cardLayout}
              onValueChange={(v) => v && setCardLayout(v as CardLayout)}
              className="justify-start"
            >
              <ToggleGroupItem value="carousel" size="sm">
                Carousel
              </ToggleGroupItem>
              <ToggleGroupItem value="list" size="sm">
                List
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" size="sm">
                Grid
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator className="bg-neutral-200" />

          {/* Card Content Mode */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Card Content
            </Label>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="aiReasoning" className="text-sm font-medium text-neutral-900 cursor-pointer block">
                  AI Reasoning on Cards
                </Label>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Show why each product matches instead of generic metadata
                </p>
              </div>
              <Switch
                id="aiReasoning"
                checked={aiReasoningMode}
                onCheckedChange={setAiReasoningMode}
              />
            </div>
          </div>

          <Separator className="bg-neutral-200" />

          {/* Page Context Selector */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Page Context
            </Label>
            <p className="text-xs text-neutral-500 -mt-1">
              Simulates which page the user is viewing
            </p>
            <Select value={pageContext} onValueChange={(v) => setPageContext(v as 'home' | 'category' | 'product')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home Page</SelectItem>
                <SelectItem value="category">Category Page</SelectItem>
                <SelectItem value="product">Product Details Page</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Product selector when on PDP */}
            {pageContext === 'product' && (
              <div className="space-y-2">
                <Label className="text-xs text-neutral-500">Viewing Product</Label>
                <Select 
                  value={viewingProduct?.id || ''} 
                  onValueChange={(id) => setViewingProduct(allProducts.find(p => p.id === id) || null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts.slice(0, 20).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name.length > 40 ? p.name.substring(0, 40) + '...' : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {viewingProduct && (
                  <p className="text-xs text-neutral-500 italic">
                    "{viewingProduct.name}" — {viewingProduct.subcategory}
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-neutral-200" />

          {/* Metadata Toggles */}
          <div className={`space-y-3 ${aiReasoningMode ? 'opacity-40 pointer-events-none' : ''}`}>
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Card Metadata {aiReasoningMode && <span className="normal-case">(disabled in AI mode)</span>}
            </Label>
            {[
              { key: 'showImage', label: 'Image', listOnly: true },
              { key: 'showPrice', label: 'Price', listOnly: false },
              { key: 'showRating', label: 'Rating', listOnly: false },
              { key: 'showDescription', label: 'Description', listOnly: false },
              { key: 'showVariants', label: 'Variants', listOnly: false },
            ]
              .filter(({ listOnly }) => !listOnly || cardLayout === 'list')
              .map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="text-sm font-normal text-neutral-700 cursor-pointer">
                  {label}
                </Label>
                <Switch
                  id={key}
                  checked={cardConfig[key as keyof CardConfig]}
                  onCheckedChange={() => toggleConfig(key as keyof CardConfig)}
                  disabled={aiReasoningMode}
                />
              </div>
            ))}
          </div>

          <Separator className="bg-neutral-200" />

          {/* CTA Toggles */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Call-to-Actions
            </Label>
            {[
              { key: 'showViewDetailsLarge', label: 'View Details (Button)' },
              { key: 'showViewDetailsCompact', label: 'View Details (Icon)' },
              { key: 'showAddToCart', label: 'Add to Cart' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="text-sm font-normal text-neutral-700 cursor-pointer">
                  {label}
                </Label>
                <Switch
                  id={key}
                  checked={cardConfig[key as keyof CardConfig]}
                  onCheckedChange={() => toggleConfig(key as keyof CardConfig)}
                />
              </div>
            ))}
          </div>

          <Separator className="bg-neutral-200" />

          {/* Conversation Actions */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Conversation
            </Label>
            <p className="text-xs text-neutral-500">
              Conversation persists on reload
            </p>
            <div className="flex gap-2">
              <button
                onClick={clearConversation}
                className="px-3 py-1.5 text-xs bg-white border border-neutral-200 hover:bg-neutral-50 rounded-md transition-colors text-neutral-700"
              >
                Clear
              </button>
              <button
                onClick={loadDemoConversation}
                disabled={productsLoading}
                className="px-3 py-1.5 text-xs bg-white border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 rounded-md transition-colors text-neutral-700"
              >
                Load Demo
              </button>
            </div>
          </div>

          <Separator className="bg-neutral-200" />

          {/* Product Preview */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Product Preview
            </Label>
            <p className="text-xs text-neutral-500">
              Preview products by subcategory
            </p>
            <div className="flex gap-2">
              <Select
                value={previewSubcategory}
                onValueChange={(value) => setPreviewSubcategory(value)}
              >
                <SelectTrigger className="flex-1 h-8 text-xs bg-white">
                  <SelectValue placeholder="Select subcategory..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map((subcat) => (
                    <SelectItem key={subcat} value={subcat} className="text-xs">
                      {subcat.charAt(0).toUpperCase() + subcat.slice(1)} ({allProducts.filter(p => p.subcategory === subcat).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => previewSubcategory && previewProducts(previewSubcategory)}
                disabled={!previewSubcategory || productsLoading}
                className="px-3 py-1.5 text-xs bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Preview
              </button>
            </div>
          </div>

          <Separator className="bg-neutral-200" />

          {/* Live Search (HuggingFace) */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Live Search (HuggingFace)
            </Label>
            <p className="text-xs text-neutral-500">
              On-demand search from ~30K products. First search fetches catalog (~3s).
            </p>
            <div className="flex gap-2">
              <Input
                value={liveSearchQuery}
                onChange={(e) => setLiveSearchQuery(e.target.value)}
                placeholder="jacket, boots, dress..."
                className="flex-1 h-8 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleLiveSearch()}
              />
              <button
                onClick={handleLiveSearch}
                disabled={liveSearching || !liveSearchQuery.trim()}
                className="px-3 py-1.5 text-xs bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors min-w-[60px]"
              >
                {liveSearching ? '...' : 'Search'}
              </button>
            </div>
            {lastSearchResult && (
              <div className="text-xs text-neutral-500 bg-neutral-50 p-2 rounded">
                Last: {lastSearchResult.totalMatches} matches in {lastSearchResult.searchTime}ms 
                {lastSearchResult.fromCache ? ' (cached)' : ' (fetched)'} 
                {isCached() && ' • Catalog cached'}
              </div>
            )}
          </div>

          <Separator className="bg-neutral-200" />

          {/* AI Status */}
          <div className={`p-3 rounded-lg border ${llmConfigured ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className={`font-medium text-sm ${llmConfigured ? 'text-green-800' : 'text-amber-800'}`}>
              {llmConfigured ? '🟢 LLM Mode' : '🟡 Mock Mode'}
            </div>
            <div className={`text-xs mt-1 ${llmConfigured ? 'text-green-700' : 'text-amber-700'}`}>
              {llmConfigured 
                ? 'Using GPT-4o for intent detection'
                : 'Add VITE_OPENAI_API_KEY to .env for LLM mode'
              }
            </div>
            {lastResponse && (
              <div className="text-xs mt-2 pt-2 border-t border-current/20">
                <span className="opacity-70">Last response: </span>
                <span className="font-mono">{Math.round(lastResponse.latency.total)}ms</span>
              </div>
            )}
          </div>

          {/* Session State Debug */}
          <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
            <div className="font-medium text-sm text-slate-800 mb-2">Session State</div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Mode:</span>
                <span className={`font-mono px-1.5 py-0.5 rounded ${
                  sessionState.conversationMode === 'support' ? 'bg-orange-100 text-orange-700' :
                  sessionState.conversationMode === 'shopping' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {sessionState.conversationMode}
                </span>
              </div>
              {sessionState.supportContext && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Support:</span>
                  <span className="font-mono text-orange-600">
                    {sessionState.supportContext.issueType}
                    {sessionState.supportContext.resolved ? ' ✓' : ' (active)'}
                  </span>
                </div>
              )}
              {sessionState.shoppingContext && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Shopping:</span>
                  <span className="font-mono text-blue-600 truncate ml-2 max-w-[120px]" title={sessionState.shoppingContext.query}>
                    {sessionState.shoppingContext.subcategory}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Products shown:</span>
                <span className="font-mono text-slate-600">{sessionState.productsShownThisSession.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - LLM Debug Panel */}
      <div className="ml-80 min-h-screen bg-neutral-100 p-8">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">LLM Decision Debug</h2>
          
          {lastResponse ? (
            <div className="space-y-4">
              {/* Intent & Role */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Intent Classification</h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    lastResponse.llmResponse.intent.primary === 'support' 
                      ? 'bg-orange-100 text-orange-700' 
                      : lastResponse.llmResponse.intent.primary === 'shopping_discovery'
                      ? 'bg-blue-100 text-blue-700'
                      : lastResponse.llmResponse.intent.primary === 'refinement'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {lastResponse.llmResponse.intent.primary}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(lastResponse.llmResponse.intent.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Signals: </span>
                  {lastResponse.llmResponse.intent.signals.join(', ') || 'None detected'}
                </div>
              </div>

              {/* Decision */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Decision</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Show Products:</span>
                    <span className={`ml-2 font-medium ${lastResponse.llmResponse.decision.show_products ? 'text-green-600' : 'text-gray-600'}`}>
                      {lastResponse.llmResponse.decision.show_products ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Renderer:</span>
                    <span className="ml-2 font-medium text-gray-800">{lastResponse.llmResponse.decision.renderer}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Item Count:</span>
                    <span className="ml-2 font-medium text-gray-800">{lastResponse.llmResponse.decision.item_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Needs Clarification:</span>
                    <span className="ml-2 font-medium text-gray-800">{lastResponse.llmResponse.decision.needs_clarification ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Understood Intent */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Understood Intent</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Explicit Need:</span>
                    <span className="ml-2 text-gray-800">{lastResponse.llmResponse.understood_intent?.explicit_need || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Implicit Constraints:</span>
                    <span className="ml-2 text-gray-800">
                      {lastResponse.llmResponse.understood_intent?.implicit_constraints?.join(', ') || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Inferred Context:</span>
                    <span className="ml-2 text-gray-800">{lastResponse.llmResponse.understood_intent?.inferred_context || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">LLM Reasoning</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Intent Explanation:</span>
                    <p className="mt-1 text-gray-800">{lastResponse.llmResponse.reasoning?.intent_explanation || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Selection Reasoning:</span>
                    <p className="mt-1 text-gray-800">{lastResponse.llmResponse.reasoning?.selection_reasoning || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Product Search (if applicable) */}
              {lastResponse.llmResponse.product_search && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Product Search</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Query:</span>
                      <span className="ml-2 text-gray-800">{lastResponse.llmResponse.product_search.query}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Subcategory:</span>
                      <span className="ml-2 font-mono text-gray-800">{lastResponse.llmResponse.product_search.subcategory || 'Any'}</span>
                    </div>
                    {lastResponse.llmResponse.product_search.priceRange && (
                      <div>
                        <span className="text-gray-500">Price Range:</span>
                        <span className="ml-2 text-gray-800">
                          £{lastResponse.llmResponse.product_search.priceRange.min || 0} - £{lastResponse.llmResponse.product_search.priceRange.max || '∞'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Latency */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Performance</h3>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-2 font-mono text-gray-800">{Math.round(lastResponse.latency.total)}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-500">LLM:</span>
                    <span className="ml-2 font-mono text-gray-800">{Math.round(lastResponse.latency.llm)}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Search:</span>
                    <span className="ml-2 font-mono text-gray-800">{Math.round(lastResponse.latency.search)}ms</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              <p>Send a message to see LLM decision details here.</p>
              <p className="text-sm mt-2">This panel shows intent classification, reasoning, and performance metrics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Gradient backdrop behind messenger - creates depth effect */}
      <div 
        className="fixed bottom-0 right-0 pointer-events-none z-40"
        style={{
          width: '600px',
          height: '900px',
          background: 'radial-gradient(ellipse at bottom right, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.03) 40%, transparent 70%)',
        }}
      />

      {/* Messenger - fixed to bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <Messenger
          state={messengerState}
          messages={messages}
          cardConfig={cardConfig}
          layout={cardLayout}
          isLoading={isLoading || productsLoading}
          aiReasoningMode={aiReasoningMode}
          onSend={handleSend}
        />
        
        {/* Launcher button - decorative only, no toggle functionality */}
        <div
          className="w-12 h-12 rounded-full bg-[#2a2a2a] shadow-lg flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Chevron down icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default App;
