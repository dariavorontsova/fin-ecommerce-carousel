import { useRef, useEffect } from 'react';
import { Message } from '../../types/message';
import { CardConfig, CardLayout, DEFAULT_CARD_CONFIG } from '../../types/product';
import { MessageBubble } from './MessageBubble';

interface MessengerThreadProps {
  messages: Message[];
  cardConfig?: CardConfig;
  layout?: CardLayout;
  isLoading?: boolean;
  aiReasoningMode?: boolean;
}

export function MessengerThread({ 
  messages, 
  cardConfig = DEFAULT_CARD_CONFIG,
  layout = 'carousel',
  isLoading = false,
  aiReasoningMode = false,
}: MessengerThreadProps) {
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full overflow-y-auto messenger-scroll bg-white">
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

// Typing indicator when agent is "thinking"
function TypingIndicator() {
  return (
    <div 
      className="px-4 py-3 rounded-[20px] inline-block"
      style={{ backgroundColor: '#f5f5f5' }}
    >
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#6c6f74', animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#6c6f74', animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#6c6f74', animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
