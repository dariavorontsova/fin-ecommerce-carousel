import { useRef, useState, useEffect, ReactNode, Children } from 'react';
import { motion } from 'framer-motion';

interface CarouselLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  gap?: number;
}

export function CarouselLayout({ 
  children, 
  showNavigation = true,
  gap = 8 // Figma spec: 8px gap between cards
}: CarouselLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const el = scrollRef.current;
    if (!el) return;
    
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollability);
      // Also check on resize
      const resizeObserver = new ResizeObserver(checkScrollability);
      resizeObserver.observe(el);
      return () => {
        el.removeEventListener('scroll', checkScrollability);
        resizeObserver.disconnect();
      };
    }
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div 
      className="relative"
      style={{
        // Extend beyond parent padding to full messenger width
        marginLeft: '-16px',
        marginRight: '-16px',
        // Allow shadows to be visible
        overflow: 'visible',
      }}
    >
      {/* Scroll container - with padding to maintain card start position and shadow space */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{ 
          gap: `${gap}px`,
          paddingLeft: '16px',
          paddingRight: '16px',
          // Extra padding for shadows (shadow blur is 28px, so need ~32px space)
          paddingTop: '32px',
          paddingBottom: '32px',
          // Compensate with negative margin so layout doesn't shift
          marginTop: '-32px',
          marginBottom: '-32px',
        }}
      >
        {Children.map(children, (child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.35,
              delay: index * 0.08, // Stagger each card by 80ms
              ease: [0.25, 0.1, 0.25, 1], // Smooth easing
            }}
          >
            {child}
          </motion.div>
        ))}
      </div>

      {/* Right navigation arrow - no border, just shadow */}
      {showNavigation && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-gray-50"
          style={{
            right: '8px',
            boxShadow: '0px 1px 4px rgba(9, 14, 21, 0.06), 0px 4px 28px rgba(9, 14, 21, 0.06)',
          }}
          aria-label="Scroll right"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L10 8L6 12" stroke="#14161a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Left navigation arrow - no border, just shadow */}
      {showNavigation && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-gray-50"
          style={{
            left: '8px',
            boxShadow: '0px 1px 4px rgba(9, 14, 21, 0.06), 0px 4px 28px rgba(9, 14, 21, 0.06)',
          }}
          aria-label="Scroll left"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="#14161a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}
