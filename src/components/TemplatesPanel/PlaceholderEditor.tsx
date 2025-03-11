import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PlaceholderEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateContent: string;
  onComplete: (modifiedContent: string) => void;
  templateTitle?: string;
}

const PlaceholderEditor: React.FC<PlaceholderEditorProps> = ({
  open,
  onOpenChange,
  templateContent,
  onComplete,
  templateTitle = "Template"
}) => {
  const [placeholders, setPlaceholders] = useState<{ key: string; value: string }[]>([]);
  const [modifiedContent, setModifiedContent] = useState(templateContent);
  const editableRef = useRef<HTMLDivElement>(null);

  // Extract placeholders from template content
  useEffect(() => {
    if (open && templateContent) {
      const placeholderRegex = /\[([A-Z0-9_/ ]+)\]/g;
      const matches = [...templateContent.matchAll(placeholderRegex)];
      
      // Get unique placeholders
      const uniquePlaceholders = Array.from(new Set(
        matches.map(match => match[0])
      )).map(placeholder => ({
        key: placeholder,
        value: ''
      }));
      
      setPlaceholders(uniquePlaceholders);
      setModifiedContent(templateContent);
    }
  }, [open, templateContent]);

  // Update content when placeholder values change
  const updatePlaceholder = (index: number, value: string) => {
    const updatedPlaceholders = [...placeholders];
    updatedPlaceholders[index].value = value;
    setPlaceholders(updatedPlaceholders);
    
    // Apply all placeholders to the content
    let newContent = templateContent;
    updatedPlaceholders.forEach(ph => {
      if (ph.value) {
        // Use global regex to replace all instances
        const regex = new RegExp(escapeRegExp(ph.key), 'g');
        newContent = newContent.replace(regex, ph.value);
      }
    });
    
    setModifiedContent(newContent);
  };

  // Helper to escape regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Custom render function to highlight unresolved placeholders
  const renderContent = useMemo(() => {
    let content = modifiedContent;
    
    // Find unresolved placeholders and highlight them
    const unresolvedPlaceholders = placeholders.filter(p => !p.value);
    
    unresolvedPlaceholders.forEach(ph => {
      const regex = new RegExp(`(${escapeRegExp(ph.key)})`, 'g');
      content = content.replace(regex, `<mark class="bg-yellow-200 dark:bg-yellow-600">${ph.key}</mark>`);
    });
    
    return content;
  }, [modifiedContent, placeholders]);

  // Handle input to maintain cursor position
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setModifiedContent(target.innerText);
  };

  const handleComplete = () => {
    onComplete(modifiedContent);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-sm" />
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col z-50 border-primary/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Customize Template: {templateTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 flex-grow overflow-hidden">
          {/* Placeholders Section */}
          <div className="space-y-4 overflow-auto">
            <h3 className="text-sm font-medium">Replace Placeholders</h3>
            
            {placeholders.length > 0 ? (
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  {placeholders.map((placeholder, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-sm font-medium flex items-center">
                        <span className="bg-primary/10 px-2 py-1 rounded">{placeholder.key}</span>
                      </label>
                      <Input
                        value={placeholder.value}
                        onChange={e => updatePlaceholder(idx, e.target.value)}
                        placeholder={`Enter value for ${placeholder.key}`}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                No placeholders found in this template
              </div>
            )}
          </div>
          
          {/* Preview Section */}
          <div className="border rounded-md p-4 overflow-hidden flex flex-col">
            <h3 className="text-sm font-medium mb-2">Preview (Editable)</h3>
            <div className="flex-grow">
              <div 
                ref={editableRef}
                contentEditable 
                suppressContentEditableWarning
                onInput={handleInput}
                dangerouslySetInnerHTML={{ __html: renderContent }}
                className="border rounded p-2 h-[50vh] overflow-auto text-sm"
              />
            </div>
            {placeholders.some(p => !p.value && modifiedContent.includes(p.key)) && (
              <div className="text-yellow-600 text-xs mt-2">
                Some placeholders are not replaced
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleComplete}>
            {placeholders.some(p => !p.value && modifiedContent.includes(p.key)) 
              ? "Use With Placeholders" 
              : "Use Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceholderEditor;