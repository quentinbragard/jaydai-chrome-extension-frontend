import { useCallback } from 'react';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';

export function useDialogActions() {
  const { openDialog } = useDialogManager();
  const { actions: templateEditor } = useTemplateEditor();

  const openSettings = useCallback(() => openDialog(DIALOG_TYPES.SETTINGS, {}), [openDialog]);

  const openCreateTemplate = useCallback(
    (props?: any) => templateEditor.openDialog('create', props),
    [templateEditor]
  );

  const openEditTemplate = useCallback(
    (props?: any) => templateEditor.openDialog('edit', props),
    [templateEditor]
  );

  const openCreateFolder = useCallback(
    (props?: any) => openDialog(DIALOG_TYPES.CREATE_FOLDER, props),
    [openDialog]
  );

  const openFolderManager = useCallback(
    (props?: any) => openDialog(DIALOG_TYPES.FOLDER_MANAGER, props),
    [openDialog]
  );

  const openAuth = useCallback(
    (props?: any) => openDialog(DIALOG_TYPES.AUTH, props),
    [openDialog]
  );

  const openPlaceholderEditor = useCallback(
    (props?: any) => templateEditor.openDialog('customize', props),
    [templateEditor]
  );

  const openConfirmation = useCallback(
    (props?: any) => openDialog(DIALOG_TYPES.CONFIRMATION, props),
    [openDialog]
  );

  const openEnhancedStats = useCallback(
    () => openDialog(DIALOG_TYPES.ENHANCED_STATS, {}),
    [openDialog]
  );

  const openCreateBlock = useCallback(
    (props?: any) => openDialog(DIALOG_TYPES.CREATE_BLOCK, props),
    [openDialog]
  );

  const openInsertBlock = useCallback(
    () => openDialog(DIALOG_TYPES.INSERT_BLOCK, {}),
    [openDialog]
  );

  return {
    openSettings,
    openCreateTemplate,
    openEditTemplate,
    openCreateFolder,
    openFolderManager,
    openAuth,
    openPlaceholderEditor,
    openConfirmation,
    openEnhancedStats,
    openCreateBlock,
    openInsertBlock,
  };
}
