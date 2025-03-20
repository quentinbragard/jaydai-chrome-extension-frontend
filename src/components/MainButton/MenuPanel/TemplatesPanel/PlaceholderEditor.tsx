import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay, DialogDescription } from "@/components/ui/dialog";
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
  templateTitle = "Template",
}) => {
  const [placeholders, setPlaceholders] = useState<{ key: string; value: string }[]>([]);
  const [modifiedContent, setModifiedContent] = useState(templateContent);
  const [contentMounted, setContentMounted] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

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

  // Function to highlight placeholders inside the content
  const highlightPlaceholders = (content: string) => {
    return content.replace(
      /\[(.*?)\]/g,
      `<span class="bg-yellow-300 text-yellow-900 font-bold px-1 rounded">${"$&"}</span>`
    );
  };

  // Ensure initial content is rendered in contentEditable div
  useEffect(() => {
    if (open) {
      setModifiedContent(templateContent);
      setPlaceholders(extractPlaceholders(templateContent));

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = highlightPlaceholders(templateContent);
          setContentMounted(true);
        }
      }, 0);
    }
  }, [open, templateContent]);

  // Handle changes inside contentEditable div
  useEffect(() => {
    if (!contentMounted || !editorRef.current) return;

    const observer = new MutationObserver(() => {
      setModifiedContent(editorRef.current?.innerText || "");
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
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(open) => {
        onOpenChange(open);
        document.dispatchEvent(new CustomEvent(
          open ? 'archimind:placeholder-editor-opened' : 'archimind:placeholder-editor-closed'
        ));
      }}
    >
      <DialogOverlay className="bg-black/70 backdrop-blur-sm" />
      <DialogContent
        className="max-w-3xl max-h-[90vh] flex flex-col z-50 border-primary/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <DialogDescription>
          {chrome.i18n.getMessage('customizeTemplateDesc')}
        </DialogDescription>
        <DialogHeader>
          <DialogTitle>{chrome.i18n.getMessage('customizeTemplate', { template_name: templateTitle })}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 flex-grow overflow-hidden">
          {/* Placeholders Section */}
          <div className="space-y-4 overflow-auto">
            <h3 className="text-sm font-medium">{chrome.i18n.getMessage('replacePlaceholders')}</h3>

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
              <div className="text-muted-foreground text-center py-8">{chrome.i18n.getMessage('noPlaceholders')}</div>
            )}
          </div>

          {/* Rich Text Editable Section */}
          <div className="border rounded-md p-4 overflow-hidden flex flex-col">
            <h3 className="text-sm font-medium mb-2">{chrome.i18n.getMessage('editTemplate')}</h3>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="flex-grow h-[50vh] resize-none border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-primary overflow-auto"
              onClick={(e) => e.stopPropagation()} // Add this to prevent click propagation
              onMouseDown={(e) => e.stopPropagation()} // Add this to prevent mousedown propagation
            ></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {chrome.i18n.getMessage('cancel')}
          </Button>
          <Button onClick={handleComplete}>{chrome.i18n.getMessage('useTemplate')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceholderEditor;