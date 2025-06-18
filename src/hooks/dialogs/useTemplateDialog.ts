// src/hooks/dialogs/useTemplateDialogs.ts
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';

export function useTemplateDialogs() {
  const { actions } = useTemplateEditor();

  return {
    openCreateDialog: (data?: any) => {
      actions.openDialog('create', data);
    },
    openCustomizeDialog: (template: any) => {
      actions.openDialog('customize', { template });
    },
    openEditDialog: (template: any) => {
      actions.openDialog('edit', { template });
    }
  };
}