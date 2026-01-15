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
        ${isExpanded ? 'w-[700px]' : 'w-[400px]'}
      `}
      style={{ 
        height: isExpanded ? '702px' : '702px',
        maxHeight: '90vh',
        borderRadius: '24px',
        boxShadow: '0px 5px 40px rgba(15, 15, 15, 0.16)',
      }}
    >
      <MessengerHeader 
        onBack={onBack}
        onMenu={onMenu}
        onClose={onClose}
      />
      
      <MessengerThread
        messages={messages}
        cardConfig={cardConfig}
        layout={layout}
        isLoading={isLoading}
        aiReasoningMode={aiReasoningMode}
      />
      
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