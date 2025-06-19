// src/components/dialogs/prompts/editors/BasicEditor/PlaceholderPanel.tsx - Enhanced Version
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCcw } from "lucide-react";

interface Placeholder {
  key: string;
  value: string;
}

interface PlaceholderPanelProps {
  placeholders: Placeholder[];
  inputRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  activeInputIndex: React.MutableRefObject<number | null>;
  onUpdatePlaceholder: (index: number, value: string) => void;
  onResetPlaceholders?: () => void; // New optional prop
}

export const PlaceholderPanel: React.FC<PlaceholderPanelProps> = ({
  placeholders,
  inputRefs,
  activeInputIndex,
  onUpdatePlaceholder,
  onResetPlaceholders
}) => {
  // Count filled placeholders
  const filledCount = placeholders.filter(p => p.value.trim()).length;
  const totalCount = placeholders.length;

  return (
    <div className="jd-h-[60vh] jd-space-y-4 jd-overflow-auto jd-p-4">
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
        <h3 className="jd-text-sm jd-font-medium">
          Replace Placeholders
          {totalCount > 0 && (
            <span className="jd-ml-2 jd-text-xs jd-text-muted-foreground">
              ({filledCount}/{totalCount} filled)
            </span>
          )}
        </h3>
        
        {/* Reset button */}
        {onResetPlaceholders && filledCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetPlaceholders}
            className="jd-h-7 jd-px-2 jd-text-xs jd-text-muted-foreground hover:jd-text-foreground"
            title="Reset all placeholders"
          >
            <RotateCcw className="jd-h-3 jd-w-3" />
          </Button>
        )}
      </div>
      
      {placeholders.length > 0 ? (
        <ScrollArea className="jd-h-full">
          <div className="jd-space-y-4 jd-pr-4">
            {placeholders.map((placeholder, idx) => (
              <PlaceholderInput
                key={placeholder.key + idx}
                placeholder={placeholder}
                index={idx}
                inputRefs={inputRefs}
                activeInputIndex={activeInputIndex}
                onUpdatePlaceholder={onUpdatePlaceholder}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="jd-text-muted-foreground jd-text-center jd-py-8">
          No placeholders found
        </div>
      )}
    </div>
  );
};

// Enhanced sub-component for individual placeholder input
const PlaceholderInput: React.FC<{
  placeholder: Placeholder;
  index: number;
  inputRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  activeInputIndex: React.MutableRefObject<number | null>;
  onUpdatePlaceholder: (index: number, value: string) => void;
}> = ({ placeholder, index, inputRefs, activeInputIndex, onUpdatePlaceholder }) => {
  
  const handleClear = () => {
    onUpdatePlaceholder(index, '');
  };

  const hasValue = placeholder.value.trim().length > 0;

  return (
    <div className="jd-space-y-1">
      <label className="jd-text-sm jd-font-medium jd-flex jd-items-center jd-justify-between">
        <span className={`jd-px-2 jd-py-1 jd-rounded jd-transition-colors ${
          hasValue 
            ? 'jd-bg-green-100 jd-text-green-800 jd-border jd-border-green-200' 
            : 'jd-bg-primary/10 jd-text-primary'
        }`}>
          {placeholder.key}
        </span>
        
        {/* Clear button for individual placeholder */}
        {hasValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground hover:jd-text-destructive"
            title={`Clear ${placeholder.key}`}
          >
            <X className="jd-h-3 jd-w-3" />
          </Button>
        )}
      </label>
      
      <div className="jd-relative">
        <Input
          ref={el => (inputRefs.current[index] = el)}
          onFocus={() => {
            activeInputIndex.current = index;
          }}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          value={placeholder.value}
          onChange={(e) => onUpdatePlaceholder(index, e.target.value)}
          placeholder={`Enter value for ${placeholder.key}`}
          className={`jd-w-full jd-transition-colors ${
            hasValue 
              ? 'jd-border-green-300 jd-bg-green-50/50 focus:jd-border-green-400' 
              : ''
          }`}
        />
        
        {/* Visual indicator for filled state */}
        {hasValue && (
          <div className="jd-absolute jd-right-2 jd-top-1/2 jd-transform jd--translate-y-1/2">
            <div className="jd-w-2 jd-h-2 jd-bg-green-500 jd-rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};