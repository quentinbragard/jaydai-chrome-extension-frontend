// src/components/dialogs/templates/PlaceholderEditor.tsx
import React, { useState, useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDialog } from '@/components/dialogs/core/DialogContext';
import { DIALOG_TYPES } from '@/core/dialogs/registry';
import { getMessage } from '@/core/utils/i18n';

interface Placeholder {
  key: string;
  value: string;
}

/**
 * Dialog for editing template placeholders
 */
export const PlaceholderEditor: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [modifiedContent, setModifiedContent] = useState('');
  const [contentMounted, setContentMounted] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Safe extraction of dialog data with defaults
  const templateContent = data?.content || '';
  const templateTitle = data?.title || 'Template';
  const onComplete = data?.onComplete || (() => {});
  
  // Extract placeholders from template content
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

  // Function to highlight placeholders inside the content with improved formatting
  const highlightPlaceholders = (content: string) => {
    return content
      .replace(/\n/g, '<br>')  // Convert newlines to <br> for proper display
      .replace(
        /\[(.*?)\]/g, 
        `<span class="bg-yellow-300 text-yellow-900 font-bold px-1 rounded inline-block my-0.5">${"$&"}</span>`
      );
  };

  // Initialize when dialog opens
  useEffect(() => {
    if (isOpen) {
      setModifiedContent(templateContent);
      setPlaceholders(extractPlaceholders(templateContent));

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = highlightPlaceholders(templateContent);
          setContentMounted(true);
        }
      }, 0);
    }
  }, [isOpen, templateContent]);

  // Handle changes inside contentEditable div
  useEffect(() => {
    if (!contentMounted || !editorRef.current) return;

    const observer = new MutationObserver(() => {
      // Replace <br> back to \n when getting text
      const cleanedContent = editorRef.current?.innerHTML
        .replace(/<br>/g, '\n')
        .replace(/<\/?span[^>]*>/g, '')  // Remove span tags
        .replace(/&nbsp;/g, ' ');  // Replace non-breaking spaces

      setModifiedContent(cleanedContent || "");
    });

    observer.observe(editorRef.current, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [contentMounted]);

  // Update placeholder values
  const updatePlaceholder = (index: number, value: string) => {
    const updatedPlaceholders = [...placeholders];
    updatedPlaceholders[index].value = value;
    setPlaceholders(updatedPlaceholders);

    let newContent = templateContent;
    updatedPlaceholders.forEach(({ key, value }) => {
      const regex = new RegExp(escapeRegExp(key), "g");
      newContent = newContent.replace(regex, value || key);
    });

    setModifiedContent(newContent);

    if (editorRef.current) {
      editorRef.current.innerHTML = highlightPlaceholders(newContent);
    }
  };

  // Helper function to escape regex characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const handleComplete = () => {
    onComplete(modifiedContent);
    dialogProps.onOpenChange(false);
  };
  
  if (!isOpen) return null;

  return (
    <Dialog 
      {...dialogProps}
      onOpenChange={(open) => {
        dialogProps.onOpenChange(open);
        document.dispatchEvent(new CustomEvent(
          open ? 'archimind:placeholder-editor-opened' : 'archimind:placeholder-editor-closed'
        ));
      }}
    >
      <DialogContent
        className="max-w-3xl max-h-[90vh] flex flex-col z-[10001] border-primary/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflow: 'auto' }}
      >
        <DialogDescription>
          {getMessage('customizeTemplateDesc', undefined, 'Customize the template by filling in the placeholders.')}
        </DialogDescription>
        <DialogHeader>
          <DialogTitle>{getMessage('customizeTemplate', ['Template'], `Customize Template: ${templateTitle}`)}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 flex-grow overflow-hidden">
          {/* Placeholders Section */}
          <div className="space-y-4 overflow-auto">
            <h3 className="text-sm font-medium">{getMessage('replacePlaceholders', undefined, 'Replace Placeholders')}</h3>

            {placeholders.length > 0 ? (
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  {placeholders.map((placeholder, idx) => (
                    <div key={placeholder.key + idx} className="space-y-1">
                      <label className="text-sm font-medium flex items-center">
                        <span className="bg-primary/10 px-2 py-1 rounded">{placeholder.key}</span>
                      </label>
                      <Input
                        value={placeholder.value}
                        onChange={(e) => updatePlaceholder(idx, e.target.value)}
                        placeholder={`Enter value for ${placeholder.key}`}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-muted-foreground text-center py-8">{getMessage('noPlaceholders', undefined, 'No placeholders found in this template.')}</div>
            )}
          </div>

          {/* Rich Text Editable Section */}
          <div className="border rounded-md p-4 overflow-hidden flex flex-col">
            <h3 className="text-sm font-medium mb-2">{getMessage('editTemplate', undefined, 'Edit Template')}</h3>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="flex-grow h-[50vh] resize-none border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-primary overflow-auto whitespace-pre-wrap"
              onClick={(e) => e.stopPropagation()} 
              onMouseDown={(e) => e.stopPropagation()} 
            ></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => dialogProps.onOpenChange(false)}>
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button onClick={handleComplete}>{getMessage('useTemplate', undefined, 'Use Template')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};