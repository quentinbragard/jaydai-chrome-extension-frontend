// src/components/dialogs/templates/editor/template/BasicTemplateEditor.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';

interface BasicTemplateEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  error?: string;
}

/**
 * Basic template editor - simple textarea for content editing
 * Simplified version for template creation
 */
export const BasicTemplateEditor: React.FC<BasicTemplateEditorProps> = ({
  content,
  onContentChange,
  error
}) => {
  return (
    <div className="jd-h-full jd-flex jd-flex-col jd-gap-4">
      <Alert>
        <Info className="jd-h-4 jd-w-4" />
        <AlertDescription>
          {getMessage('templateEditorTip', undefined, 'Use [placeholders] in square brackets to create dynamic content that can be filled in when using the template.')}
        </AlertDescription>
      </Alert>
      
      <div className="jd-flex-1">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={getMessage('enterTemplateContent', undefined, 'Enter your template content here...\n\nExample:\nWrite a [type] email about [topic] for [audience].')}
          className={`jd-h-full jd-resize-none jd-font-mono ${error ? 'jd-border-red-500' : ''}`}
        />
        {error && (
          <p className="jd-text-xs jd-text-red-500 jd-mt-1">{error}</p>
        )}
      </div>
      
      <div className="jd-text-xs jd-text-muted-foreground jd-flex jd-justify-between">
        <span>{content.length} characters</span>
        <span>{content.split('\n').length} lines</span>
      </div>
    </div>
  );
};