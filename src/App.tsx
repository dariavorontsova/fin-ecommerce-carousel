import { useState, useCallback, useRef, useEffect } from 'react';
import { Messenger } from './components/messenger';
import { CardConfig, DEFAULT_CARD_CONFIG, CardLayout, MessengerState, Product, CardDesign, ImageRatio } from './types/product';
import { Message, createUserMessage, createAgentMessage, LLMDecision } from './types/message';
import { getAllProducts } from './data/products';
import { getDemoProductsByRatio } from './data/catalog';
import {
  queryFinMock,
  queryFin,
  queryFinDemo,
  isConfigured,
  ConversationMessage,
  FinResponse,
  SessionState,
} from './services';

// shadcn/ui components
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import { Separator } from './components/ui/separator';
// import { Input } from './components/ui/input';
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



function App() {
  const [messengerState, setMessengerState] = useState<MessengerState>('default');
  const [cardLayout, setCardLayout] = useState<CardLayout>('grid');
  const [cardDesign, setCardDesign] = useState<CardDesign>('borderless');
  const [imageRatio, setImageRatio] = useState<ImageRatio>('portrait');
  const [selectedStore, setSelectedStore] = useState<ImageRatio>('portrait');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiReasoningMode, setAiReasoningMode] = useState(false); // Default OFF
  const [cardConfig, setCardConfig] = useState<CardConfig>({
    ...DEFAULT_CARD_CONFIG,
    showPrice: true,
    showRating: false,
    showDescription: true,
    showAddToCart: true,
    showViewDetailsLarge: false,
  });
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Demo mode: uses local catalog + lightweight LLM for fast, controlled demos
  const [demoMode, setDemoMode] = useState(true); // Default ON for demo purposes

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
  const [pageContext] = useState<'home' | 'category' | 'product'>('home');
  const [viewingProduct] = useState<Product | null>(null);

  // Load products and auto-load demo on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const products = await getAllProducts();
        setAllProducts(products);
        
        if (demoMode) {
          // Always load a fresh demo conversation on mount
          setMessages(buildDemoMessages(imageRatio, cardLayout));
        } else {
          // Try to restore saved conversation, otherwise start empty
          const savedConversation = loadConversation();
          if (savedConversation && savedConversation.length > 0) {
            setMessages(savedConversation);
          }
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (demoMode) {
        // Demo mode: fast local catalog + lightweight LLM
        response = await queryFinDemo(content, history, { sessionState });
      } else if (llmConfigured) {
        // Full LLM mode with external product search
        response = await queryFin(content, history, {
          page_type: pageContext,
          viewingProduct: pageContext === 'product' && viewingProduct ? viewingProduct : undefined,
          sessionState,
        });
      } else {
        // Mock mode (no API key)
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
  }, [messages, llmConfigured, demoMode, cardLayout, sessionState, pageContext, viewingProduct]);

  const toggleConfig = (key: keyof CardConfig) => {
    setCardConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Build a demo conversation for a given ratio/store
  const buildDemoMessages = (ratio: ImageRatio, layout: CardLayout): Message[] => {
    const ratioProducts = getDemoProductsByRatio(ratio);
    const shuffled = [...ratioProducts].sort(() => Math.random() - 0.5);
    const productsToShow = shuffled.slice(0, 8);
    // Pick one product from the shown ones for the follow-up single card
    const featuredProduct = productsToShow[0];

    const storeMap = {
      landscape: { query: 'Show me your sofas', brand: 'Kave Home', label: 'sofas' },
      square: { query: 'Show me some trainers', brand: '', label: 'trainers' },
      portrait: { query: 'Show me gym t-shirts', brand: 'Gymshark', label: 'tops' },
    };
    const store = storeMap[ratio];

    return [
      createUserMessage(store.query),
      createAgentMessage(
        `Here's a selection of ${store.label}${store.brand ? ` from ${store.brand}` : ''}. Each one brings something different — take a look.`,
        { products: productsToShow, layout }
      ),
      createUserMessage(`Tell me more about the ${featuredProduct.name}`),
      createAgentMessage(
        `The ${featuredProduct.name} is one of our favourites. ${featuredProduct.description}`,
        { products: [featuredProduct], layout: 'grid' }
      ),
    ];
  };

  const loadDemoConversation = () => {
    if (demoMode) {
      // Apply the selected store's ratio and load the demo
      setImageRatio(selectedStore);
      setMessages(buildDemoMessages(selectedStore, cardLayout));
    } else if (allProducts.length > 0) {
      setMessages(createDemoConversation(allProducts));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Left side: Config Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-neutral-100 border-r border-neutral-200 overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Header + Demo Mode */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-neutral-900">
              Fin E-commerce
            </h1>
            <div className="flex items-center gap-2">
              <Label htmlFor="demoMode" className="text-xs text-neutral-500 cursor-pointer">
                Demo
              </Label>
              <Switch
                id="demoMode"
                checked={demoMode}
                onCheckedChange={setDemoMode}
              />
            </div>
          </div>

          {/* Demo Store Selector + Actions */}
          <div className="space-y-2">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Demo Store
            </Label>
            <div className="flex gap-2">
              <Select value={selectedStore} onValueChange={(v) => {
                setSelectedStore(v as ImageRatio);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Gymshark (Portrait)</SelectItem>
                  <SelectItem value="square">Trainer Store (Square)</SelectItem>
                  <SelectItem value="landscape">Kave Home (Landscape)</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={loadDemoConversation}
                disabled={productsLoading}
                className="px-3 py-1.5 text-xs bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] disabled:opacity-40 rounded-md transition-colors shrink-0"
              >
                Load
              </button>
            </div>
          </div>

          <Separator className="bg-neutral-200" />

          {/* Messenger State */}
          <div className="space-y-2">
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

          {/* Card Layout */}
          <div className="space-y-2">
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
              <ToggleGroupItem value="grid" size="sm">
                Grid
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Card Design */}
          <div className="space-y-2">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Card Design
            </Label>
            <Select value={cardDesign} onValueChange={(v) => {
              const design = v as CardDesign;
              setCardDesign(design);
              // Set default toggle states per card design
              if (design === 'borderless') {
                setCardConfig(prev => ({ ...prev, showPrice: true, showDescription: true, showAddToCart: true, showRating: false }));
              } else if (design === 'proposed') {
                setCardConfig(prev => ({ ...prev, showPrice: true, showDescription: true, showAddToCart: true, showRating: false }));
              } else {
                // v1 Current defaults
                setCardConfig(prev => ({ ...prev, showPrice: true, showDescription: true, showAddToCart: false, showRating: false }));
              }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">(v1) Current</SelectItem>
                <SelectItem value="proposed">(v2) Minor changes</SelectItem>
                <SelectItem value="borderless">(v3) Borderless</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-neutral-200" />

          {/* Card Details Toggles */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              Card Details
            </Label>
            {/* AI Reasoning Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="aiReasoning" className="text-sm font-normal text-neutral-700 cursor-pointer">
                AI Reasoning
              </Label>
              <Switch
                id="aiReasoning"
                checked={aiReasoningMode}
                onCheckedChange={setAiReasoningMode}
              />
            </div>
            {/* Other metadata toggles */}
            <div className={`space-y-3 ${aiReasoningMode ? 'opacity-40 pointer-events-none' : ''}`}>
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
            {/* Add to Cart - always available regardless of AI reasoning */}
            <div className="flex items-center justify-between">
              <Label htmlFor="showAddToCart" className="text-sm font-normal text-neutral-700 cursor-pointer">
                Add to Cart
              </Label>
              <Switch
                id="showAddToCart"
                checked={cardConfig.showAddToCart}
                onCheckedChange={() => toggleConfig('showAddToCart')}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Debug Panel - same style as config */}
      <div className="fixed left-80 top-0 bottom-0 w-80 bg-neutral-100 border-r border-neutral-200 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">LLM Decision Debug</h2>
          </div>

          {lastResponse ? (
            <>
              {/* Intent Classification */}
              <div className="space-y-3">
                <Label className="text-xs text-neutral-500 uppercase tracking-wide">
                  Intent Classification
                </Label>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lastResponse.llmResponse.intent.primary === 'support' 
                      ? 'bg-orange-100 text-orange-700' 
                      : lastResponse.llmResponse.intent.primary === 'shopping_discovery'
                      ? 'bg-blue-100 text-blue-700'
                      : lastResponse.llmResponse.intent.primary === 'refinement'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {lastResponse.llmResponse.intent.primary}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {Math.round(lastResponse.llmResponse.intent.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-neutral-600">
                  {lastResponse.llmResponse.intent.signals.join(', ') || 'No signals'}
                </p>
              </div>

              <Separator className="bg-neutral-200" />

              {/* Decision */}
              <div className="space-y-3">
                <Label className="text-xs text-neutral-500 uppercase tracking-wide">
                  Decision
                </Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-neutral-500">Show Products</div>
                  <div className={`font-medium ${lastResponse.llmResponse.decision.show_products ? 'text-green-600' : 'text-neutral-600'}`}>
                    {lastResponse.llmResponse.decision.show_products ? 'Yes' : 'No'}
                  </div>
                  <div className="text-neutral-500">Renderer</div>
                  <div className="font-medium text-neutral-900">{lastResponse.llmResponse.decision.renderer}</div>
                  <div className="text-neutral-500">Requested</div>
                  <div className="font-medium text-neutral-900">{lastResponse.llmResponse.decision.item_count} items</div>
                  <div className="text-neutral-500">Returned</div>
                  <div className={`font-medium ${lastResponse.products.length === 0 ? 'text-red-600' : lastResponse.products.length < lastResponse.llmResponse.decision.item_count ? 'text-amber-600' : 'text-green-600'}`}>
                    {lastResponse.products.length} items
                  </div>
                </div>
              </div>

              <Separator className="bg-neutral-200" />

              {/* Understood Intent */}
              <div className="space-y-3">
                <Label className="text-xs text-neutral-500 uppercase tracking-wide">
                  Understood Intent
                </Label>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-500">Explicit: </span>
                    <span className="text-neutral-900">{lastResponse.llmResponse.understood_intent?.explicit_need || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Implicit: </span>
                    <span className="text-neutral-900">{lastResponse.llmResponse.understood_intent?.implicit_constraints?.join(', ') || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Context: </span>
                    <span className="text-neutral-900">{lastResponse.llmResponse.understood_intent?.inferred_context || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-neutral-200" />

              {/* Reasoning */}
              <div className="space-y-3">
                <Label className="text-xs text-neutral-500 uppercase tracking-wide">
                  LLM Reasoning
                </Label>
                <div className="space-y-2 text-xs text-neutral-700">
                  <p>{lastResponse.llmResponse.reasoning?.intent_explanation || 'N/A'}</p>
                  {lastResponse.llmResponse.reasoning?.selection_reasoning && (
                    <p className="text-neutral-500">{lastResponse.llmResponse.reasoning.selection_reasoning}</p>
                  )}
                </div>
              </div>

              {/* Product Search */}
              {lastResponse.llmResponse.product_search && (
                <>
                  <Separator className="bg-neutral-200" />
                  <div className="space-y-3">
                    <Label className="text-xs text-neutral-500 uppercase tracking-wide">
                      Product Search
                    </Label>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-neutral-500">Query: </span>
                        <span className="text-neutral-900">{lastResponse.llmResponse.product_search.query}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Subcategory: </span>
                        <span className="font-mono text-neutral-900">{lastResponse.llmResponse.product_search.subcategory || 'Any'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-neutral-200" />

              {/* Performance */}
              <div className="space-y-3">
                <Label className="text-xs text-neutral-500 uppercase tracking-wide">
                  Performance
                </Label>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500">Total: </span>
                    <span className="font-mono text-neutral-900">{Math.round(lastResponse.latency.total)}ms</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">LLM: </span>
                    <span className="font-mono text-neutral-900">{Math.round(lastResponse.latency.llm)}ms</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-500">
              Send a message to see LLM decision details.
            </p>
          )}
        </div>
      </div>

      {/* Main content area placeholder */}
      <div className="ml-[640px] min-h-screen bg-neutral-100" />

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
          cardDesign={cardDesign}
          imageRatio={imageRatio}
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
