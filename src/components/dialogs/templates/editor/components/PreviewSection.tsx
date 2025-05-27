import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ChevronUp, ChevronDown, Copy, Check } from 'lucide-react';
import { cn } from '@/core/utils/classNames';

interface PreviewSectionProps {
  content: string;
  expanded: boolean;
  onToggle: () => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({ 
  content, 
  expanded, 
  onToggle 
}) => {
  const [copied, setCopied] = React.useState(false);
  
  const lines = content.split('\n');
  const showToggle = lines.length > 3;
  const displayed = expanded ? content : lines.slice(0, 3).join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  return (
    <div className="jd-border-t jd-pt-4">
      <Card className="jd-bg-gradient-to-br jd-from-slate-50 jd-to-slate-100 dark:jd-from-gray-800 dark:jd-to-gray-900">
        <CardContent className="jd-p-4">
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
            <h4 className="jd-font-medium jd-flex jd-items-center jd-gap-2">
              <Eye className="jd-h-4 jd-w-4 jd-text-primary" /> 
              Preview
            </h4>
            <div className="jd-flex jd-items-center jd-gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="jd-flex jd-items-center jd-gap-1 jd-text-xs"
                disabled={!content.trim()}
              >
                {copied ? (
                  <>
                    <Check className="jd-h-3 jd-w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="jd-h-3 jd-w-3" />
                    Copy
                  </>
                )}
              </Button>
              {showToggle && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={onToggle} 
                  className="jd-flex jd-items-center jd-gap-1"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="jd-h-4 jd-w-4" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown className="jd-h-4 jd-w-4" />
                      Expand
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <div className={cn(
            'jd-bg-white dark:jd-bg-gray-800 jd-rounded-lg jd-p-4 jd-relative jd-border jd-border-gray-200 dark:jd-border-gray-700',
            expanded ? 'jd-max-h-80 jd-overflow-y-auto' : 'jd-max-h-32 jd-overflow-hidden'
          )}>
            <pre className="jd-whitespace-pre-wrap jd-text-sm jd-font-mono jd-leading-relaxed">
              {displayed || (
                <span className="jd-text-muted-foreground jd-italic">
                  Your prompt will appear here...
                </span>
              )}
            </pre>
            {!expanded && showToggle && content && (
              <div className="jd-absolute jd-inset-x-0 jd-bottom-0 jd-h-8 jd-bg-gradient-to-t jd-from-white dark:jd-from-gray-800 jd-to-white/0 dark:jd-to-gray-800/0 jd-pointer-events-none jd-rounded-b-lg" />
            )}
          </div>
          
          <div className="jd-flex jd-justify-between jd-items-center jd-mt-3 jd-text-xs jd-text-muted-foreground">
            <span>{content.length} characters</span>
            <span>{lines.length} lines</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};