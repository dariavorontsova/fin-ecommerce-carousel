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

// User message bubble - right aligned, black accent, max-w 280px, 20px radius
function UserBubble({ message }: { message: UserMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[280px] px-4 py-3 rounded-[20px] bg-[#2a2a2a]">
        <p className="text-sm leading-[1.5] text-white">
          {message.content}
        </p>
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
  // Config panel layout takes precedence for testing purposes
  const effectiveLayout = layout;
  const hasProducts = message.products && message.products.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Text content - Figma: #f5f5f5, max-w 336px, 20px radius */}
      <div 
        className="max-w-[336px] px-4 py-3 rounded-[20px]"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <p className="text-sm leading-[20px]" style={{ color: '#14161a' }}>
          {message.content}
        </p>
      </div>

      {/* Product recommendations - full width */}
      {hasProducts && (
        <ProductLayout
          products={message.products!}
          layout={effectiveLayout}
          cardConfig={cardConfig}
          aiReasoningMode={aiReasoningMode}
        />
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
  // Determine card variant based on layout
  const getCardVariant = (): 'default' | 'compact' | 'list' => {
    if (layout === 'list') return 'list';
    if (layout === 'carousel') return 'compact';
    return 'default'; // grid uses default
  };

  const cardVariant = getCardVariant();

  const cards = products.map((product) => (
    <ProductCard 
      key={product.id} 
      product={product} 
      config={cardConfig} 
      variant={cardVariant}
      aiReasoningMode={aiReasoningMode} 
    />
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
