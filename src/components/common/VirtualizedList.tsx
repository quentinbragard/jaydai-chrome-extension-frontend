import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T) => React.ReactNode;
  listRef?: React.Ref<FixedSizeList>;
}

export function VirtualizedList<T>({ items, itemHeight, height, renderItem, listRef }: VirtualizedListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>{renderItem(items[index])}</div>
  );

  return (
    <FixedSizeList
      ref={listRef as any}
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
