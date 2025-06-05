// src/components/dialogs/prompts/editors/BasicEditor/PlaceholderPanel.tsx
import React from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Placeholder {
  key: string;
  value: string;
}

interface PlaceholderPanelProps {
  placeholders: Placeholder[];
  inputRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  activeInputIndex: React.MutableRefObject<number | null>;
  onUpdatePlaceholder: (index: number, value: string) => void;
}

export const PlaceholderPanel: React.FC<PlaceholderPanelProps> = ({
  placeholders,
  inputRefs,
  activeInputIndex,
  onUpdatePlaceholder
}) => {
  return (
    <div className="jd-h-full jd-space-y-4 jd-overflow-auto jd-p-4">
      <h3 className="jd-text-sm jd-font-medium jd-mb-2">Replace Placeholders</h3>
      
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

// Sub-component for individual placeholder input
const PlaceholderInput: React.FC<{
  placeholder: Placeholder;
  index: number;
  inputRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  activeInputIndex: React.MutableRefObject<number | null>;
  onUpdatePlaceholder: (index: number, value: string) => void;
}> = ({ placeholder, index, inputRefs, activeInputIndex, onUpdatePlaceholder }) => {
  return (
    <div className="jd-space-y-1">
      <label className="jd-text-sm jd-font-medium jd-flex jd-items-center">
        <span className="jd-bg-primary/10 jd-px-2 jd-py-1 jd-rounded">
          {placeholder.key}
        </span>
      </label>
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
        className="jd-w-full"
      />
    </div>
  );
};