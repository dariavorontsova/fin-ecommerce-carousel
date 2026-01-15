interface MessengerHeaderProps {
  onBack?: () => void;
  onMenu?: () => void;
  onClose?: () => void;
}

export function MessengerHeader({ onBack, onMenu, onClose }: MessengerHeaderProps) {
  return (
    <div className="flex items-center h-[54px] px-[13px] py-[8px] border-b bg-white" style={{ borderColor: '#f5f5f5' }}>
      {/* Left side: Back + Avatar + Title */}
      <div className="flex-1 flex items-center gap-[2px]">
        {/* Back button - 36x36 */}
        <button 
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-100 transition-colors"
          aria-label="Go back"
        >
          <img src="/src/components/icons/back.svg" alt="" className="w-4 h-4 opacity-60" />
        </button>
        
        {/* Avatar + Title */}
        <div className="flex items-center gap-2 py-2">
          {/* Fin Logo - 32x32 */}
          <img 
            src="/src/components/icons/fin.svg" 
            alt="Fin" 
            className="w-8 h-8"
          />
          <span className="font-semibold text-sm" style={{ color: '#14161a' }}>Fin</span>
        </div>
      </div>

      {/* Right side: Menu + Close */}
      <div className="flex items-center">
        {/* Menu button - 36x36 */}
        <button 
          onClick={onMenu}
          className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-neutral-100 transition-colors"
          aria-label="Menu"
        >
          <img src="/src/components/icons/ellipsis.svg" alt="" className="w-4 h-4 opacity-60" />
        </button>
        {/* Close button - 36x36 */}
        <button 
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-neutral-100 transition-colors"
          aria-label="Close"
        >
          <img src="/src/components/icons/close.svg" alt="" className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
}
