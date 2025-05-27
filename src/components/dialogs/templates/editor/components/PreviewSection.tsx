import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/core/utils/classNames';

interface PreviewSectionProps {
  content: string;
  expanded: boolean;
  onToggle: () => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({ content, expanded, onToggle }) => {
  const lines = content.split('\n');
  const showToggle = lines.length > 3;
  const displayed = expanded ? content : lines.slice(0, 3).join('\n');

  return (
    <div className="jd-border-t jd-pt-4">
      <Card>
        <CardContent className="jd-p-4">
          <h4 className="jd-font-medium jd-mb-2 jd-flex jd-items-center jd-gap-2">
            <Eye className="jd-h-4 jd-w-4" /> Preview
          </h4>
          <div className={cn('jd-bg-muted/50 jd-rounded-lg jd-p-4 jd-relative', expanded ? 'jd-max-h-60 jd-overflow-y-auto' : 'jd-max-h-24 jd-overflow-hidden')}>
            <pre className="jd-whitespace-pre-wrap jd-text-sm jd-font-mono">
              {displayed || 'Your prompt will appear here...'}
            </pre>
            {!expanded && showToggle && (
              <div className="jd-absolute jd-inset-x-0 jd-bottom-0 jd-h-8 jd-bg-gradient-to-t jd-from-muted/80 jd-to-muted/0 pointer-events-none" />
            )}
          </div>
          <div className="jd-flex jd-justify-between jd-items-center jd-mt-2 jd-text-xs jd-text-muted-foreground">
            <span>{content.length} characters</span>
            <span>{lines.length} lines</span>
          </div>
          {showToggle && (
            <div className="jd-flex jd-justify-end jd-mt-2">
              <Button size="sm" variant="ghost" onClick={onToggle} className="jd-flex jd-items-center jd-gap-1">
                {expanded ? <ChevronUp className="jd-h-4 jd-w-4" /> : <ChevronDown className="jd-h-4 jd-w-4" />}
                {expanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
