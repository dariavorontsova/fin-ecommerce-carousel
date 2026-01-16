import { MessengerHeader } from './MessengerHeader';
import { MessengerComposer } from './MessengerComposer';
import { MessengerThread } from './MessengerThread';
import { Message } from '../../types/message';
import { CardConfig, CardLayout, DEFAULT_CARD_CONFIG } from '../../types/product';

export type MessengerState = 'default' | 'expanded';

interface MessengerProps {
  state?: MessengerState;
  messages?: Message[];
  cardConfig?: CardConfig;
  layout?: CardLayout;
  isLoading?: boolean;
  aiReasoningMode?: boolean;
  onSend?: (message: string) => void;
  onBack?: () => void;
  onMenu?: () => void;
  onClose?: () => void;
}

export function Messenger({ 
  state = 'default',
  messages = [],
  cardConfig = DEFAULT_CARD_CONFIG,
  layout = 'carousel',
  isLoading = false,
  aiReasoningMode = false,
  onSend,
  onBack,
  onMenu,
  onClose,
}: MessengerProps) {
  const isExpanded = state === 'expanded';
  
  return (
    <div 
      className={`
        flex flex-col bg-white overflow-hidden
        transition-all duration-300 ease-out
        ${isExpanded ? 'w-[680px]' : 'w-[400px]'}
      `}
      style={{ 
        // Expanded: dynamic height with 24px from top edge
        // Bottom space: 24px (padding) + 48px (launcher) + 16px (gap) = 88px
        // Total: 24px top + 88px bottom = 112px
        height: isExpanded ? 'calc(100vh - 112px)' : '702px',
        maxHeight: isExpanded ? 'none' : '90vh',
        borderRadius: '24px',
        boxShadow: '0px 5px 40px rgba(15, 15, 15, 0.16)',
      }}
    >
      <MessengerHeader 
        onBack={onBack}
        onMenu={onMenu}
        onClose={onClose}
      />
      
      <div className="relative flex-1 min-h-0">
        <MessengerThread
          messages={messages}
          cardConfig={cardConfig}
          layout={layout}
          isLoading={isLoading}
          aiReasoningMode={aiReasoningMode}
        />
        {/* Gradient fade at bottom of thread - 16px tall */}
        <div 
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '16px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
          }}
        />
      </div>
      
      <MessengerComposer 
        onSend={onSend}
        disabled={isLoading}
      />
    </div>
  );
}

// Re-export subcomponents for flexibility
export { MessengerHeader } from './MessengerHeader';
export { MessengerComposer } from './MessengerComposer';
export { MessengerThread } from './MessengerThread';
export { MessageBubble } from './MessageBubble';