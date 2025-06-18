// src/components/dialogs/prompts/editors/BasicEditor/index.tsx (simplified)
import React from 'react';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';
import { ContentEditor } from './ContentEditor';
import { PlaceholderPanel } from './PlaceholderPanel';
import { EnhancedEditablePreview } from '@/components/prompts/EnhancedEditablePreview';

export const BasicEditor: React.FC = () => {
  const { state, actions } = useTemplateEditor();

  // All the complex logic is now in the context and service layer
  // This component just handles UI rendering and user interactions

  return (
    <div className="jd-h-full jd-flex jd-flex-col jd-space-y-4">
      {state.dialog.mode === 'create' ? (
        // Create mode - just content editor
        <ContentEditor
          content={state.content.content}
          onChange={actions.updateContent}
          hasUnsavedChanges={state.content.hasUnsavedChanges}
        />
      ) : (
        // Customize mode - split view with placeholders
        <div className="jd-flex jd-flex-1 jd-gap-4">
          <div className="jd-w-1/3">
            <PlaceholderPanel />
          </div>
          <div className="jd-flex-1">
            <EnhancedEditablePreview
              metadata={state.metadata.metadata}
              content={state.content.content}
              blockContentCache={state.blocks.blockContentCache}
              finalPromptContent={state.content.finalPromptContent}
              onFinalContentChange={(content) => 
                actions.dispatch({ type: 'UPDATE_FINAL_CONTENT', payload: content })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};