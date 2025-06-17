// src/components/prompts/common/Pagination.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  className?: string;
}

/**
 * Reusable pagination component for template and folder lists
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  className = ''
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`jd-flex jd-justify-center jd-mt-3 ${className}`}>
      <div className="jd-flex jd-items-center jd-space-x-1 jd-bg-background/80 jd-border jd-border-border/30 jd-rounded jd-px-2 jd-py-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={!hasPrev}
          className="jd-h-6 jd-w-6"
          title="Previous page"
        >
          <ChevronLeft className="jd-h-3.5 jd-w-3.5" />
        </Button>
        
        <div className="jd-flex jd-items-center jd-gap-1">
          <span className="jd-text-xs jd-text-muted-foreground jd-px-2">
            {currentPage + 1} / {totalPages}
          </span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={!hasNext}
          className="jd-h-6 jd-w-6"
          title="Next page"
        >
          <ChevronRight className="jd-h-3.5 jd-w-3.5" />
        </Button>
      </div>
    </div>
  );
}