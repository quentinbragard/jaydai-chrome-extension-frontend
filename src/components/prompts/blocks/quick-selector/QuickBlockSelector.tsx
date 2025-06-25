// src/components/prompts/blocks/quick-selector/QuickBlockSelector.tsx
// This is a floating dropdown component, NOT a dialog
// It appears at the cursor position when users type "//j"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useShadowRoot } from '@/core/utils/componentInjector';
import { Block } from '@/types/prompts/blocks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { Search, Maximize2, X, Plus } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import {
  getBlockTypeIcon,
  getBlockIconColors,
  BLOCK_TYPE_LABELS,
  getLocalizedContent
} from '@/utils/prompts/blockUtils';
import { BlockItem } from './BlockItem';
import { useBlocks } from './useBlocks';
import { useBlockInsertion } from './useBlockInsertion';
import { calculateDropdownPosition } from './positionUtils';

// Quick filter types
const QUICK_FILTERS = [
  { type: 'all', label: 'All', icon: '📋' },
  { type: 'role', label: 'Role', icon: '👤' },
  { type: 'context', label: 'Context', icon: '📝' },
  { type: 'goal', label: 'Goal', icon: '🎯' },
  { type: 'example', label: 'Example', icon: '💡' },
  { type: 'constraint', label: 'Constraint', icon: '🚫' },
] as const;

interface QuickBlockSelectorProps {
  position: { x: number; y: number };
  onClose: () => void;
  targetElement: HTMLElement;
  onOpenFullDialog: () => void;
  cursorPosition?: number; // Store the original cursor position
  triggerLength?: number;
}

