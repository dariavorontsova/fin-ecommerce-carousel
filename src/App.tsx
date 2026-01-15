import { useState, useCallback } from 'react';
import { Messenger, MessengerState } from './components/messenger';
import { products, getProductsByCategory } from './data/products';
import { CardConfig, DEFAULT_CARD_CONFIG, CardLayout } from './types/product';
import { Message, createUserMessage, createAgentMessage } from './types/message';

// shadcn/ui components
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';

const milestones = [
  { id: 'M1', label: 'Setup', done: true },
  { id: 'M2', label: 'Data', done: true },
  { id: 'M3', label: 'Chrome', done: true },
  { id: 'M4', label: 'Cards', done: true },
  { id: 'M5', label: 'Layouts', done: true },
  { id: 'M6', label: 'Thread', done: true },
  { id: 'M7', label: 'OpenAI', done: false },
  { id: 'M8', label: 'Debug', done: false },
];

// Demo conversation with products embedded
function createDemoConversation(): Message[] {
  const lightingProducts = getProductsByCategory('lighting').slice(0, 5);
  const clothingProducts = getProductsByCategory('clothing').slice(0, 4);

  return [
    createUserMessage("I'm looking for a modern desk lamp"),
    createAgentMessage(
      "I'd be happy to help you find the perfect desk lamp! Here are some stylish modern options that would work great for your workspace:",
      { 
        products: lightingProducts,
        layout: 'carousel',
      }
    ),
    createUserMessage("These look great! Do you have anything in matte black?"),
    createAgentMessage(
      "Great choice! The Nordic Arc Lamp and Adjustable LED Desk Lamp both come in matte black finishes. The Nordic Arc is particularly popular for its minimalist design. Would you like more details on either of these?",
    ),
    createUserMessage("Actually, can you show me some running shoes instead?"),
    createAgentMessage(
      "Of course! Here are some top-rated running shoes we have available:",
      {
        products: clothingProducts,
        layout: 'carousel',
      }
    ),
  ];
}

function App() {
  const [messengerState, setMessengerState] = useState<MessengerState>('default');
  const [messengerOpen, setMessengerOpen] = useState(true);
  const [cardLayout, setCardLayout] = useState<CardLayout>('carousel');
  const [messages, setMessages] = useState<Message[]>(createDemoConversation);
  const [isLoading, setIsLoading] = useState(false);
  const [aiReasoningMode, setAiReasoningMode] = useState(false);
  const [cardConfig, setCardConfig] = useState<CardConfig>({
    ...DEFAULT_CARD_CONFIG,
    showDescription: false,
    showViewDetailsLarge: false,
  });

  // Handle sending a new message (demo - simulates agent response)
  const handleSend = useCallback((content: string) => {
    // Add user message
    const userMsg = createUserMessage(content);
    setMessages(prev => [...prev, userMsg]);
    
    // Simulate agent "thinking"
    setIsLoading(true);
    
    setTimeout(() => {
      // Create mock agent response
      const lowerContent = content.toLowerCase();
      let agentResponse: Message;

      // Simple keyword matching for demo purposes
      if (lowerContent.includes('lamp') || lowerContent.includes('light')) {
        agentResponse = createAgentMessage(
          "Here are some lighting options that might interest you:",
          { products: getProductsByCategory('lighting').slice(0, 4), layout: cardLayout }
        );
      } else if (lowerContent.includes('shoe') || lowerContent.includes('running') || lowerContent.includes('clothes')) {
        agentResponse = createAgentMessage(
          "Here are some clothing items you might like:",
          { products: getProductsByCategory('clothing').slice(0, 4), layout: cardLayout }
        );
      } else if (lowerContent.includes('food') || lowerContent.includes('snack') || lowerContent.includes('eat')) {
        agentResponse = createAgentMessage(
          "Here are some tasty food options:",
          { products: getProductsByCategory('food').slice(0, 4), layout: cardLayout }
        );
      } else if (lowerContent.includes('pet') || lowerContent.includes('dog') || lowerContent.includes('cat')) {
        agentResponse = createAgentMessage(
          "Here are some pet products:",
          { products: getProductsByCategory('pets').slice(0, 4), layout: cardLayout }
        );
      } else if (lowerContent.includes('book') || lowerContent.includes('read')) {
        agentResponse = createAgentMessage(
          "Here are some books you might enjoy:",
          { products: getProductsByCategory('books').slice(0, 4), layout: cardLayout }
        );
      } else if (lowerContent.includes('help') || lowerContent.includes('order') || lowerContent.includes('return')) {
        // Support query - no products
        agentResponse = createAgentMessage(
          "I'd be happy to help with that! To assist you better, could you provide your order number? You can find it in your confirmation email.",
        );
      } else {
        // Generic response with random products
        const randomProducts = products.sort(() => Math.random() - 0.5).slice(0, 4);
        agentResponse = createAgentMessage(
          "Here are some popular items you might be interested in:",
          { products: randomProducts, layout: cardLayout }
        );
      }

      setMessages(prev => [...prev, agentResponse]);
      setIsLoading(false);
    }, 1200); // Simulate network delay
  }, [cardLayout]);

  const toggleConfig = (key: keyof CardConfig) => {
    setCardConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearConversation = () => {
    setMessages([]);
  };

  const resetDemo = () => {
    setMessages(createDemoConversation());
  };

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
              { key: 'showImage', label: 'Image' },
              { key: 'showTitle', label: 'Title' },
              { key: 'showPrice', label: 'Price' },
              { key: 'showRating', label: 'Rating' },
              { key: 'showDescription', label: 'Description' },
              { key: 'showVariants', label: 'Variants' },
              { key: 'showPromoBadge', label: 'Promo Badge' },
            ].map(({ key, label }) => (
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

          {/* Demo Mode Notice */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="font-medium text-amber-800 text-sm">
              Demo Mode
            </div>
            <div className="text-xs text-amber-700 mt-1">
              Using mock responses. OpenAI integration coming in M7.
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="ml-80 min-h-screen bg-neutral-100" />

      {/* Messenger - fixed to bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {messengerOpen && (
          <Messenger
            state={messengerState}
            messages={messages}
            cardConfig={cardConfig}
            layout={cardLayout}
            isLoading={isLoading}
            aiReasoningMode={aiReasoningMode}
            onSend={handleSend}
            onClose={() => setMessengerOpen(false)}
          />
        )}
        
        {/* Launcher button - always visible */}
        <button
          onClick={() => setMessengerOpen(!messengerOpen)}
          className="w-12 h-12 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label={messengerOpen ? "Minimize chat" : "Open chat"}
        >
          {messengerOpen ? (
            // Chevron down when open
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            // Chat icon when closed
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M21 11.5C21 16.1944 16.9706 20 12 20C10.8053 20 9.66566 19.7878 8.61822 19.4012C8.41312 19.3254 8.18838 19.3156 7.97685 19.3736L4.78215 20.2491C4.15577 20.4207 3.57928 19.8442 3.75093 19.2179L4.62635 16.0232C4.68435 15.8116 4.67462 15.5869 4.59876 15.3818C4.21224 14.3343 4 13.1947 4 12C4 7.02944 7.80558 3 12.5 3" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
              <path 
                d="M19 3L19 9M22 6L16 6" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default App;
