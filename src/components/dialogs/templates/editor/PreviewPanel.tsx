// src/components/dialogs/templates/editor/PreviewPanel.tsx
import React from 'react';
import { Block } from '@/components/templates/blocks/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PreviewPanelProps {
  blocks: Block[];
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ blocks }) => {
  // Get block content as string
  const getContentAsString = (content: Block['content']): string => {
    if (typeof content === 'string') {
      return content;
    } else if (content && typeof content === 'object') {
      return Object.values(content)[0] || '';
    }
    return '';
  };

  // Generate combined content
  const combinedContent = blocks
    .map(block => getContentAsString(block.content))
    .filter(content => content.trim())
    .join('\n\n');

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combinedContent);
      toast.success('Content copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  return (
    <div className="jd-flex jd-flex-col jd-h-full">
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
        <div className="jd-flex jd-items-center jd-gap-2">
          <Eye className="jd-h-5 jd-w-5" />
          <h3 className="jd-font-semibold jd-text-lg">Preview</h3>
        </div>
        <Button onClick={handleCopy} size="sm" variant="outline">
          <Copy className="jd-h-4 jd-w-4 jd-mr-1" />
          Copy All
        </Button>
      </div>

      {/* Block Previews */}
      <div className="jd-flex-1 jd-overflow-y-auto jd-space-y-4">
        {blocks.map((block, index) => {
          const content = getContentAsString(block.content);
          if (!content.trim()) return null;

          return (
            <Card key={block.id} className="jd-transition-all hover:jd-shadow-md">
              <CardHeader className="jd-pb-2">
                <CardTitle className="jd-flex jd-items-center jd-gap-2 jd-text-sm">
                  <Badge variant="secondary" className="jd-text-xs">
                    {index + 1}
                  </Badge>
                  <span>{block.name || `${block.type} Block`}</span>
                  <Badge variant="outline" className="jd-text-xs">
                    {block.type}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="jd-pt-0">
                <div className="jd-bg-muted/50 jd-p-3 jd-rounded-md jd-border-l-4 jd-border-primary/20">
                  <pre className="jd-whitespace-pre-wrap jd-text-sm jd-font-mono">
                    {content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Combined Preview */}
        {blocks.length > 1 && (
          <Card className="jd-border-primary/20 jd-bg-primary/5">
            <CardHeader className="jd-pb-2">
              <CardTitle className="jd-flex jd-items-center jd-gap-2 jd-text-sm jd-text-primary">
                <Badge className="jd-text-xs">Final</Badge>
                <span>Combined Output</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="jd-pt-0">
              <div className="jd-bg-background jd-p-4 jd-rounded-md jd-border">
                <pre className="jd-whitespace-pre-wrap jd-text-sm">
                  {combinedContent}
                </pre>
              </div>
              <div className="jd-flex jd-justify-between jd-items-center jd-mt-3 jd-text-xs jd-text-muted-foreground">
                <span>{combinedContent.length} characters</span>
                <span>{combinedContent.split('\n').length} lines</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};