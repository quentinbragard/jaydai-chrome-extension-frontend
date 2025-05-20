import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { AddBlockButton } from '@/components/common/AddBlockButton';
import { Block } from '@/types/prompts/blocks';
import { useDialog } from '@/hooks/dialogs/useDialog';
import { BaseDialog } from '../BaseDialog';
import { getMessage, getCurrentLanguage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import {
  extractPlaceholders,
  applyPlaceholders,
  highlightPlaceholders,
  cleanEditorContent
} from '@/utils/templates/placeholderUtils';

interface Placeholder {
  key: string;
  value: string;
}

const SAMPLE_BLOCKS: Block[] = [
  { id: 1, name: 'Context Block', type: 'context', content: '[Context]' },
  { id: 2, name: 'Role Block', type: 'role', content: '[Role]' }
];

export const PlaceholderEditor: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog('placeholderEditor');
  const editorRef = useRef<HTMLDivElement>(null);
  const isDarkMode = useThemeDetector();

  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [modifiedContent, setModifiedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTemplateContent = () => {
    const raw = data?.content;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') {
      const lang = getCurrentLanguage();
      return raw[lang] || raw['en'] || Object.values(raw)[0] || '';
    }
    return '';
  };
  const templateContent = getTemplateContent();
  const onComplete = data?.onComplete || (() => {});

  useEffect(() => {
    if (isOpen && templateContent) {
      const normalized = templateContent.replace(/\r\n/g, '\n');
      setModifiedContent(normalized);
      setPlaceholders(extractPlaceholders(normalized));
      if (editorRef.current) {
        editorRef.current.innerHTML = highlightPlaceholders(normalized);
      }
    }
  }, [isOpen, templateContent]);

  const updateEditor = (content: string) => {
    setModifiedContent(content);
    if (editorRef.current) {
      editorRef.current.innerHTML = highlightPlaceholders(content);
    }
  };

  const handleAddBlock = (block: Block, position: 'start' | 'end') => {
    const newContent =
      position === 'start'
        ? `${block.content}\n${modifiedContent}`
        : `${modifiedContent}\n${block.content}`;
    updateEditor(newContent);
  };

  const handleRemoveBlock = (position: 'start' | 'end') => {
    const lines = modifiedContent.split('\n');
    if (position === 'start') {
      const first = lines[0]?.trim();
      if (SAMPLE_BLOCKS.some(b => b.content === first)) {
        lines.shift();
      }
    } else {
      const last = lines[lines.length - 1]?.trim();
      if (SAMPLE_BLOCKS.some(b => b.content === last)) {
        lines.pop();
      }
    }
    updateEditor(lines.join('\n'));
  };

  const handleEditorBlur = () => {
    setIsEditing(false);
    if (editorRef.current) {
      updateEditor(cleanEditorContent(editorRef.current.innerHTML));
    }
  };

  const updatePlaceholderValue = (index: number, value: string) => {
    if (isEditing) return;
    const updated = [...placeholders];
    updated[index].value = value;
    setPlaceholders(updated);
    const newContent = applyPlaceholders(templateContent.replace(/\r\n/g, '\n'), updated);
    updateEditor(newContent);
  };

  const handleComplete = (d: any) => {
    onComplete(modifiedContent);
    dialogProps.onOpenChange(false);
    trackEvent(EVENTS.TEMPLATE_USED, {
      template_id: d.id,
      template_name: d.title,
      template_type: d.type
    });
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  const handleClose = () => {
    dialogProps.onOpenChange(false);
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
        dialogProps.onOpenChange(open);
      }}
      title={getMessage('placeholderEditor', undefined, 'Placeholder Editor')}
      description={getMessage('placeholderEditorDescription', undefined, 'Edit placeholders in your template')}
      className="jd-max-w-4xl"
    >
      <div className="jd-flex jd-flex-col jd-space-y-4 jd-mt-4">
        {error && (
          <Alert variant="destructive" className="jd-mb-4">
            <AlertTriangle className="jd-h-4 jd-w-4 jd-mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-6 jd-my-4 jd-flex-grow jd-overflow-hidden jd-w-full">
          <div className="jd-space-y-4 jd-overflow-auto">
            <h3 className="jd-text-sm jd-font-medium jd-mb-2">{getMessage('replacePlaceholders')}</h3>

            {placeholders.length > 0 ? (
              <ScrollArea className="jd-h-[50vh]">
                <div className="jd-space-y-4 jd-pr-4">
                  {placeholders.map((p, idx) => (
                    <div key={p.key + idx} className="jd-space-y-1">
                      <label className="jd-text-sm jd-font-medium jd-flex jd-items-center">
                        <span className="jd-bg-primary/10 jd-px-2 jd-py-1 jd-rounded">{p.key}</span>
                      </label>
                      <Input
                        value={p.value}
                        onChange={(e) => updatePlaceholderValue(idx, e.target.value)}
                        placeholder={getMessage('enterValueFor', [p.key])}
                        className="jd-w-full"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="jd-text-muted-foreground jd-text-center jd-py-8">
                {getMessage('noPlaceholders')}
              </div>
            )}
          </div>

          <div
            className={`jd-border jd-rounded-md jd-p-4 jd-overflow-hidden jd-flex jd-flex-col ${
              isDarkMode ? 'jd-border-gray-700' : 'jd-border-gray-200'
            }`}
          >
            <h3 className="jd-text-sm jd-font-medium jd-mb-2">{getMessage('editTemplate')}</h3>
            <div className="jd-relative jd-flex jd-flex-col jd-flex-grow">
              <AddBlockButton
                blocks={SAMPLE_BLOCKS}
                onAdd={(b) => handleAddBlock(b, 'start')}
                onRemove={() => handleRemoveBlock('start')}
                className="jd-absolute jd-left-1/2 -jd-translate-x-1/2 -jd-top-3"
              />
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setIsEditing(true)}
                onBlur={handleEditorBlur}
                className={`jd-flex-grow jd-h-[50vh] jd-resize-none jd-border jd-rounded-md jd-p-4 jd-focus-visible:jd-outline-none jd-focus-visible:jd-ring-2 jd-focus-visible:jd-ring-primary jd-overflow-auto jd-whitespace-pre-wrap ${
                  isDarkMode ? 'jd-bg-gray-800 jd-text-gray-100 jd-border-gray-700' : 'jd-bg-white jd-text-gray-900 jd-border-gray-200'
                }`}
              ></div>
              <AddBlockButton
                blocks={SAMPLE_BLOCKS}
                onAdd={(b) => handleAddBlock(b, 'end')}
                onRemove={() => handleRemoveBlock('end')}
                className="jd-absolute jd-left-1/2 -jd-translate-x-1/2 jd-bottom-3"
              />
            </div>
          </div>
        </div>

        <div className="jd-mt-4 jd-flex jd-justify-end jd-gap-2">
          <Button variant="outline" onClick={handleClose}>
            {getMessage('cancel')}
          </Button>
          <Button onClick={() => handleComplete(data)}>{getMessage('useTemplate')}</Button>
        </div>
      </div>
    </BaseDialog>
  );
};
