import { ReactNode } from 'react';

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
  const childArray = Array.isArray(children) ? children : [children];
  const displayChildren = maxItems ? childArray.slice(0, maxItems) : childArray;
  const hasMore = maxItems && childArray.length > maxItems;

  return (
    <div>
      <div 
        className={`grid ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
        style={{ gap: `${gap}px` }}
      >
        {displayChildren}
      </div>
      
      {hasMore && (
        <button className="w-full py-3 mt-3 text-sm text-intercom-blue hover:text-intercom-blue-dark transition-colors border-t border-messenger-border">
          View all {childArray.length} items
        </button>
      )}
    </div>
  );
}
