// src/components/dialogs/prompts/UnifiedTemplateDialog/TemplateDialogFooter.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';

export const TemplateDialogFooter: React.FC = () => {
  const { state, actions, computed } = useTemplateEditor();

  return (
    <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4 jd-border-t">
      <Button 
        variant="outline" 
        onClick={actions.closeDialog} 
        disabled={state.dialog.isSubmitting}
      >
        Cancel
      </Button>
      
      <Button 
        onClick={actions.saveTemplate} 
        disabled={!computed.canSave || state.dialog.isSubmitting}
      >
        {state.dialog.isSubmitting ? (
          <>
            <div className="jd-animate-spin jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-rounded-full jd-mr-2"></div>
            Saving...
          </>
        ) : (
          state.dialog.mode === 'create' ? 'Create Template' : 'Save Template'
        )}
      </Button>
    </div>
  );
};