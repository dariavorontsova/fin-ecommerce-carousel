interface MessengerHeaderProps {
  onBack?: () => void;
  onMenu?: () => void;
  onClose?: () => void;
}

export function MessengerHeader({ onBack, onMenu, onClose }: MessengerHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
      {/* Left side: Back + Logo + Title */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onBack}
          className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Intercom/Fin Logo */}
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Simplified Intercom asterisk logo */}
            <path d="M12 2L12 8" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 16L12 22" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4.93 4.93L9.17 9.17" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
            <path d="M14.83 14.83L19.07 19.07" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
            <path d="M2 12L8 12" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 12L22 12" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4.93 19.07L9.17 14.83" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
            <path d="M14.83 9.17L19.07 4.93" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="font-semibold text-neutral-900">Fin</span>
        </div>
      </div>

      {/* Right side: Menu + Close */}
      <div className="flex items-center gap-1">
        <button 
          onClick={onMenu}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600"
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
          </svg>
        </button>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
