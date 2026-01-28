import { ReactNode, Children } from 'react';
import { motion } from 'framer-motion';

interface ListLayoutProps {
  children: ReactNode;
  gap?: number;
  maxItems?: number;
}

export function ListLayout({ 
  children, 
  gap = 8,
  maxItems 
}: ListLayoutProps) {
  // Convert children to array and optionally limit
  const childArray = Children.toArray(children);
  const displayChildren = maxItems ? childArray.slice(0, maxItems) : childArray;
  const hasMore = maxItems && childArray.length > maxItems;

  return (
    <div className="space-y-0" style={{ gap: `${gap}px` }}>
      <div className="flex flex-col" style={{ gap: `${gap}px` }}>
        {displayChildren.map((child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.06,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            {child}
          </motion.div>
        ))}
      </div>
      
      {hasMore && (
        <button className="w-full py-2 text-sm text-intercom-blue hover:text-intercom-blue-dark transition-colors">
          Show {childArray.length - (maxItems || 0)} more items
        </button>
      )}
    </div>
  );
}
