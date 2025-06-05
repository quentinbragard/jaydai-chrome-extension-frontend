// src/components/prompts/quick-selector/QuickBlockSelector.tsx
// This is a floating dropdown component, NOT a dialog
// It appears at the cursor position when users type "//j"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useShadowRoot } from '@/core/utils/componentInjector';
import { Block, BlockType } from '@/types/prompts/blocks';
import { blocksApi } from '@/services/api/BlocksApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { insertIntoPromptArea } from '@/utils/templates/placeholderUtils';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { 
  Search, 
  Filter, 
  Maximize2,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { toast } from 'sonner';
import {
  getBlockTypeIcon,
  getBlockIconColors,
  BLOCK_TYPE_LABELS,
  getLocalizedContent,
  buildPromptPart
} from '@/components/prompts/blocks/blockUtils';
import { BlockItem } from './BlockItem';

// Quick filter types
const QUICK_FILTERS = [
  { type: 'all', label: 'All', icon: '📋' },
  { type: 'role', label: 'Role', icon: '👤' },
  { type: 'context', label: 'Context', icon: '📝' },
  { type: 'goal', label: 'Goal', icon: '🎯' },
  { type: 'example', label: 'Examples', icon: '💡' },
  { type: 'constraint', label: 'Constraints', icon: '🚫' },
] as const;

interface QuickBlockSelectorProps {
  position: { x: number; y: number };
  onClose: () => void;
  targetElement: HTMLElement;
  onOpenFullDialog: () => void;
}

export const QuickBlockSelector: React.FC<QuickBlockSelectorProps> = ({ 
  position, 
  onClose, 
  targetElement,
  onOpenFullDialog
}) => {
  const shadowRoot = useShadowRoot();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const isDark = useThemeDetector();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load blocks on mount
  useEffect(() => {
    blocksApi.getBlocks().then(res => {
      if (res.success) {
        setBlocks(res.data);
      }
      setLoading(false);
    });
  }, []);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
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
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab cycles through filters
      const filters = QUICK_FILTERS.map(f => f.type);
      const currentIndex = filters.indexOf(selectedFilter);
      const nextIndex = (currentIndex + 1) % filters.length;
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

  const handleSelectBlock = (block: Block) => {
    const content = getLocalizedContent(block.content);
    const text = buildPromptPart(block.type || 'content', content);
    insertIntoPromptArea(text);
    onClose();
    toast.success(`Inserted ${getLocalizedContent(block.title)} block`);
  };

  const openFullDialog = () => {
    onClose();
    onOpenFullDialog();
  };

  // Calculate position to avoid viewport edges
  const calculatePosition = () => {
    const padding = 10;
    const maxWidth = 400;
    const maxHeight = 480;
    
    let x = position.x;
    let y = position.y + 25; // Small offset below cursor

    // Check right edge
    if (x + maxWidth > window.innerWidth - padding) {
      x = window.innerWidth - maxWidth - padding;
    }

    // Check bottom edge
    if (y + maxHeight > window.innerHeight - padding) {
      y = position.y - maxHeight - 10; // Show above cursor if no space below
    }

    // Ensure minimum distance from edges
    x = Math.max(padding, x);
    y = Math.max(padding, y);

    return { x, y };
  };

  const { x, y } = calculatePosition();

  const darkLogo = chrome.runtime.getURL('images/full-logo-white.png');
  const lightLogo = chrome.runtime.getURL('images/full-logo-dark.png');

  return createPortal(
    <div
      ref={containerRef}
      className={cn(
        'jd-fixed jd-z-[2147483647] jd-w-[400px] jd-max-h-[480px]',
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
        // Ensure it's above everything
        zIndex: 2147483647,
        position: 'fixed'
      }}
    >
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b">
        <div className="jd-flex jd-items-center jd-gap-2">
        <img 
              src={isDark ? darkLogo : lightLogo}
              alt={isDark ? "Jaydai Logo Dark" : "Jaydai Logo Light"}
              className="jd-h-6 jd-pl-2"
            />
          <span className="jd-text-sm jd-font-semibold">Quick Blocks</span>
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
      <div className="jd-p-3 jd-pb-2">
        <div className="jd-relative">
          <Search className="jd-absolute jd-left-2.5 jd-top-1/2 -jd-translate-y-1/2 jd-h-3.5 jd-w-3.5 jd-text-muted-foreground" />
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
      <div className="jd-px-3 jd-pb-2">
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
        </div>
      </div>

      {/* Blocks List */}
      <ScrollArea className="jd-flex-1 jd-px-3 jd-pb-3">
        {loading ? (
          <div className="jd-py-8">
            <LoadingSpinner size="sm" message="Loading blocks..." />
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="jd-py-8 jd-text-center jd-text-sm jd-text-muted-foreground">
            {search ? `No blocks found for "${search}"` : 'No blocks available'}
          </div>
        ) : (
          <div className="jd-space-y-1">
            {filteredBlocks.map((block, index) => (
              <BlockItem
                key={block.id}
                block={block}
                isDark={isDark}
                onSelect={handleSelectBlock}
                isActive={index === activeIndex}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer hints */}
      <div className="jd-px-3 jd-py-2 jd-border-t jd-flex jd-items-center jd-justify-between jd-text-[10px] jd-text-muted-foreground">
        <span>↑↓ Navigate • Enter Select • Tab Filter</span>
        <span>{filteredBlocks.length} blocks</span>
      </div>
    </div>,
    shadowRoot || document.body
  );
};