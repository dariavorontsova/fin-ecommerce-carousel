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
    <div className="border-t border-neutral-200 bg-white p-3">
      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-neutral-50 rounded-2xl border border-neutral-200 focus-within:border-neutral-300 transition-colors">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-4 py-2.5 bg-transparent text-messenger-text placeholder:text-messenger-text-muted focus:outline-none text-sm"
            />
            
            {/* Action icons row */}
            <div className="flex items-center gap-1 px-3 pb-2">
              <button 
                type="button"
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-neutral-600"
                aria-label="Attach file"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.75 8.5L9.5 14.75C8.25 16 6.25 16 5 14.75C3.75 13.5 3.75 11.5 5 10.25L11.25 4C12.08 3.17 13.42 3.17 14.25 4C15.08 4.83 15.08 6.17 14.25 7L8 13.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                type="button"
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-neutral-600"
                aria-label="Add emoji"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="6.5" cy="7.5" r="1" fill="currentColor"/>
                  <circle cx="11.5" cy="7.5" r="1" fill="currentColor"/>
                  <path d="M6 11C6.5 12 7.5 12.5 9 12.5C10.5 12.5 11.5 12 12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <button 
                type="button"
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-neutral-600"
                aria-label="Add GIF"
              >
                <span className="text-xs font-medium px-1 border border-current rounded">GIF</span>
              </button>
              <button 
                type="button"
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-neutral-600"
                aria-label="Voice message"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 8V9C3 12.3137 5.68629 15 9 15C12.3137 15 15 12.3137 15 9V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 15V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Send button */}
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="p-2.5 bg-neutral-100 rounded-full hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 16V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M5 9L10 4L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
