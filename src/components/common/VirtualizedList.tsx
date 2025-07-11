import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T) => React.ReactNode;
}

export function VirtualizedList<T>({ items, itemHeight, height, renderItem }: VirtualizedListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>{renderItem(items[index])}</div>
  );

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={5}
    >
      {Row}
    </FixedSizeList>
  );
}
