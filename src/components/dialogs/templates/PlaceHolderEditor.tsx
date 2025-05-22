// src/components/dialogs/templates/PlaceholderEditor.tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Plus, X, ChevronDown, ChevronUp, Move, Edit, Check, ArrowUp, ArrowDown } from "lucide-react";
import { useDialog } from '@/hooks/dialogs/useDialog';
import { BaseDialog } from '../BaseDialog';
import { getMessage, getCurrentLanguage } from '@/core/utils/i18n';
import { trackEvent, EVENTS, incrementUserProperty } from '@/utils/amplitude';
import { apiClient } from '@/services/api/ApiClient';
import { cn } from "@/core/utils/classNames";
import { toast } from "sonner";

// Define the block types
const BLOCK_TYPES = [
  { id: "context", name: "Context", description: "Provides background information and context" },
  { id: "role", name: "Role", description: "Defines the role or persona the AI should adopt" },
  { id: "example", name: "Example", description: "Provides examples of expected output" },
  { id: "format", name: "Format", description: "Specifies output format requirements" },
  { id: "audience", name: "Audience", description: "Describes the target audience" },
  { id: "content", name: "Content", description: "Main content of the prompt" }
];

interface Block {
  id: number;
  type: string;
  content: string | Record<string, string>;
  name?: string;
  description?: string;
}

interface Placeholder {
  key: string;
  value: string;
}

// Custom hook to detect dark mode
const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const updateDarkModeState = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateDarkModeState();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    updateDarkModeState();
    
    return () => observer.disconnect();
  }, []);

  return isDarkMode;
};

/**
 * Enhanced dialog for editing template content and blocks
 */
