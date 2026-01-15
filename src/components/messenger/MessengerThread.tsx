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
    <div className="flex-1 overflow-y-auto messenger-scroll bg-white">
      <div className="p-4 space-y-4">
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
      <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
        <span className="text-white text-xl font-bold">F</span>
      </div>
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
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-semibold">F</span>
      </div>
      <div className="bg-neutral-100 px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
