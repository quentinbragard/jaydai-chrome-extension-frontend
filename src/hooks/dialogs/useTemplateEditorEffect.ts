// src/hooks/dialogs/useTemplateEditorEffects.ts
import { useEffect } from 'react';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';
import { TemplateEditorService } from '@/services/TemplateEditorService';

/**
 * Handle side effects for template editor
 */
export function useTemplateEditorEffects() {
  const { state, dispatch } = useTemplateEditor();

  // Load template data when dialog opens
  useEffect(() => {
    if (!state.dialog.isOpen) return;

    const loadData = async () => {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      
      try {
        if (state.dialog.mode === 'customize' || state.dialog.mode === 'edit') {
          const templateId = state.dialog.template?.id;
          if (templateId) {
            const data = await TemplateEditorService.loadTemplate(templateId);
            
            // Populate state with loaded data
            dispatch({ type: 'SET_BLOCKS_DATA', payload: {
              blockContentCache: data.blockContentCache,
              isLoading: false
            }});
            
            dispatch({ type: 'UPDATE_METADATA', payload: data.metadata });
            dispatch({ type: 'UPDATE_CONTENT', payload: data.template.content || '' });
          }
        } else {
          // For create mode, just load available blocks
          // This could be optimized to load blocks on demand
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load data' });
      } finally {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    };

    loadData();
  }, [state.dialog.isOpen, state.dialog.mode, dispatch]);

  // Auto-save validation
  useEffect(() => {
    const templateData = {
      name: state.form.name,
      description: state.form.description,
      content: state.content.content,
      metadata: state.metadata.metadata,
      folderId: state.form.selectedFolderId
    };

    const validation = TemplateEditorService.validateTemplate(templateData);
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: validation.errors });
  }, [state.form, state.content.content, state.metadata.metadata, dispatch]);
}
