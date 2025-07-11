import React, { CSSProperties, useRef, useState } from 'react';

export interface ListChildComponentProps {
  index: number;
  style: CSSProperties;
}

interface FixedSizeListProps {
  height: number;
  width: number | string;
  itemCount: number;
  itemSize: number;
  className?: string;
  children: (props: ListChildComponentProps) => React.ReactElement;
}

export const FixedSizeList: React.FC<FixedSizeListProps> = ({
  height,
  width,
  itemCount,
  itemSize,
  children,
  className
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollOffset(e.currentTarget.scrollTop);
  };

  const startIndex = Math.floor(scrollOffset / itemSize);
  const endIndex = Math.min(
    itemCount - 1,
    Math.floor((scrollOffset + height) / itemSize)
  );

  const items = [] as React.ReactElement[];
  for (let i = startIndex; i <= endIndex; i++) {
    items.push(
      React.cloneElement(children({ index: i, style: {
        position: 'absolute',
        top: i * itemSize,
        height: itemSize,
        width: '100%'
      } }))
    );
  }

  return (
    <div
      style={{ position: 'relative', height, width, overflowY: 'auto' }}
      onScroll={onScroll}
      ref={containerRef}
      className={className}
    >
      <div style={{ height: itemCount * itemSize, width: '100%', position: 'relative' }}>
        {items}
      </div>
    </div>
  );
};
