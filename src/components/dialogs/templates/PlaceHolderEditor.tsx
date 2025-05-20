// src/components/dialogs/templates/PlaceholderEditor.tsx (updated)
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Edit, Save, Plus, Trash, Check, X, RefreshCw } from "lucide-react";
import { useDialog } from '@/hooks/dialogs/useDialog';
import { BaseDialog } from '../BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS, incrementUserProperty } from '@/utils/amplitude';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBlockActions } from '@/hooks/prompts/useBlockActions';
import { Textarea } from "@/components/ui/textarea";
import { AddBlockButton, AddBlockControls } from '@/components/templates';

// Custom hook to detect dark mode
const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
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

interface Placeholder {
  key: string;
  value: string;
}

/**
 * Enhanced dialog for editing templates with block support
 */
export const PlaceholderEditor: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog('placeholderEditor');
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [modifiedContent, setModifiedContent] = useState('');
  const [contentMounted, setContentMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('variables');
  
  // Blocks state
  const [templateBlocks, setTemplateBlocks] = useState<any[]>([]);
  const [currentEditingBlock, setCurrentEditingBlock] = useState<number | null>(null);
  const [customBlockContent, setCustomBlockContent] = useState<string>('');
  const [selectedBlockType, setSelectedBlockType] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [addPosition, setAddPosition] = useState<'top' | 'bottom' | null>(null);

  // Import block hooks
  const { 
    useBlocks, 
    groupBlocksByType, 
    blockTypes,
    isLoadingTypes
  } = useBlockActions();

  // Get blocks data from the hook
  const { data: availableBlocks = [], isLoading: isLoadingBlocks } = useBlocks();
  
  // Editor references
  const editorRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const isDarkMode = useDarkMode();

  // Safe extraction of dialog data with defaults
  const templateContent = data?.content || '';
  const expandedBlocks = data?.expandedBlocks || [];
  const templateTitle = data?.title || 'Template';
  const onComplete = data?.onComplete || (() => {});
  
  /**
   * Extract placeholders from template content
   */
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
        value: existingPlaceholder ? existingPlaceholder.value : "",
      });
    }

    return uniquePlaceholders;
  };

  /**
   * Function to highlight placeholders inside the content with improved formatting
   */
  const highlightPlaceholders = (content: string) => {
    // First, normalize the content to ensure consistent line breaks
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    // Escape HTML entities to prevent XSS and preserve content
    const escapedContent = normalizedContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Then handle newlines by converting them to <br> tags
    const withLineBreaks = escapedContent.replace(/\n/g, '<br>');
    
    // Finally, highlight placeholders
    return withLineBreaks.replace(
      /\[(.*?)\]/g, 
      `<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>`
    );
  };

  // Initialize content, placeholders, and blocks when dialog opens or content changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      
      // Initialize blocks from expanded blocks
      if (expandedBlocks && expandedBlocks.length > 0) {
        setTemplateBlocks(expandedBlocks);
      } else if (templateContent) {
        // If no blocks, create a default block with template content
        setTemplateBlocks([{
          id: 0,
          type: 'content',
          content: templateContent,
          name: 'Template Content'
        }]);
      } else {
        setTemplateBlocks([]);
      }
      
      // Normalize template content to ensure consistent line breaks
      const normalizedContent = templateContent.replace(/\r\n/g, '\n');
      setModifiedContent(normalizedContent);
      
      try {
        const extractedPlaceholders = extractPlaceholders(normalizedContent);
        setPlaceholders(extractedPlaceholders);
        
        // Use a short timeout to ensure the ref is available
        setTimeout(() => {
          if (editorRef.current) {
            // Apply the highlighting with proper newline handling
            editorRef.current.innerHTML = highlightPlaceholders(normalizedContent);
            setContentMounted(true);
          }
        }, 10);
      } catch (err) {
        console.error("Error processing template:", err);
        setError("Failed to process template. Please try again.");
      }
    } else {
      // Reset states when dialog closes
      setContentMounted(false);
      setTemplateBlocks([]);
      setCurrentEditingBlock(null);
      setCustomBlockContent('');
      setSelectedBlockType('');
      setSelectedBlockId('');
    }
  }, [isOpen]);

  // Setup the mutation observer only once after mounting
  useEffect(() => {
    if (!contentMounted || !editorRef.current) return;

    // Create a new observer
    observerRef.current = new MutationObserver(() => {
      // Skip processing while user is actively editing
      if (isEditing || !editorRef.current) return;
      
      // Get the HTML content
      const htmlContent = editorRef.current.innerHTML;
      
      // First, normalize <br> tags to ensure consistent processing
      const normalizedHtml = htmlContent
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>')  // Replace double <br>s
        .replace(/<div><br><\/div>/gi, '<br>')         // Replace div-wrapped <br>s
        .replace(/<p><br><\/p>/gi, '<br>');            // Replace p-wrapped <br>s
      
      // Process the normalized content:
      const textContent = normalizedHtml
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div\s*\/?>/gi, '')
        .replace(/<\/div>/gi, '')
        .replace(/<p\s*\/?>/gi, '')
        .replace(/<\/p>/gi, '')
        .replace(/<\/?span[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');
      
      setModifiedContent(textContent);
      
      // Update the content block if we have one
      if (templateBlocks.some(block => block.id === 0)) {
        setTemplateBlocks(prev => 
          prev.map(block => 
            block.id === 0 ? { ...block, content: textContent } : block
          )
        );
      }
    });

    // Start observing
    observerRef.current.observe(editorRef.current, { 
      childList: true, 
      subtree: true, 
      characterData: true,
      attributes: false 
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [contentMounted, isEditing, templateBlocks]);

  // Handle editor focus events
  const handleEditorFocus = () => {
    setIsEditing(true);
    // Temporarily disconnect the observer when editing starts
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  };

  // Handle editor blur events
  const handleEditorBlur = () => {
    setIsEditing(false);
    // Extract content and update state
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      // Process HTML content to text (similar to the observer logic)
      const textContent = htmlContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div\s*\/?>/gi, '')
        .replace(/<\/div>/gi, '\n')
        .replace(/<p\s*\/?>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/?span[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');
      
      setModifiedContent(textContent);
      
      // Update the content block if we have one
      if (templateBlocks.some(block => block.id === 0)) {
        setTemplateBlocks(prev => 
          prev.map(block => 
            block.id === 0 ? { ...block, content: textContent } : block
          )
        );
      }
      
      // Reconnect the observer
      if (observerRef.current && editorRef.current) {
        observerRef.current.observe(editorRef.current, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: false 
        });
      }
    }
  };

  /**
   * Helper function to escape regex characters
   */
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  /**
   * Update placeholder values and reflect changes in the editor
   */
  const updatePlaceholder = (index: number, value: string) => {
    // Skip if user is actively editing
    if (isEditing) return;
    
    const updatedPlaceholders = [...placeholders];
    updatedPlaceholders[index].value = value;
    setPlaceholders(updatedPlaceholders);

    // Start with the original template content
    let newContent = templateContent.replace(/\r\n/g, '\n');
    
    // Replace placeholders with their values
    updatedPlaceholders.forEach(({ key, value }) => {
      if (value) {
        const regex = new RegExp(escapeRegExp(key), "g");
        newContent = newContent.replace(regex, value);
      }
    });

    // Update state with the new content
    setModifiedContent(newContent);
    
    // Update the content block if we have one
    if (templateBlocks.some(block => block.id === 0)) {
      setTemplateBlocks(prev => 
        prev.map(block => 
          block.id === 0 ? { ...block, content: newContent } : block
        )
      );
    }

    // Update the editor display with proper highlighting
    if (editorRef.current && !isEditing) {
      // Temporarily disconnect observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Make sure the HTML we set doesn't have doubled line breaks
      editorRef.current.innerHTML = highlightPlaceholders(newContent);
      
      // Reconnect observer
      if (observerRef.current && editorRef.current) {
        observerRef.current.observe(editorRef.current, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: false 
        });
      }
    }
  };

  /**
   * Handle adding a block to the template
   */
  const handleAddBlock = () => {
    if (!selectedBlockType || (!selectedBlockId && selectedBlockId !== '0')) {
      return;
    }

    let newBlock: any;

    if (selectedBlockId === 'custom') {
      // Create a custom block with empty content initially
      newBlock = {
        id: `custom-${Date.now()}`, // Generate a unique ID for the custom block
        type: selectedBlockType,
        content: '',
        name: `Custom ${selectedBlockType}`,
        isCustom: true
      };
    } else if (selectedBlockId === '0') {
      // Special case for template content block
      newBlock = {
        id: 0,
        type: 'content',
        content: modifiedContent,
        name: 'Template Content'
      };
    } else {
      // Find the selected block from available blocks
      const selectedBlock = availableBlocks.find(block => block.id.toString() === selectedBlockId);
      if (!selectedBlock) return;
      
      newBlock = {
        ...selectedBlock,
        originalId: selectedBlock.id // Keep track of the original ID
      };
    }

    // Add the new block to the template
    setTemplateBlocks(prev => [...prev, newBlock]);
    
    // Reset selection
    setSelectedBlockType('');
    setSelectedBlockId('');
    
    // If it's a custom block, immediately set it for editing
    if (newBlock.isCustom) {
      setCurrentEditingBlock(templateBlocks.length);
      setCustomBlockContent('');
    }
  };

  const handleAddBlockAtPosition = (type: string, id: string, position: 'top' | 'bottom') => {
    if (!type || (!id && id !== '0')) return;

    let newBlock: any;

    if (id === 'custom') {
      newBlock = {
        id: `custom-${Date.now()}`,
        type,
        content: '',
        name: `Custom ${type}`,
        isCustom: true
      };
    } else if (id === '0') {
      newBlock = {
        id: 0,
        type: 'content',
        content: modifiedContent,
        name: 'Template Content'
      };
    } else {
      const selectedBlock = availableBlocks.find(block => block.id.toString() === id);
      if (!selectedBlock) return;
      newBlock = { ...selectedBlock, originalId: selectedBlock.id };
    }

    setTemplateBlocks(prev =>
      position === 'top' ? [newBlock, ...prev] : [...prev, newBlock]
    );
    setAddPosition(null);
  };

  /**
   * Handle removing a block from the template
   */
  const handleRemoveBlock = (index: number) => {
    setTemplateBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks.splice(index, 1);
      return newBlocks;
    });
    
    // Reset editing state if removing the currently edited block
    if (currentEditingBlock === index) {
      setCurrentEditingBlock(null);
      setCustomBlockContent('');
    }
  };

  /**
   * Start editing a custom block
   */
  const handleEditBlock = (index: number) => {
    const block = templateBlocks[index];
    setCurrentEditingBlock(index);
    setCustomBlockContent(block.content || '');
  };

  /**
   * Save changes to a custom block
   */
  const handleSaveBlockEdit = () => {
    if (currentEditingBlock === null) return;
    
    setTemplateBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[currentEditingBlock] = {
        ...newBlocks[currentEditingBlock],
        content: customBlockContent
      };
      return newBlocks;
    });
    
    // Reset editing state
    setCurrentEditingBlock(null);
    setCustomBlockContent('');
  };

  /**
   * Cancel editing a block
   */
  const handleCancelBlockEdit = () => {
    setCurrentEditingBlock(null);
    setCustomBlockContent('');
  };

  /**
   * Change a block with another one of the same type
   */
  const handleChangeBlock = (index: number, blockId: string) => {
    const currentBlock = templateBlocks[index];
    
    // Handle custom block selection
    if (blockId === 'custom') {
      setTemplateBlocks(prev => {
        const newBlocks = [...prev];
        newBlocks[index] = {
          ...newBlocks[index],
          id: `custom-${Date.now()}`,
          content: '',
          name: `Custom ${currentBlock.type}`,
          isCustom: true
        };
        return newBlocks;
      });
      
      // Immediately edit the custom block
      setCurrentEditingBlock(index);
      setCustomBlockContent('');
      return;
    }
    
    // Find the selected block from available blocks
    const selectedBlock = availableBlocks.find(block => block.id.toString() === blockId);
    if (!selectedBlock) return;
    
    // Update the block
    setTemplateBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = {
        ...selectedBlock,
        originalId: selectedBlock.id
      };
      return newBlocks;
    });
  };

  /**
  * Handle template completion
  */
  const handleComplete = () => {
    // Call the callback with blocks
    onComplete(modifiedContent, templateBlocks);
    
    // Close the dialog
    dialogProps.onOpenChange(false);
    
    // Dispatch events to notify that the editor is closed and to close all panels
    trackEvent(EVENTS.TEMPLATE_USED, {
      template_id: data.id,
      template_name: data.title,
      template_type: data.type
    });
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  /**
  * Handle dialog close
  */
  const handleClose = () => {
    // Close dialog
    dialogProps.onOpenChange(false);
    
    // Also dispatch close events
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  // Group blocks by type for the selector
  const groupedBlocks = React.useMemo(() => {
    return groupBlocksByType(availableBlocks || []);
  }, [availableBlocks, groupBlocksByType]);

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
      title={getMessage('placeholderEditor', undefined, 'Template Editor')}
      description={getMessage('placeholderEditorDescription', undefined, 'Prepare your template')}
      className="jd-max-w-4xl"
    >
      <div className="jd-flex jd-flex-col jd-space-y-4 jd-mt-4">
        {error && (
          <Alert variant="destructive" className="jd-mb-4">
            <AlertTriangle className="jd-h-4 jd-w-4 jd-mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="jd-w-full">
          <TabsList className="jd-mb-4">
            <TabsTrigger value="variables">
              {getMessage('variables', undefined, 'Variables')}
              {placeholders.length > 0 && (
                <Badge variant="secondary" className="jd-ml-2">{placeholders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="blocks">
              {getMessage('blocks', undefined, 'Blocks')}
              {templateBlocks.length > 0 && (
                <Badge variant="secondary" className="jd-ml-2">{templateBlocks.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preview">
              {getMessage('preview', undefined, 'Preview')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="variables" className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-6 jd-my-4 jd-flex-grow jd-overflow-hidden jd-w-full">
            {/* Left side: Placeholders */}
            <div className="jd-space-y-4 jd-overflow-auto">
              <h3 className="jd-text-sm jd-font-medium jd-mb-2">{getMessage('replacePlaceholders', undefined, 'Replace Placeholders')}</h3>

              {placeholders.length > 0 ? (
                <ScrollArea className="jd-h-[50vh]">
                  <div className="jd-space-y-4 jd-pr-4">
                    {placeholders.map((placeholder, idx) => (
                      <div key={placeholder.key + idx} className="jd-space-y-1">
                        <label className="jd-text-sm jd-font-medium jd-flex jd-items-center">
                          <span className="jd-bg-primary/10 jd-px-2 jd-py-1 jd-rounded">{placeholder.key}</span>
                        </label>
                        <Input
                          value={placeholder.value}
                          onChange={(e) => updatePlaceholder(idx, e.target.value)}
                          placeholder={getMessage('enterValueFor', [placeholder.key], `Enter value for ${placeholder.key}`)}
                          className="jd-w-full"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="jd-text-muted-foreground jd-text-center jd-py-8">
                  {getMessage('noPlaceholders', undefined, 'No placeholders found in this template.')}
                </div>
              )}
            </div>

            {/* Right side: Rich Text Editable Section */}
            <div
              className={`jd-border jd-rounded-md jd-p-4 jd-overflow-hidden jd-flex jd-flex-col ${
                isDarkMode ? "jd-border-gray-700" : "jd-border-gray-200"
              }`}
            >
              <h3 className="jd-text-sm jd-font-medium jd-mb-2">{getMessage('editTemplate', undefined, 'Edit Template')}</h3>
              <AddBlockButton onClick={() => setAddPosition('top')} />
              {addPosition === 'top' && (
                <AddBlockControls
                  blocks={groupedBlocks}
                  onAdd={(t, id) => handleAddBlockAtPosition(t, id, 'top')}
                  onCancel={() => setAddPosition(null)}
                />
              )}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={handleEditorFocus}
                onBlur={handleEditorBlur}
                className={`jd-flex-grow jd-h-[50vh] jd-resize-none jd-border jd-rounded-md jd-p-4 jd-focus-visible:jd-outline-none jd-focus-visible:jd-ring-2 jd-focus-visible:jd-ring-primary jd-overflow-auto jd-whitespace-pre-wrap ${
                  isDarkMode
                    ? "jd-bg-gray-800 jd-text-gray-100 jd-border-gray-700"
                    : "jd-bg-white jd-text-gray-900 jd-border-gray-200"
                }`}
              ></div>
              <AddBlockButton onClick={() => setAddPosition('bottom')} />
              {addPosition === 'bottom' && (
                <AddBlockControls
                  blocks={groupedBlocks}
                  onAdd={(t, id) => handleAddBlockAtPosition(t, id, 'bottom')}
                  onCancel={() => setAddPosition(null)}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="blocks" className="jd-flex jd-flex-col jd-gap-4">
            {/* Block list */}
            <div className="jd-border jd-rounded-md jd-p-4 jd-max-h-[50vh] jd-overflow-auto">
              <h3 className="jd-text-sm jd-font-medium jd-mb-4">{getMessage('templateBlocks', undefined, 'Template Blocks')}</h3>
              
              {templateBlocks.length > 0 ? (
                <div className="jd-space-y-3">
                  {templateBlocks.map((block, index) => (
                    <div key={`${block.id}-${index}`} className="jd-border jd-rounded-md jd-p-3">
                      <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
                        <div className="jd-flex jd-items-center jd-gap-2">
                          <Badge variant="outline">
                            {block.type || 'content'}
                          </Badge>
                          <span className="jd-text-sm jd-font-medium">
                            {block.name || block.title || `Block ${index + 1}`}
                          </span>
                        </div>
                        
                        <div className="jd-flex jd-items-center jd-gap-1">
                          {/* Only show edit button for custom blocks */}
                          {block.isCustom && currentEditingBlock !== index && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBlock(index)}
                              className="jd-h-8 jd-w-8 jd-p-0"
                            >
                              <Edit className="jd-h-4 jd-w-4" />
                            </Button>
                          )}
                          
                          {/* Only show delete button if not in edit mode */}
                          {currentEditingBlock !== index && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBlock(index)}
                              className="jd-h-8 jd-w-8 jd-p-0 jd-text-red-500"
                            >
                              <Trash className="jd-h-4 jd-w-4" />
                            </Button>
                          )}
                          
                          {/* Save and cancel buttons for editing mode */}
                          {currentEditingBlock === index && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveBlockEdit}
                                className="jd-h-8 jd-w-8 jd-p-0 jd-text-green-500"
                              >
                                <Check className="jd-h-4 jd-w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelBlockEdit}
                                className="jd-h-8 jd-w-8 jd-p-0 jd-text-red-500"
                              >
                                <X className="jd-h-4 jd-w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Block content - different display based on edit mode */}
                      {currentEditingBlock === index ? (
                        <Textarea
                          value={customBlockContent}
                          onChange={(e) => setCustomBlockContent(e.target.value)}
                          placeholder={getMessage('enterBlockContent', undefined, 'Enter block content')}
                          className="jd-min-h-[100px]"
                        />
                      ) : (
                        <div className="jd-flex jd-flex-col jd-gap-2">
                          {/* Block type selector for replacing blocks */}
                          {block.type && block.type !== 'content' && groupedBlocks[block.type] && (
                            <div className="jd-flex jd-items-center jd-gap-2">
                              <span className="jd-text-xs jd-text-muted-foreground">
                                {getMessage('changeBlockTo', undefined, 'Change to:')}
                              </span>
                              <Select onValueChange={(value) => handleChangeBlock(index, value)}>
                                <SelectTrigger className="jd-w-[200px]">
                                  <SelectValue placeholder={getMessage('selectAlternative', undefined, 'Select alternative')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {groupedBlocks[block.type]?.map((b: any) => (
                                    <SelectItem key={b.id} value={b.id.toString()}>
                                      {b.title || b.name || `Block ${b.id}`}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="custom">
                                    {getMessage('customBlock', undefined, 'Custom block')}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          {/* Block preview content */}
                          <div className="jd-text-sm jd-bg-muted jd-p-2 jd-rounded jd-whitespace-pre-wrap jd-max-h-32 jd-overflow-auto">
                            {block.content || getMessage('emptyBlock', undefined, 'Empty block')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="jd-py-4 jd-text-center jd-text-muted-foreground">
                  {getMessage('noBlocksAdded', undefined, 'No blocks have been added to this template yet.')}
                </div>
              )}
            </div>
            
            {/* Add block section */}
            <div className="jd-p-4 jd-border jd-rounded-md">
              <h3 className="jd-text-sm jd-font-medium jd-mb-3">{getMessage('addBlock', undefined, 'Add Block')}</h3>
              
              <div className="jd-flex jd-items-center jd-gap-2 jd-flex-wrap md:jd-flex-nowrap">
                {/* Block type selector */}
                <Select 
                  value={selectedBlockType} 
                  onValueChange={setSelectedBlockType} 
                  disabled={isLoadingTypes}
                >
                  <SelectTrigger className="jd-w-[180px]">
                    <SelectValue placeholder={
                      isLoadingTypes 
                        ? getMessage('loading', undefined, 'Loading...') 
                        : getMessage('selectBlockType', undefined, 'Select type')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(groupedBlocks).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Block selector - only shown when a type is selected */}
                {selectedBlockType && (
                  <Select 
                    value={selectedBlockId} 
                    onValueChange={setSelectedBlockId}
                    disabled={isLoadingBlocks}
                  >
                    <SelectTrigger className="jd-flex-1">
                      <SelectValue placeholder={
                        isLoadingBlocks 
                          ? getMessage('loading', undefined, 'Loading...') 
                          : getMessage('selectBlock', undefined, 'Select block')
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedBlocks[selectedBlockType]?.map((block: any) => (
                        <SelectItem key={block.id} value={block.id.toString()}>
                          {block.title || block.name || `Block ${block.id}`}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        {getMessage('customBlock', undefined, 'Create custom block')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                
                {/* Special option for template content */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedBlockType('content');
                    setSelectedBlockId('0');
                    setTimeout(() => handleAddBlock(), 0);
                  }}
                  className="jd-whitespace-nowrap"
                >
                  <Plus className="jd-h-4 jd-w-4 jd-mr-1" />
                  {getMessage('addContent', undefined, 'Add Content Block')}
                </Button>
                
                {/* Add button - enabled when both type and block are selected */}
                <Button 
                  onClick={handleAddBlock}
                  disabled={!selectedBlockType || !selectedBlockId}
                >
                  {getMessage('addBlock', undefined, 'Add Block')}
                </Button>
              </div>
              
              {isLoadingBlocks && (
                <div className="jd-flex jd-items-center jd-justify-center jd-gap-2 jd-text-sm jd-text-muted-foreground jd-mt-2">
                  <RefreshCw className="jd-h-4 jd-w-4 jd-animate-spin" />
                  {getMessage('loadingBlocks', undefined, 'Loading blocks...')}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="jd-flex jd-flex-col jd-gap-4">
            <div className="jd-border jd-rounded-md jd-p-4 jd-min-h-[50vh] jd-overflow-auto">
              <h3 className="jd-text-sm jd-font-medium jd-mb-4">{getMessage('finalPreview', undefined, 'Final Template Preview')}</h3>
              
              <div className="jd-whitespace-pre-wrap jd-p-4 jd-bg-muted jd-rounded-md">
                {templateBlocks.length > 0 ? (
                  <div className="jd-space-y-4">
                    {templateBlocks.map((block, index) => (
                      <div key={`preview-${index}`} className="jd-border-b jd-pb-4 jd-last:jd-border-0">
                        {block.content || getMessage('emptyBlock', undefined, 'Empty block')}
                      </div>
                    ))}
                  </div>
                ) : modifiedContent ? (
                  modifiedContent
                ) : (
                  <div className="jd-text-center jd-text-muted-foreground jd-py-8">
                    {getMessage('emptyTemplate', undefined, 'This template is empty.')}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

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