import { motion } from 'framer-motion';
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
    <motion.div 
      className="flex justify-end"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="max-w-[280px] px-4 py-3 rounded-[20px] bg-[#2a2a2a]">
        <p className="text-sm leading-[1.5] text-white">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}

// Animated text component - animates words appearing like ChatGPT streaming
// Handles paragraphs (split by \n\n) with proper spacing
function AnimatedText({ text }: { text: string }) {
  // Split into paragraphs, then words
  const paragraphs = text.split(/\n\n+/);
  let wordIndex = 0;
  
  return (
    <motion.div 
      className="text-sm leading-[20px] flex flex-col gap-3" 
      style={{ color: '#14161a' }}
      initial="hidden"
      animate="visible"
    >
      {paragraphs.map((paragraph, pIndex) => {
        const words = paragraph.split(' ');
        const paragraphStartIndex = wordIndex;
        wordIndex += words.length;
        
        return (
          <p key={pIndex} className="m-0">
            {words.map((word, wIndex) => (
              <motion.span
                key={wIndex}
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, filter: 'blur(4px)', y: 4 },
                  visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
                }}
                transition={{
                  duration: 0.25,
                  delay: (paragraphStartIndex + wIndex) * 0.03, // 30ms per word
                  ease: 'easeOut',
                }}
              >
                {word}
                {wIndex < words.length - 1 ? '\u00A0' : ''} {/* non-breaking space */}
              </motion.span>
            ))}
          </p>
        );
      })}
    </motion.div>
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

  // Calculate delay for products based on text length
  const wordCount = message.content.split(' ').length;
  const textAnimationDuration = wordCount * 0.03 + 0.25; // Total time for text to finish

  return (
    <motion.div 
      className="flex flex-col gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Text content - Figma: #f5f5f5, max-w 336px, 20px radius */}
      <motion.div 
        className="max-w-[336px] px-4 py-3 rounded-[20px]"
        style={{ backgroundColor: '#f5f5f5' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <AnimatedText text={message.content} />
      </motion.div>

      {/* Product recommendations - full width with staggered fade-in */}
      {hasProducts && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: textAnimationDuration, duration: 0.3 }}
        >
          <ProductLayout
            products={message.products!}
            layout={effectiveLayout}
            cardConfig={cardConfig}
            aiReasoningMode={aiReasoningMode}
          />
        </motion.div>
      )}
    </motion.div>
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
  const isSingleProduct = products.length === 1;
  
  // Determine card variant based on layout and product count
  const getCardVariant = (): 'default' | 'compact' | 'list' | 'single' => {
    if (isSingleProduct) return 'single'; // Full-width single card
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

  // Single product: render directly without carousel wrapper
  if (isSingleProduct) {
    return <div className="max-w-[336px]">{cards}</div>;
  }

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
