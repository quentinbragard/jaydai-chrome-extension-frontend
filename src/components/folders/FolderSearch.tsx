// src/components/templates/FolderSearch.tsx
import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FolderSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholderText?: string;
  onReset?: () => void;
  className?: string;
}

/**
 * Search component for folders and templates
 */
export function FolderSearch({
  searchQuery,
  onSearchChange,
  placeholderText = 'Search folders...',
  onReset,
  className = ''
}: FolderSearchProps) {
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };
  
  // Handle reset button click
  const handleReset = () => {
    onSearchChange('');
    if (onReset) {
      onReset();
    }
  };
  
  return (
    <div className={`jd-p-4 ${className}`}>
      <div className="jd-flex jd-items-center jd-relative jd-mb-2">
        <div className="jd-absolute jd-left-2 jd-pointer-events-none">
          <Search className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
        </div>
        <Input 
          value={searchQuery} 
          onChange={handleSearchChange}
          placeholder={placeholderText}
          className="jd-w-full jd-pl-8 jd-pr-8"
        />
        {searchQuery && (
          <div className="jd-absolute jd-right-1">
            <Button
              variant="ghost"
              size="sm"
              className="jd-h-6 jd-w-6 jd-p-0"
              onClick={handleReset}
            >
              <X className="jd-h-4 jd-w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}