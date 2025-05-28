// src/components/dialogs/templates/blocks/ExistingBlocksDropdown.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, FileText } from 'lucide-react';
import { ExistingBlocksDropdownProps, Block, BLOCK_TYPES } from './types';
import { getMessage } from '@/core/utils/i18n';
import { getLocalizedContent } from '@/components/dialogs/templates/utils/blockUtils';

/**
 * Component for selecting existing blocks or creating new ones
 */
export const ExistingBlocksDropdown: React.FC<ExistingBlocksDropdownProps> = ({
  blockType,
  onSelectExisting,
  onCreateNew
}) => {
  const [existingBlocks, setExistingBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  // Get block type info
  const blockTypeInfo = BLOCK_TYPES.find(bt => bt.id === blockType);

  // Fetch existing blocks of this type
  useEffect(() => {
    const fetchExistingBlocks = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await apiClient.request(`/prompts/blocks?type=${blockType}`);
        // setExistingBlocks(response.data || []);
        
        // Mock data for demonstration
        const mockBlocks: Record<string, Block[]> = {
          'role': [
            { 
              id: 1, 
              type: 'role', 
              content: 'You are a helpful assistant who answers questions accurately and concisely.',
              name: 'Helpful Assistant'
            },
            { 
              id: 2, 
              type: 'role', 
              content: 'You are an expert programmer with deep knowledge of software development.',
              name: 'Expert Programmer'
            },
          ],
          'context': [
            { 
              id: 3, 
              type: 'context', 
              content: 'This is a conversation about technology and software development.',
              name: 'Tech Context'
            },
            { 
              id: 4, 
              type: 'context', 
              content: 'The user is asking about scientific concepts and requires detailed explanations.',
              name: 'Science Context'
            },
          ],
          'format': [
            { 
              id: 5, 
              type: 'format', 
              content: 'Respond using markdown formatting with headers, bullet points, and code blocks when appropriate.',
              name: 'Markdown Format'
            },
            { 
              id: 6, 
              type: 'format', 
              content: 'Structure your answer in numbered steps that are easy to follow.',
              name: 'Numbered Steps'
            },
          ],
          'example': [
            { 
              id: 7, 
              type: 'example', 
              content: 'Question: How do I sort an array in JavaScript?\nAnswer: You can use the .sort() method. For example: `array.sort((a, b) => a - b)`',
              name: 'Code Example'
            },
          ],
          'audience': [
            { 
              id: 8, 
              type: 'audience', 
              content: 'Your answers should be suitable for beginners with no technical background.',
              name: 'Beginners'
            },
            { 
              id: 9, 
              type: 'audience', 
              content: 'Your responses should be tailored for experts in the field.',
              name: 'Experts'
            },
          ],
          'content': [
            { 
              id: 10, 
              type: 'content', 
              content: 'Analyze the following text and provide key insights:\n\n[Your analysis here]',
              name: 'Analysis Template'
            },
          ],
        };
        
        setExistingBlocks(mockBlocks[blockType] || []);
      } catch (error) {
        console.error('Error fetching existing blocks:', error);
        setExistingBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingBlocks();
  }, [blockType]);

  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="jd-space-y-3">
      {/* Create New Button */}
      <Button
        onClick={onCreateNew}
        className="jd-w-full jd-justify-start jd-h-auto jd-p-3 jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/90"
      >
        <Plus className="jd-h-4 jd-w-4 jd-mr-3" />
        <div className="jd-text-left">
          <div className="jd-font-medium">
            {getMessage('createNew', undefined, 'Create New')} {blockTypeInfo?.name}
          </div>
          <div className="jd-text-xs jd-opacity-90">
            {getMessage('startFromScratch', undefined, 'Start from scratch')}
          </div>
        </div>
      </Button>

      {/* Existing Blocks */}
      {loading ? (
        <div className="jd-flex jd-items-center jd-justify-center jd-py-8">
          <div className="jd-animate-spin jd-h-6 jd-w-6 jd-border-2 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
        </div>
      ) : existingBlocks.length > 0 ? (
        <>
          <div className="jd-text-xs jd-text-muted-foreground jd-font-medium jd-uppercase jd-tracking-wide">
            {getMessage('existingBlocks', undefined, 'Existing Blocks')}
          </div>
          <ScrollArea className="jd-max-h-48">
            <div className="jd-space-y-2">
              {existingBlocks.map((block) => (
                <Button
                  key={block.id}
                  variant="ghost"
                  onClick={() => onSelectExisting(block)}
                  className="jd-w-full jd-justify-start jd-h-auto jd-p-3 jd-text-left"
                >
                  <FileText className="jd-h-4 jd-w-4 jd-mr-3 jd-flex-shrink-0" />
                  <div className="jd-min-w-0 jd-flex-1">
                    <div className="jd-font-medium jd-truncate">
                      {getLocalizedContent(block.title) || `${blockTypeInfo?.name} Block`}
                    </div>
                    <div className="jd-text-xs jd-text-muted-foreground jd-mt-1">
                      {truncateContent(typeof block.content === 'string' ? block.content : 'Localized content')}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="jd-text-center jd-py-6 jd-text-muted-foreground">
          <FileText className="jd-h-8 jd-w-8 jd-mx-auto jd-mb-2 jd-opacity-50" />
          <div className="jd-text-sm">
            {getMessage('noExistingBlocks', undefined, 'No existing blocks of this type')}
          </div>
        </div>
      )}
    </div>
  );
};