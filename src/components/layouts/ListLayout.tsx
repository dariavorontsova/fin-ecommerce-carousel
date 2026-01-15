import { ReactNode } from 'react';

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
  const childArray = Array.isArray(children) ? children : [children];
  const displayChildren = maxItems ? childArray.slice(0, maxItems) : childArray;
  const hasMore = maxItems && childArray.length > maxItems;

  return (
    <div className="space-y-0" style={{ gap: `${gap}px` }}>
      <div className="flex flex-col" style={{ gap: `${gap}px` }}>
        {displayChildren}
      </div>
      
      {hasMore && (
        <button className="w-full py-2 text-sm text-intercom-blue hover:text-intercom-blue-dark transition-colors">
          Show {childArray.length - maxItems} more items
        </button>
      )}
    </div>
  );
}
