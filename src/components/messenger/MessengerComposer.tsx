import { useState } from 'react';

interface MessengerComposerProps {
  onSend?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessengerComposer({ 
  onSend, 
  disabled = false,
  placeholder = "Ask your question..."
}: MessengerComposerProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const sendMessage = () => {
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="px-4 pb-4 bg-white">
      <form onSubmit={handleSubmit}>
        <div 
          style={{ 
            border: '1px solid',
            borderColor: isFocused ? '#2a2a2a' : '#e5e5e5',
            borderRadius: '16px',
            backgroundColor: 'white',
          }}
        >
          {/* Text input */}
          <div className="px-4 pt-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full bg-transparent focus:outline-none text-sm"
              style={{ 
                color: '#14161a',
                lineHeight: '1.5',
              }}
            />
          </div>
          
          {/* Icons row */}
          <div 
            className="flex items-center justify-between"
            style={{ padding: '4px 8px 8px 12px' }}
          >
            {/* Left icons */}
            <div className="flex items-center gap-2">
              {/* Attachment */}
              <button 
                type="button"
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
                aria-label="Attach file"
              >
                <img src="/src/components/icons/attachment.svg" alt="" className="w-4 h-4 opacity-50" />
              </button>
              {/* Emoji */}
              <button 
                type="button"
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
                aria-label="Add emoji"
              >
                <img src="/src/components/icons/emoji.svg" alt="" className="w-4 h-4 opacity-50" />
              </button>
              {/* GIF */}
              <button 
                type="button"
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
                aria-label="Add GIF"
              >
                <img src="/src/components/icons/GIF.svg" alt="" className="w-4 h-4 opacity-50" />
              </button>
              {/* Microphone */}
              <button 
                type="button"
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
                aria-label="Voice message"
              >
                <img src="/src/components/icons/microphone.svg" alt="" className="w-4 h-4 opacity-50" />
              </button>
            </div>
            
            {/* Send button - 32x32 circle */}
            <button
              type="submit"
              disabled={disabled || !message.trim()}
              className={`w-8 h-8 rounded-full flex items-center justify-center disabled:cursor-not-allowed transition-colors ${
                message.trim() ? 'bg-[#2a2a2a]' : 'bg-neutral-100 opacity-40'
              }`}
              aria-label="Send message"
            >
              <img 
                src="/src/components/icons/submit.svg" 
                alt="" 
                className={`w-4 h-4 ${message.trim() ? 'invert' : 'opacity-60'}`} 
              />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
