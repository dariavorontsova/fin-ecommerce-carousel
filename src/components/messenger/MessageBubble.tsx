import { Message, UserMessage, AgentMessage } from '../../types/message';
import { CardConfig, CardLayout } from '../../types/product';
import { ProductCard } from '../product/ProductCard';
import { CarouselLayout, ListLayout, GridLayout } from '../layouts';

interface MessageBubbleProps {
  message: Message;
  cardConfig: CardConfig;
  layout: CardLayout;
  aiReasoningMode?: boolean;
}

export function MessageBubble({ message, cardConfig, layout, aiReasoningMode = false }: MessageBubbleProps) {
  if (message.role === 'user') {
    return <UserBubble message={message} />;
  }
  return <AgentBubble message={message} cardConfig={cardConfig} layout={layout} aiReasoningMode={aiReasoningMode} />;
}

// User message bubble - right aligned
function UserBubble({ message }: { message: UserMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-neutral-900 text-white px-4 py-2.5 rounded-2xl rounded-br-md">
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

// Agent message bubble - left aligned, can include products
function AgentBubble({ 
  message, 
  cardConfig, 
  layout,
  aiReasoningMode,
}: { 
  message: AgentMessage; 
  cardConfig: CardConfig;
  layout: CardLayout;
  aiReasoningMode: boolean;
}) {
  const effectiveLayout = message.layout || layout;
  const hasProducts = message.products && message.products.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Agent avatar + text */}
      <div className="flex items-start gap-2.5">
        {/* Fin avatar */}
        <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-semibold">F</span>
        </div>
        
        {/* Text content */}
        <div className="max-w-[85%] bg-neutral-100 text-neutral-900 px-4 py-2.5 rounded-2xl rounded-bl-md">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>

      {/* Product recommendations - full width */}
      {hasProducts && (
        <div className="ml-9 -mr-1">
          <ProductLayout
            products={message.products!}
            layout={effectiveLayout}
            cardConfig={cardConfig}
            aiReasoningMode={aiReasoningMode}
          />
        </div>
      )}
    </div>
  );
}

// Product layout renderer
function ProductLayout({
  products,
  layout,
  cardConfig,
  aiReasoningMode,
}: {
  products: NonNullable<AgentMessage['products']>;
  layout: CardLayout;
  cardConfig: CardConfig;
  aiReasoningMode: boolean;
}) {
  const cards = products.map((product) => (
    <ProductCard key={product.id} product={product} config={cardConfig} aiReasoningMode={aiReasoningMode} />
  ));

  switch (layout) {
    case 'carousel':
      return <CarouselLayout>{cards}</CarouselLayout>;
    case 'list':
      return <ListLayout>{cards}</ListLayout>;
    case 'grid':
      return <GridLayout>{cards}</GridLayout>;
    default:
      return <CarouselLayout>{cards}</CarouselLayout>;
  }
}
