import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../../types/message';
import { CardConfig, CardLayout, DEFAULT_CARD_CONFIG, CardDesign, ImageRatio, MessengerState } from '../../types/product';
import { MessageBubble } from './MessageBubble';

interface MessengerThreadProps {
  messages: Message[];
  cardConfig?: CardConfig;
  layout?: CardLayout;
  cardDesign?: CardDesign;
  imageRatio?: ImageRatio;
  messengerState?: MessengerState;
  isLoading?: boolean;
  aiReasoningMode?: boolean;
}

// Status messages that cycle during loading - simulates system transparency
const LOADING_STAGES = [
  'Understanding your request',
  'Analyzing what you need',
  'Searching the catalog',
  'Looking through options',
  'Comparing products',
  'Finding the best matches',
  'Evaluating quality and reviews',
  'Considering your preferences',
  'Selecting top recommendations',
  'Crafting personalized suggestions',
  'Putting it all together',
  'Almost ready',
];

export function MessengerThread({ 
  messages, 
  cardConfig = DEFAULT_CARD_CONFIG,
  layout = 'carousel',
  cardDesign = 'current',
  imageRatio = 'portrait',
  messengerState = 'default',
  isLoading = false,
  aiReasoningMode = false,
}: MessengerThreadProps) {
  const threadEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevFirstMessageId = useRef<string | null>(null);

  // Detect full conversation reset vs. new message appended
  useEffect(() => {
    const firstId = messages.length > 0 ? messages[0].id : null;
    if (firstId !== prevFirstMessageId.current) {
      // Conversation was replaced — scroll to top
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // New message appended — scroll to bottom
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevFirstMessageId.current = firstId;
  }, [messages]);

  // Scroll to top when display settings change (card design, layout, etc.)
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [cardDesign, layout, imageRatio]);

  const isEmpty = messages.length === 0;

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto messenger-scroll bg-white">
      {/* Figma: px-16px, gap-16px, pb-16px */}
      <div className="px-4 pt-4 pb-4 flex flex-col gap-4">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                cardConfig={cardConfig}
                layout={layout}
                cardDesign={cardDesign}
                imageRatio={imageRatio}
                messengerState={messengerState}
                aiReasoningMode={aiReasoningMode}
              />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={threadEndRef} />
      </div>
    </div>
  );
}

// Empty state when no messages
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-6">
      <h3 className="text-neutral-900 font-medium mb-1">Hi there! 👋</h3>
      <p className="text-neutral-500 text-sm max-w-[240px]">
        I'm Fin, your AI shopping assistant. Ask me about products, recommendations, or anything I can help with!
      </p>
    </div>
  );
}

// Typing indicator when agent is "thinking" - shows cycling status messages inside chat bubble
function TypingIndicator() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % LOADING_STAGES.length);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      className="max-w-[336px] px-4 py-3 rounded-[20px] overflow-hidden"
      style={{ backgroundColor: '#f5f5f5' }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={stageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="text-sm shimmer-text block"
        >
          {LOADING_STAGES[stageIndex]}...
        </motion.span>
      </AnimatePresence>
      
      {/* CSS for shimmer animation */}
      <style>{`
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #525252 0%,
            #737373 25%,
            #a3a3a3 50%,
            #737373 75%,
            #525252 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