export const QuickBlockSelector: React.FC<QuickBlockSelectorProps> = ({
  position,
  onClose,
  targetElement,
  onOpenFullDialog,
  cursorPosition,
  triggerLength
}) => {
  const shadowRoot = useShadowRoot();
  const { blocks, loading } = useBlocks();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const isDark = useThemeDetector();
  const { openCreateBlock } = useDialogActions();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current) {
        const path = e.composedPath ? e.composedPath() : [];
        if (!path.includes(containerRef.current)) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Filter blocks
  const filteredBlocks = blocks.filter(b => {
    const title = getLocalizedContent(b.title);
    const content = getLocalizedContent(b.content);
    const term = search.toLowerCase();
    const matchesSearch = title.toLowerCase().includes(term) || content.toLowerCase().includes(term);
    const matchesType = selectedFilter === 'all' || b.type === selectedFilter;
    return matchesSearch && matchesType;
  });

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filteredBlocks.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredBlocks[activeIndex]) {
        handleSelectBlock(filteredBlocks[activeIndex]);
      }
    } else if (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const filters = QUICK_FILTERS.map(f => f.type);
      const currentIndex = filters.indexOf(selectedFilter);
      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight' || e.key === 'Tab') {
        nextIndex = (currentIndex + 1) % filters.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + filters.length) % filters.length;
      }
      setSelectedFilter(filters[nextIndex]);
    }
  }, [filteredBlocks, activeIndex, selectedFilter]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset active index when search or filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [search, selectedFilter]);

  // Scroll the active item into view when navigating
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const { insertBlock } = useBlockInsertion(targetElement, cursorPosition, onClose, triggerLength);
  const handleSelectBlock = (block: Block) => insertBlock(block);

  const openFullDialog = () => {
    onClose();
    onOpenFullDialog();
  };

  // Calculate position to avoid viewport edges
  const { x, y } = calculateDropdownPosition(position);

  const darkLogo = chrome.runtime.getURL('images/full-logo-white.png');
  const lightLogo = chrome.runtime.getURL('images/full-logo-dark.png');

  return createPortal(
    <div
      ref={containerRef}
      className={cn(
        'jd-fixed jd-z-[10000] jd-w-[400px] jd-h-[480px]',
        'jd-bg-background jd-border jd-rounded-lg jd-shadow-xl',
        'jd-flex jd-flex-col jd-animate-in jd-fade-in jd-slide-in-from-bottom-2',
        isDark ? 'jd-border-gray-700' : 'jd-border-gray-200'
      )}
      style={{ 
        left: `${x}px`, 
        top: `${y}px`,
        // Ensure proper background and isolation
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
        fontSize: '14px',
        lineHeight: '1.5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        // Reset any inherited styles
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        // Ensure it's above page content but below dialogs
        zIndex: 10000,
        position: 'fixed'
      }}
    >
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-flex-shrink-0">
        <div className="jd-flex jd-items-center jd-gap-2">
        <img 
              src={isDark ? darkLogo : lightLogo}
              alt={isDark ? "Jaydai Logo Dark" : "Jaydai Logo Light"}
              className="jd-h-6 jd-pl-2"
            />
        </div>
        <div className="jd-flex jd-items-center jd-gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={openFullDialog}
            className="jd-h-7 jd-px-2 jd-text-xs"
            title="Open block builder"
          >
            <Maximize2 className="jd-h-3 jd-w-3 jd-mr-1" />
            Builder
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="jd-h-7 jd-w-7 jd-p-0"
          >
            <X className="jd-h-3 jd-w-3" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="jd-p-3 jd-pb-2 jd-flex-shrink-0">
        <div className="jd-relative">
          <Search className="jd-absolute jd-left-2.5 jd-top-1/2 -jd-translate-y-1/2 jd-h-4 jd-w-4 jd-text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search blocks..."
            className="jd-pl-8 jd-h-8 jd-text-sm"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="jd-px-3 jd-pb-2 jd-flex-shrink-0">
        <div className="jd-flex jd-items-center jd-gap-1 jd-flex-wrap">
          {QUICK_FILTERS.map(filter => (
            <button
              key={filter.type}
              onClick={() => setSelectedFilter(filter.type)}
              className={cn(
                'jd-px-2 jd-py-1 jd-text-xs jd-rounded-md jd-transition-colors',
                'jd-flex jd-items-center jd-gap-1',
                selectedFilter === filter.type
                  ? 'jd-bg-primary jd-text-primary-foreground'
                  : 'jd-bg-muted jd-hover:jd-bg-muted/80'
              )}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
          <button
            onClick={() => openCreateBlock()}
            className="jd-px-2 jd-py-1 jd-text-xs jd-rounded-md jd-transition-colors jd-flex jd-items-center jd-gap-1 jd-border jd-border-dashed jd-bg-muted hover:jd-bg-muted/80"
          >
            <Plus className="jd-h-3 jd-w-3" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Blocks List - Fixed height with proper scrolling */}
      <div className="jd-flex-1 jd-px-3 jd-pb-3 jd-min-h-0">
        <ScrollArea className="jd-h-full">
          {loading ? (
            <div className="jd-py-8">
              <LoadingSpinner size="sm" message="Loading blocks..." />
            </div>
          ) : filteredBlocks.length === 0 ? (
            <div className="jd-py-8 jd-text-center jd-text-sm jd-text-muted-foreground">
              {search ? `No blocks found for "${search}"` : 'No blocks available'}
            </div>
          ) : (
            <div className="jd-space-y-1 jd-pr-2">
              {filteredBlocks.map((block, index) => (
                <BlockItem
                  key={block.id}
                  block={block}
                  isDark={isDark}
                  onSelect={handleSelectBlock}
                  isActive={index === activeIndex}
                  itemRef={el => (itemRefs.current[index] = el)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer hints */}
      <div className="jd-px-3 jd-py-2 jd-border-t jd-flex jd-items-center jd-justify-between jd-text-[10px] jd-text-muted-foreground jd-flex-shrink-0">
        <span>↑↓ Navigate • ←→ Filter • Enter Select</span>
        <span>{filteredBlocks.length} blocks</span>
      </div>
    </div>,
    shadowRoot || document.body
  );
};