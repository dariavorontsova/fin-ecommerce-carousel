import { useState, useCallback, useRef, useEffect } from 'react';
import { Messenger } from './components/messenger';
import { CardConfig, DEFAULT_CARD_CONFIG, CardLayout, MessengerState, Product } from './types/product';
import { Message, createUserMessage, createAgentMessage, LLMDecision } from './types/message';
import { getAllProducts } from './data/products';
import {
  queryFinMock,
  queryFin,
  configureOpenAI,
  isConfigured,
  ConversationMessage,
  FinResponse,
} from './services';

// shadcn/ui components
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Input } from './components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';

const milestones = [
  { id: 'M1', label: 'Setup', done: true },
  { id: 'M2', label: 'Data', done: true },
  { id: 'M3', label: 'Chrome', done: true },
  { id: 'M4', label: 'Cards', done: true },
  { id: 'M5', label: 'Layouts', done: true },
  { id: 'M6', label: 'Thread', done: true },
  { id: 'M7', label: 'OpenAI', done: true },
  { id: 'M8', label: 'Debug', done: false },
];

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

function App() {
  const [messengerState, setMessengerState] = useState<MessengerState>('default');
  const [cardLayout, setCardLayout] = useState<CardLayout>('carousel');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiReasoningMode, setAiReasoningMode] = useState(false);
  const [cardConfig, setCardConfig] = useState<CardConfig>({
    ...DEFAULT_CARD_CONFIG,
    showDescription: false,
    showViewDetailsLarge: false,
  });
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // LLM Integration state
  const [useLLM, setUseLLM] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [lastResponse, setLastResponse] = useState<FinResponse | null>(null);
  const conversationHistoryRef = useRef<ConversationMessage[]>([]);

  // Product preview state (using subcategory since all products are 'clothing')
  const [previewSubcategory, setPreviewSubcategory] = useState<string>('');

  // Load products from DummyJSON API on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const products = await getAllProducts();
        setAllProducts(products);
        // Initialize demo conversation with loaded products
        setMessages(createDemoConversation(products));
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Handle sending a new message - uses LLM or mock based on toggle
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

      if (useLLM && apiKey) {
        // Configure OpenAI if not already
        if (!isConfigured()) {
          configureOpenAI(apiKey);
        }
        response = await queryFin(content, history);
      } else {
        // Use mock mode
        response = await queryFinMock(content, history);
      }

      setLastResponse(response);

      // Update conversation history
      conversationHistoryRef.current = [
        ...history,
        { role: 'user', content },
        { role: 'assistant', content: response.llmResponse.response_text },
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
          clarification_reason: response.llmResponse.decision.clarification_reason ?? undefined,
        },
        reasoning: {
          // Map from service field names to message type field names
          intent_rationale: response.llmResponse.reasoning.intent_explanation,
          product_rationale: response.llmResponse.reasoning.renderer_explanation,
          negative_signals: response.llmResponse.reasoning.confidence_factors,
        },
        product_search: response.llmResponse.product_search ? {
          query: response.llmResponse.product_search.query,
          category: response.llmResponse.product_search.category,
        } : undefined,
      };

      // Create agent message with products
      const agentResponse = createAgentMessage(
        response.llmResponse.response_text,
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
  }, [messages, useLLM, apiKey, cardLayout]);

  const toggleConfig = (key: keyof CardConfig) => {
    setCardConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearConversation = () => {
    setMessages([]);
  };

  const resetDemo = () => {
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
            <p className="text-neutral-500 text-sm mt-1">
              Decision Logic + UI Variants
            </p>
          </div>

          {/* Milestone Status */}
          <div className="flex flex-wrap gap-1.5">
            {milestones.map((m) => (
              <Badge 
                key={m.id} 
                variant={m.done ? 'default' : 'outline'}
                className={m.done ? 'bg-[#2a2a2a] hover:bg-[#2a2a2a] text-white' : 'border-neutral-300 text-neutral-500'}
              >
                {m.done && '✓ '}{m.id}
              </Badge>
            ))}
          </div>

          <Separator className="bg-neutral-200" />

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
            <div className="flex gap-2">
              <button
                onClick={resetDemo}
                className="px-3 py-1.5 text-xs bg-white border border-neutral-200 hover:bg-neutral-50 rounded-md transition-colors text-neutral-700"
              >
                Reset Demo
              </button>
              <button
                onClick={clearConversation}
                className="px-3 py-1.5 text-xs bg-white border border-neutral-200 hover:bg-neutral-50 rounded-md transition-colors text-neutral-700"
              >
                Clear
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

          {/* LLM Mode Toggle */}
          <div className="space-y-3">
            <Label className="text-xs text-neutral-500 uppercase tracking-wide">
              AI Backend
            </Label>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="useLLM" className="text-sm font-medium text-neutral-900 cursor-pointer block">
                  Use OpenAI
                </Label>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {useLLM ? 'Real LLM decisions' : 'Mock responses'}
                </p>
              </div>
              <Switch
                id="useLLM"
                checked={useLLM}
                onCheckedChange={setUseLLM}
              />
            </div>

            {useLLM && (
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-xs text-neutral-500">
                  OpenAI API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {/* Mode Status */}
          <div className={`p-3 rounded-lg border ${useLLM && apiKey ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className={`font-medium text-sm ${useLLM && apiKey ? 'text-green-800' : 'text-amber-800'}`}>
              {useLLM && apiKey ? '🟢 LLM Mode' : '🟡 Mock Mode'}
            </div>
            <div className={`text-xs mt-1 ${useLLM && apiKey ? 'text-green-700' : 'text-amber-700'}`}>
              {useLLM && apiKey 
                ? 'Using GPT-4o-mini for intent detection & decisions'
                : useLLM 
                  ? 'Enter API key to enable LLM'
                  : 'Using rule-based mock responses'
              }
            </div>
            {lastResponse && (
              <div className="text-xs mt-2 pt-2 border-t border-current/20">
                <span className="opacity-70">Last response: </span>
                <span className="font-mono">{Math.round(lastResponse.latency.total)}ms</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="ml-80 min-h-screen bg-neutral-100" />

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
