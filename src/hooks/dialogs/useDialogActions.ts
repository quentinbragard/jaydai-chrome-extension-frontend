import { useCallback } from 'react';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES, DialogProps } from '@/components/dialogs/DialogRegistry';

export function useDialogActions() {
  const { openDialog } = useDialogManager();

  const openSettings = useCallback(() => openDialog(DIALOG_TYPES.SETTINGS, {}), [openDialog]);

  const openCreateTemplate = useCallback(
    (props?: any) => openDialog(DIALOG_TYPES.CREATE_TEMPLATE, props),
    [openDialog]
  );

  const openEditTemplate = useCallback(
    (props?: any) => openDialog(DIALOG_TYPES.EDIT_TEMPLATE, props),
    [openDialog]
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

  const opentemplateDialog = useCallback(
    (props?: any) => openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, props),
    [openDialog]
  );

  const openConfirmation = useCallback(
    (props?: any) => openDialog(DIALOG_TYPES.CONFIRMATION, props),
    [openDialog]
  );

  const openEnhancedStats = useCallback(
    () => openDialog(DIALOG_TYPES.ENHANCED_STATS, {}),
    [openDialog]
  );

  const openBrowseMoreFolders = useCallback(
    () => openDialog(DIALOG_TYPES.BROWSE_MORE_FOLDERS, {}),
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

  const openTutorials = useCallback(
    () => openDialog(DIALOG_TYPES.TUTORIALS_LIST, {}),
    [openDialog]
  );

  const openTutorialVideo = useCallback(
    (url: string, title?: string) =>
      openDialog(DIALOG_TYPES.TUTORIAL_VIDEO, { url, title }),
    [openDialog]
  );

  const openKeyboardShortcut = useCallback(
    (props?: DialogProps[typeof DIALOG_TYPES.KEYBOARD_SHORTCUT]) =>
      openDialog(DIALOG_TYPES.KEYBOARD_SHORTCUT, props ?? {}),
    [openDialog]
  );

  const openInformation = useCallback(
    (props?: DialogProps[typeof DIALOG_TYPES.INFORMATION]) =>
      openDialog(DIALOG_TYPES.INFORMATION, props ?? {}),
      [openDialog]
  );

  const openShareDialog = useCallback(
    () => openDialog(DIALOG_TYPES.SHARE, {}),
    [openDialog]
  );

  const openReferralShareDialog = useCallback(
    () => openDialog(DIALOG_TYPES.REFERRAL_SHARE, {}),
    [openDialog]
  );

  return {
    openSettings,
    openCreateTemplate,
    openEditTemplate,
    openCreateFolder,
    openFolderManager,
    openAuth,
    opentemplateDialog,
    openConfirmation,
    openEnhancedStats,
    openBrowseMoreFolders,
    openCreateBlock,
    openInsertBlock,
    openTutorials,
    openTutorialVideo,
    openKeyboardShortcut,
    openInformation,
    openShareDialog,
    openReferralShareDialog,
  };
}
