// src/components/dialogs/prompts/editors/AdvancedEditor/EnhancedPreviewSection.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Code, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { cn } from '@/core/utils/classNames';

interface EnhancedPreviewSectionProps {
  content: string;
  htmlContent: string;
  expanded: boolean;
  onToggle: () => void;
  metadataBlockMapping: Record<string, number | number[]>;
}

export const EnhancedPreviewSection: React.FC<EnhancedPreviewSectionProps> = ({
  content,
  htmlContent,
  expanded,
  onToggle,
  metadataBlockMapping
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'metadata'>('preview');

  const hasMetadataBlocks = Object.keys(metadataBlockMapping).length > 0;

  return (
    <div className="jd-flex-shrink-0">
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
        <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
          <Eye className="jd-h-5 jd-w-5" />
          Preview
          {hasMetadataBlocks && (
            <Badge variant="secondary" className="jd-text-xs">
              {Object.keys(metadataBlockMapping).length} metadata blocks
            </Badge>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="jd-h-6 jd-w-6 jd-p-0"
        >
          {expanded ? <ChevronUp className="jd-h-4 jd-w-4" /> : <ChevronDown className="jd-h-4 jd-w-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="jd-border jd-rounded-lg jd-bg-background/50 jd-backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'metadata')}>
            <TabsList className="jd-w-full jd-grid jd-grid-cols-2">
              <TabsTrigger value="preview" className="jd-flex jd-items-center jd-gap-2">
                <Eye className="jd-h-4 jd-w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="metadata" className="jd-flex jd-items-center jd-gap-2">
                <Database className="jd-h-4 jd-w-4" />
                Metadata Blocks
                {hasMetadataBlocks && (
                  <Badge variant="outline" className="jd-text-xs jd-ml-1">
                    {Object.keys(metadataBlockMapping).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="jd-p-4">
              <div className="jd-space-y-3">
                <div className="jd-flex jd-items-center jd-gap-2 jd-text-sm jd-text-muted-foreground">
                  <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
                  <span>Placeholders highlighted</span>
                </div>
                <div 
                  className="jd-max-h-[300px] jd-overflow-y-auto jd-p-4 jd-rounded jd-border jd-bg-background jd-text-sm jd-leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: htmlContent || content }}
                />
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="jd-p-4">
              <MetadataBlocksDisplay mapping={metadataBlockMapping} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

// Sub-component to display metadata block mapping
const MetadataBlocksDisplay: React.FC<{
  mapping: Record<string, number | number[]>;
}> = ({ mapping }) => {
  if (Object.keys(mapping).length === 0) {
    return (
      <div className="jd-text-center jd-py-8 jd-text-muted-foreground">
        <Database className="jd-h-8 jd-w-8 jd-mx-auto jd-mb-2 jd-opacity-50" />
        <p className="jd-text-sm">No metadata blocks are being used</p>
        <p className="jd-text-xs jd-mt-1">Select blocks from dropdowns to track metadata usage</p>
      </div>
    );
  }

  return (
    <div className="jd-space-y-3">
      <div className="jd-text-sm jd-text-muted-foreground jd-mb-3">
        Block IDs that will be saved with this template:
      </div>
      
      <div className="jd-space-y-2">
        {Object.entries(mapping).map(([metadataType, blockIds]) => (
          <div key={metadataType} className="jd-flex jd-items-center jd-justify-between jd-p-2 jd-rounded jd-bg-muted/50">
            <span className="jd-font-medium jd-capitalize jd-text-sm">
              {metadataType.replace('_', ' ')}
            </span>
            <div className="jd-flex jd-gap-1">
              {Array.isArray(blockIds) ? (
                blockIds.map((id, index) => (
                  <Badge key={index} variant="outline" className="jd-text-xs">
                    Block #{id}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="jd-text-xs">
                  Block #{blockIds}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="jd-mt-4 jd-p-3 jd-rounded jd-bg-blue-50 jd-dark:bg-blue-950/30 jd-border jd-border-blue-200 jd-dark:border-blue-800">
        <div className="jd-text-xs jd-text-blue-700 jd-dark:text-blue-300">
          <strong>Template Metadata:</strong> These block IDs will be saved in the template's metadata field, 
          allowing the template to reference and reuse specific blocks when loaded.
        </div>
      </div>
    </div>
  );
};