export const PlaceholderEditor: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog('placeholderEditor');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [selectedBlockType, setSelectedBlockType] = useState<string>("");
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const contentEditorRef = useRef<HTMLTextAreaElement>(null);
  const isDarkMode = useDarkMode();

  // Extract placeholders from content
  const extractPlaceholders = (content: string) => {
    const placeholderRegex = /\[(.*?)\]/g;
    const matches = [...content.matchAll(placeholderRegex)];
    const uniqueKeys = new Set();
    const uniquePlaceholders = [];

    for (const match of matches) {
      const placeholder = match[0];
      if (uniqueKeys.has(placeholder)) continue;
      uniqueKeys.add(placeholder);

      const existingPlaceholder = placeholders.find((p) => p.key === placeholder);
      uniquePlaceholders.push({
        key: placeholder,
        value: existingPlaceholder ? existingPlaceholder.value : ""
      });
    }

    return uniquePlaceholders;
  };

  // Helper function to extract content from potentially localized block content
  const getBlockContent = (block: Block): string => {
    if (typeof block.content === 'string') {
      return block.content;
    } else if (block.content && typeof block.content === 'object') {
      const locale = getCurrentLanguage();
      return block.content[locale] || block.content.en || Object.values(block.content)[0] || '';
    }
    return '';
  };

  // Initialize content and blocks when dialog opens
  useEffect(() => {
    if (isOpen && data) {
      setError(null);
      setIsProcessing(true);
      
      try {
        let templateBlocks: Block[] = [];
        
        // Process expanded blocks if available
        if (data.expanded_blocks && Array.isArray(data.expanded_blocks)) {
          templateBlocks = data.expanded_blocks.map(block => ({
            id: block.id || 0,
            type: block.type || 'content',
            content: block.content || '',
            name: block.name || `${block.type} Block`,
            description: block.description || ''
          }));
        } else if (data.content) {
          // If no blocks, create a default content block
          templateBlocks = [{
            id: 0,
            type: 'content',
            content: data.content,
            name: 'Template Content'
          }];
        }
        
        setBlocks(templateBlocks);
        
        // Extract placeholders from all blocks
        let allContent = templateBlocks.map(block => getBlockContent(block)).join('\n\n');
        setPlaceholders(extractPlaceholders(allContent));
      } catch (err) {
        console.error("Error processing template:", err);
        setError("Failed to process template content. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Reset state when dialog closes
      setActiveBlockIndex(null);
      setSelectedBlockType("");
    }
  }, [isOpen, data]);

  // Fetch available blocks when a block type is selected
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedBlockType) return;
      
      setIsLoadingBlocks(true);
      try {
        // This would normally be an API call to get blocks of the selected type
        // For now, using mock data until API is available
        
        // Example of how the API call might look:
        // const response = await apiClient.request(`/prompts/blocks?type=${selectedBlockType}`);
        // setAvailableBlocks(response.data || []);
        
        // Mock data for demonstration
        const mockBlocks: Record<string, Block[]> = {
          'role': [
            { id: 1, type: 'role', content: 'You are a helpful assistant who answers questions accurately and concisely.', name: 'Helpful Assistant' },
            { id: 2, type: 'role', content: 'You are an expert programmer with deep knowledge of software development.', name: 'Expert Programmer' },
          ],
          'context': [
            { id: 3, type: 'context', content: 'This is a conversation about technology and software development.', name: 'Tech Context' },
            { id: 4, type: 'context', content: 'The user is asking about scientific concepts and requires detailed explanations.', name: 'Science Context' },
          ],
          'format': [
            { id: 5, type: 'format', content: 'Respond using markdown formatting with headers, bullet points, and code blocks when appropriate.', name: 'Markdown Format' },
            { id: 6, type: 'format', content: 'Structure your answer in numbered steps that are easy to follow.', name: 'Numbered Steps' },
          ],
          'example': [
            { id: 7, type: 'example', content: 'Question: How do I sort an array in JavaScript?\nAnswer: You can use the .sort() method. For example: `array.sort((a, b) => a - b)`', name: 'Code Example' },
          ],
          'audience': [
            { id: 8, type: 'audience', content: 'Your answers should be suitable for beginners with no technical background.', name: 'Beginners' },
            { id: 9, type: 'audience', content: 'Your responses should be tailored for experts in the field.', name: 'Experts' },
          ],
          'content': [
            { id: 10, type: 'content', content: 'Analyze the following text and provide key insights:\n\n[Text]', name: 'Analysis Template' },
          ],
        };
        
        setAvailableBlocks(mockBlocks[selectedBlockType] || []);
      } catch (error) {
        console.error('Error fetching blocks:', error);
        toast.error('Failed to load available blocks');
      } finally {
        setIsLoadingBlocks(false);
      }
    };
    
    fetchBlocks();
  }, [selectedBlockType]);

  // Helper function to escape regex characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  // Update placeholder values and reflect changes in blocks
  const updatePlaceholder = (index: number, value: string) => {
    const updatedPlaceholders = [...placeholders];
    updatedPlaceholders[index].value = value;
    setPlaceholders(updatedPlaceholders);
    
    // Update content in all blocks by replacing placeholders
    setBlocks(prevBlocks => {
      return prevBlocks.map(block => {
        let blockContent = getBlockContent(block);
        
        // Replace all instances of the placeholder with its value
        updatedPlaceholders.forEach(({ key, value }) => {
          if (value) {
            const regex = new RegExp(escapeRegExp(key), "g");
            blockContent = blockContent.replace(regex, value);
          }
        });
        
        // Update the block with new content
        return {
          ...block,
          content: blockContent
        };
      });
    });
  };

  // Function to add a new block
  const addBlock = (position: 'start' | 'end', useExisting: boolean = false, existingBlockId?: number) => {
    let newBlock: Block;
    
    if (useExisting && existingBlockId) {
      // Find the existing block from available blocks
      const selectedBlock = availableBlocks.find(block => block.id === existingBlockId);
      if (!selectedBlock) return;
      
      newBlock = { ...selectedBlock };
    } else {
      // Create a new empty block of selected type
      newBlock = {
        id: -Date.now(), // Temporary negative ID for new blocks
        type: selectedBlockType,
        content: '',
        name: `New ${selectedBlockType.charAt(0).toUpperCase() + selectedBlockType.slice(1)} Block`
      };
    }
    
    // Add the block at specified position
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      if (position === 'start') {
        newBlocks.unshift(newBlock);
        setActiveBlockIndex(0);
      } else {
        newBlocks.push(newBlock);
        setActiveBlockIndex(newBlocks.length - 1);
      }
      return newBlocks;
    });
    
    // Reset selection
    setSelectedBlockType("");
  };

  // Function to remove a block
  const removeBlock = (index: number) => {
    if (blocks.length <= 1) {
      toast.warning("Cannot remove the last block. Templates must have at least one block.");
      return;
    }
    
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(index, 1);
      return newBlocks;
    });
    
    if (activeBlockIndex === index) {
      setActiveBlockIndex(null);
    } else if (activeBlockIndex !== null && activeBlockIndex > index) {
      setActiveBlockIndex(activeBlockIndex - 1);
    }
  };

  // Function to update block content
  const updateBlockContent = (index: number, content: string) => {
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      newBlocks[index] = {
        ...newBlocks[index],
        content: content
      };
      return newBlocks;
    });
    
    // Update placeholders based on all blocks
    const allContent = blocks.map(block => getBlockContent(block)).join('\n\n');
    setPlaceholders(extractPlaceholders(allContent));
  };

  // Function to move block up or down
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === blocks.length - 1)) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks;
    });
    
    if (activeBlockIndex === index) {
      setActiveBlockIndex(newIndex);
    } else if (activeBlockIndex === newIndex) {
      setActiveBlockIndex(index);
    }
  };

  // Function to highlight placeholders in text
  const highlightPlaceholders = (text: string) => {
    return text.replace(
      /\[(.*?)\]/g, 
      `<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>`
    );
  };

  // Function to handle template completion
  const handleComplete = () => {
    // Combine all block content
    const finalContent = blocks.map(block => getBlockContent(block)).join('\n\n');
    
    // Call the onComplete callback
    if (data && data.onComplete) {
      data.onComplete(finalContent);
    }
    
    // Close the dialog
    dialogProps.onOpenChange(false);
    
    // Track usage
    trackEvent(EVENTS.TEMPLATE_USED, {
      template_id: data?.id,
      template_name: data?.title,
      template_type: data?.type
    });
    
    // Dispatch events
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  // Handle dialog close
  const handleClose = () => {
    dialogProps.onOpenChange(false);
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  // Get color for block type
  const getBlockTypeColor = (type: string): string => {
    switch (type) {
      case 'role': return 'jd-bg-green-500';
      case 'context': return 'jd-bg-blue-500';
      case 'example': return 'jd-bg-purple-500';
      case 'format': return 'jd-bg-orange-500';
      case 'audience': return 'jd-bg-pink-500';
      case 'content': return 'jd-bg-gray-500';
      default: return 'jd-bg-gray-500';
    }
  };

  // Get block type name
  const getBlockTypeName = (type: string): string => {
    const blockType = BLOCK_TYPES.find(bt => bt.id === type);
    return blockType ? blockType.name : type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          handleClose();
        }
        dialogProps.onOpenChange(open);
      }}
      title={getMessage('placeholderEditor', undefined, 'Prompt Block Editor')}
      description={getMessage('placeholderEditorDescription', undefined, 'Build your prompt using blocks and placeholders')}
      className="jd-max-w-5xl jd-h-[85vh]"
    >
      <div className="jd-flex jd-flex-col jd-h-full jd-gap-4">
        {error && (
          <Alert variant="destructive" className="jd-mb-2">
            <AlertTriangle className="jd-h-4 jd-w-4 jd-mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Top block selector */}
        <div className="jd-flex jd-items-center jd-gap-2 jd-mb-2">
          <Select 
            value={selectedBlockType}
            onValueChange={setSelectedBlockType}
          >
            <SelectTrigger className="jd-w-[180px]">
              <SelectValue placeholder={getMessage('selectBlockType', undefined, 'Select block type...')} />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="jd-flex jd-items-center jd-gap-2">
                    <div className={`jd-w-2 jd-h-2 jd-rounded-full ${getBlockTypeColor(type.id)}`}></div>
                    <span>{type.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="jd-flex jd-gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addBlock('start')}
              disabled={!selectedBlockType}
            >
              <Plus className="jd-h-3.5 jd-w-3.5 jd-mr-1" />
              {getMessage('addToTop', undefined, 'Add to Top')}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addBlock('end')}
              disabled={!selectedBlockType}
            >
              <Plus className="jd-h-3.5 jd-w-3.5 jd-mr-1" />
              {getMessage('addToBottom', undefined, 'Add to Bottom')}
            </Button>
          </div>
          
          {/* Available existing blocks */}
          {selectedBlockType && availableBlocks.length > 0 && (
            <Select
              onValueChange={(value) => {
                const id = parseInt(value);
                if (!isNaN(id)) {
                  addBlock('end', true, id);
                }
              }}
            >
              <SelectTrigger className="jd-max-w-[220px]">
                <SelectValue placeholder={getMessage('useExistingBlock', undefined, 'Use existing block...')} />
              </SelectTrigger>
              <SelectContent>
                {availableBlocks.map(block => (
                  <SelectItem key={block.id} value={block.id.toString()}>
                    {block.name || getBlockTypeName(block.type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {isLoadingBlocks && <div className="jd-text-xs jd-text-muted-foreground">Loading blocks...</div>}
        </div>
        
        <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-3 jd-gap-6 jd-flex-grow jd-overflow-hidden">
          {/* Blocks Column */}
          <div className="md:jd-col-span-2 jd-flex jd-flex-col jd-overflow-hidden">
            <h3 className="jd-text-sm jd-font-medium jd-mb-2">
              {getMessage('blockEditor', undefined, 'Block Editor')}
            </h3>
            
            <ScrollArea className="jd-flex-1 jd-border jd-rounded-md jd-p-1">
              {blocks.length === 0 ? (
                <div className="jd-flex jd-items-center jd-justify-center jd-h-full jd-text-muted-foreground jd-p-8">
                  <div className="jd-text-center">
                    <p className="jd-mb-2">{getMessage('noBlocks', undefined, 'No blocks in this template.')}</p>
                    <p className="jd-text-sm">{getMessage('selectBlockTypeToAdd', undefined, 'Select a block type above to add one.')}</p>
                  </div>
                </div>
              ) : (
                <div className="jd-space-y-3">
                  {blocks.map((block, index) => {
                    const isActive = activeBlockIndex === index;
                    const blockContent = getBlockContent(block);
                    
                    return (
                      <div 
                        key={`block-${index}`}
                        className={cn(
                          "jd-border jd-rounded-md jd-overflow-hidden jd-transition-all",
                          isActive ? "jd-ring-2 jd-ring-primary" : "hover:jd-border-primary/50"
                        )}
                      >
                        {/* Block header */}
                        <div className="jd-flex jd-items-center jd-gap-2 jd-p-2 jd-bg-muted/50">
                          <div className={`jd-w-2 jd-h-2 jd-rounded-full ${getBlockTypeColor(block.type)}`}></div>
                          <span className="jd-text-sm jd-font-medium jd-flex-1">
                            {block.name || getBlockTypeName(block.type)}
                          </span>
                          
                          <div className="jd-flex jd-items-center jd-gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="jd-h-7 jd-w-7" 
                              onClick={() => moveBlock(index, 'up')}
                              disabled={index === 0}
                              title={getMessage('moveUp', undefined, 'Move Up')}
                            >
                              <ArrowUp className="jd-h-3.5 jd-w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="jd-h-7 jd-w-7" 
                              onClick={() => moveBlock(index, 'down')}
                              disabled={index === blocks.length - 1}
                              title={getMessage('moveDown', undefined, 'Move Down')}
                            >
                              <ArrowDown className="jd-h-3.5 jd-w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn(
                                "jd-h-7 jd-w-7",
                                isActive && "jd-bg-primary/20"
                              )}
                              onClick={() => setActiveBlockIndex(isActive ? null : index)}
                              title={isActive ? getMessage('closeEditor', undefined, 'Close Editor') : getMessage('editBlock', undefined, 'Edit Block')}
                            >
                              {isActive ? <Check className="jd-h-3.5 jd-w-3.5" /> : <Edit className="jd-h-3.5 jd-w-3.5" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="jd-h-7 jd-w-7 hover:jd-text-destructive" 
                              onClick={() => removeBlock(index)}
                              disabled={blocks.length <= 1}
                              title={getMessage('removeBlock', undefined, 'Remove Block')}
                            >
                              <X className="jd-h-3.5 jd-w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Block content */}
                        <div className="jd-p-2">
                          {isActive ? (
                            <Textarea
                              ref={contentEditorRef}
                              value={blockContent}
                              onChange={(e) => updateBlockContent(index, e.target.value)}
                              className="jd-min-h-[120px] jd-w-full jd-font-mono jd-text-sm"
                              placeholder={`Enter ${getBlockTypeName(block.type)} content...`}
                              onKeyDown={(e) => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  const textarea = e.target as HTMLTextAreaElement;
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  
                                  const newValue = blockContent.substring(0, start) + '  ' + blockContent.substring(end);
                                  updateBlockContent(index, newValue);
                                  
                                  // Set cursor position after the inserted tab
                                  setTimeout(() => {
                                    if (contentEditorRef.current) {
                                      contentEditorRef.current.selectionStart = contentEditorRef.current.selectionEnd = start + 2;
                                    }
                                  }, 0);
                                } else if (e.key === 'Enter') {
                                  // Allow natural Enter handling with proper indentation
                                  e.stopPropagation();
                                }
                              }}
                            />
                          ) : (
                            <div 
                              className="jd-whitespace-pre-wrap jd-p-3 jd-bg-muted/30 jd-rounded-md jd-text-sm jd-font-mono jd-max-h-[150px] jd-overflow-y-auto"
                              dangerouslySetInnerHTML={{ __html: highlightPlaceholders(blockContent) }}
                              onClick={() => setActiveBlockIndex(index)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Placeholders Column */}
          <div className="jd-space-y-4 jd-overflow-hidden md:jd-border-l md:jd-pl-4">
            <h3 className="jd-text-sm jd-font-medium jd-mb-2">
              {getMessage('replacePlaceholders', undefined, 'Replace Placeholders')}
            </h3>
            
            <ScrollArea className="jd-h-[calc(100%-40px)]">
              {placeholders.length > 0 ? (
                <div className="jd-space-y-4 jd-pr-2">
                  {placeholders.map((placeholder, idx) => (
                    <div key={placeholder.key + idx} className="jd-space-y-1">
                      <label className="jd-text-sm jd-font-medium jd-flex jd-items-center">
                        <span className="jd-bg-primary/10 jd-px-2 jd-py-1 jd-rounded">{placeholder.key}</span>
                      </label>
                      <Textarea
                        value={placeholder.value}
                        onChange={(e) => updatePlaceholder(idx, e.target.value)}
                        placeholder={getMessage('enterValueFor', [placeholder.key], `Enter value for ${placeholder.key}`)}
                        className="jd-w-full jd-resize-none jd-h-24"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="jd-flex jd-items-center jd-justify-center jd-h-full jd-text-muted-foreground jd-p-8">
                  <div className="jd-text-center">
                    <p>{getMessage('noPlaceholders', undefined, 'No placeholders found')}</p>
                    <p className="jd-text-sm jd-mt-1">{getMessage('addPlaceholdersTip', undefined, 'Add [placeholders] in your blocks to enable replacements')}</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
        <div className="jd-mt-4 jd-flex jd-justify-end jd-gap-2">
          <Button variant="outline" onClick={handleClose}>
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button onClick={handleComplete}>
            {getMessage('useTemplate', undefined, 'Use Template')}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};