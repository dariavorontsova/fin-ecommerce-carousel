import { ReactNode, Children } from 'react';
import { motion } from 'framer-motion';
import { MessengerState } from '../../types/product';

interface GridLayoutProps {
  children: ReactNode;
  columns?: 2 | 3;
  gap?: number;
  maxItems?: number;
  messengerState?: MessengerState;
}

export function GridLayout({ 
  children, 
  columns,
  gap = 12,
  maxItems,
  messengerState = 'default',
}: GridLayoutProps) {
  // Auto-determine columns: 2 for default, 3 for expanded
  const effectiveColumns = columns ?? (messengerState === 'expanded' ? 3 : 2);
  // Convert children to array and optionally limit
  const childArray = Children.toArray(children);
  const displayChildren = maxItems ? childArray.slice(0, maxItems) : childArray;
  const hasMore = maxItems && childArray.length > maxItems;

  return (
    <div>
      <div 
        className={`grid ${effectiveColumns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
        style={{ gap: `${gap}px` }}
      >
        {displayChildren.map((child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            {child}
          </motion.div>
        ))}
      </div>
      
      {hasMore && (
        <button className="w-full py-3 mt-3 text-sm text-intercom-blue hover:text-intercom-blue-dark transition-colors border-t border-messenger-border">
          View all {childArray.length} items
        </button>
      )}
    </div>
  );
}
