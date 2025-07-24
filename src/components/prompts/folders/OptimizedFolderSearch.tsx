// src/components/prompts/folders/OptimizedFolderSearch.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Search, X, Loader2, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { getMessage } from '@/core/utils/i18n';

interface SearchFilters {
  type: 'all' | 'templates' | 'folders';
  source: 'all' | 'user' | 'organization' | 'company';
}

interface OptimizedFolderSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholderText?: string;
  onReset?: () => void;
  isSearching?: boolean;
  totalResults?: number;
  totalIndexedItems?: number;
  className?: string;
  showFilters?: boolean;
  filters?: SearchFilters;
  onFiltersChange?: (filters: SearchFilters) => void;
}

/**
 * Optimized search component with better UX, loading states, and filtering
 */
export function OptimizedFolderSearch({
  searchQuery,
  onSearchChange,
  placeholderText = 'Search templates and folders...',
  onReset,
  isSearching = false,
  totalResults = 0,
  totalIndexedItems = 0,
  className = '',
  showFilters = true,
  filters = { type: 'all', source: 'all' },
  onFiltersChange
}: OptimizedFolderSearchProps) {
  const [hasTriggeredAmplitudeEvent, setHasTriggeredAmplitudeEvent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    
    // Track search event only once per session
    if (!hasTriggeredAmplitudeEvent && value.length > 0) {
      trackEvent(EVENTS.TEMPLATE_SEARCH, { 
        search_content_first_letter: value.charAt(0),
        search_length: value.length
      });
      setHasTriggeredAmplitudeEvent(true);
    }
  }, [onSearchChange, hasTriggeredAmplitudeEvent]);
  
  // Handle reset button click
  const handleReset = useCallback(() => {
    onSearchChange('');
    setHasTriggeredAmplitudeEvent(false);
    if (onReset) {
      onReset();
    }
    inputRef.current?.focus();
  }, [onSearchChange, onReset]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Escape to clear search when focused
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        handleReset();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  // Filter change handlers
  const handleTypeFilter = useCallback((type: SearchFilters['type']) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, type });
    }
  }, [filters, onFiltersChange]);

  const handleSourceFilter = useCallback((source: SearchFilters['source']) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, source });
    }
  }, [filters, onFiltersChange]);

  return (
    <div className={`jd-p-4 ${className}`}>
      {/* Search Input */}
      <div className="jd-flex jd-items-center jd-relative jd-mb-2">
        {/* Search Icon or Loading Spinner */}
        <div className="jd-absolute jd-left-3 jd-pointer-events-none jd-z-10">
          {isSearching ? (
            <Loader2 className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-animate-spin" />
          ) : (
            <Search className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
          )}
        </div>

        <Input 
          ref={inputRef}
          value={searchQuery} 
          onChange={handleSearchChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholderText}
          className="jd-w-full jd-pl-10 jd-pr-20 jd-transition-all jd-duration-200"
          style={{
            // Add subtle focus ring
            boxShadow: isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : undefined
          }}
        />

        {/* Right side controls */}
        <div className="jd-absolute jd-right-2 jd-flex jd-items-center jd-gap-1">
          {/* Filters dropdown */}
          {showFilters && onFiltersChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="jd-p-0 jd-opacity-70 hover:jd-opacity-100"
                  title="Filter search results"
                >
                  <Filter className="jd-h-3 jd-w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="jd-w-48">
                <div className="jd-px-2 jd-py-1 jd-text-xs jd-font-medium jd-text-muted-foreground">
                  {getMessage('searchFilters', undefined, 'Search Filters')}
                </div>
                <DropdownMenuSeparator />
                
                <div className="jd-px-2 jd-py-1 jd-text-xs jd-font-medium jd-text-muted-foreground">
                  {getMessage('contentType', undefined, 'Content Type')}
                </div>
                <DropdownMenuItem onClick={() => handleTypeFilter('all')}>
                  <span className={filters.type === 'all' ? 'jd-font-semibold' : ''}>
                    {getMessage('all', undefined, 'All')}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeFilter('templates')}>
                  <span className={filters.type === 'templates' ? 'jd-font-semibold' : ''}>
                    {getMessage('templates', undefined, 'Templates')}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeFilter('folders')}>
                  <span className={filters.type === 'folders' ? 'jd-font-semibold' : ''}>
                    {getMessage('folders', undefined, 'Folders')}
                  </span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <div className="jd-px-2 jd-py-1 jd-text-xs jd-font-medium jd-text-muted-foreground">
                  {getMessage('source', undefined, 'Source')}
                </div>
                <DropdownMenuItem onClick={() => handleSourceFilter('all')}>
                  <span className={filters.source === 'all' ? 'jd-font-semibold' : ''}>
                    {getMessage('all', undefined, 'All')}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSourceFilter('user')}>
                  <span className={filters.source === 'user' ? 'jd-font-semibold' : ''}>
                    {getMessage('user', undefined, 'My Templates')}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSourceFilter('organization')}>
                  <span className={filters.source === 'organization' ? 'jd-font-semibold' : ''}>
                    {getMessage('organization', undefined, 'Organization')}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSourceFilter('company')}>
                  <span className={filters.source === 'company' ? 'jd-font-semibold' : ''}>
                    {getMessage('company', undefined, 'Company')}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Clear search button */}
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="jd-p-0 jd-opacity-70 hover:jd-opacity-100"
              onClick={handleReset}
              title="Clear search"
            >
              <X className="jd-h-3 jd-w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Status and Results */}
      {searchQuery && (
        <div className="jd-flex jd-items-center jd-justify-between jd-text-xs jd-text-muted-foreground jd-mb-2">
          <div className="jd-flex jd-items-center jd-gap-2">
            {isSearching ? (
              <span>{getMessage('searching', undefined, 'Searching...')}</span>
            ) : (
              <span>
                {totalResults > 0 
                  ? getMessage('searchResultsFound', [totalResults.toString()], `${totalResults} results found`)
                  : getMessage('noResultsFound', undefined, 'No results found')
                }
              </span>
            )}
            
            {/* Active filters */}
            <div className="jd-flex jd-gap-1">
              {filters.type !== 'all' && (
                <Badge variant="secondary" className="jd-text-xs jd-px-1 jd-py-0">
                  {filters.type}
                </Badge>
              )}
              {filters.source !== 'all' && (
                <Badge variant="secondary" className="jd-text-xs jd-px-1 jd-py-0">
                  {filters.source}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Index info for development */}
      {process.env.NODE_ENV === 'development' && totalIndexedItems > 0 && (
        <div className="jd-text-xs jd-text-muted-foreground jd-opacity-50">
          {totalIndexedItems} items indexed
        </div>
      )}
    </div>
  );
}