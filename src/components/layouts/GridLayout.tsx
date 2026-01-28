import { ReactNode, Children } from 'react';
import { motion } from 'framer-motion';

interface GridLayoutProps {
  children: ReactNode;
  columns?: 2 | 3;
  gap?: number;
  maxItems?: number;
}

export function GridLayout({ 
  children, 
  columns = 2,
  gap = 12,
  maxItems 
}: GridLayoutProps) {
  // Convert children to array and optionally limit
  const childArray = Children.toArray(children);
  const displayChildren = maxItems ? childArray.slice(0, maxItems) : childArray;
  const hasMore = maxItems && childArray.length > maxItems;

  return (
    <div>
      <div 
        className={`grid ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
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
