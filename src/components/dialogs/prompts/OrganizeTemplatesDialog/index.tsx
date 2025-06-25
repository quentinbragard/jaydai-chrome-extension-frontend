import React, { useMemo } from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useUserFolders, useUnorganizedTemplates } from '@/hooks/prompts';
import { useFolderMutations } from '@/hooks/prompts';
import { useTemplateMutations } from '@/hooks/prompts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TemplateFolder, Template } from '@/types/prompts/templates';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';

function flattenFolders(folders: TemplateFolder[], prefix: string = ''): { id: number; title: string }[] {
  let result: { id: number; title: string }[] = [];
  for (const f of folders) {
    const title = prefix ? `${prefix} / ${getLocalizedContent(f.title ?? f.name)}` : getLocalizedContent(f.title ?? f.name);
    result.push({ id: f.id, title });
    if (Array.isArray(f.Folders)) {
      result = result.concat(flattenFolders(f.Folders, title));
    }
  }
  return result;
}

function gatherTemplates(folders: TemplateFolder[], prefix: string = ''): Array<Template & { path: string }> {
  let result: Array<Template & { path: string }> = [];
  for (const f of folders) {
    const path = prefix ? `${prefix} / ${getLocalizedContent(f.title ?? f.name)}` : getLocalizedContent(f.title ?? f.name);
    if (Array.isArray(f.templates)) {
      f.templates.forEach(t => result.push({ ...t, path }));
    }
    if (Array.isArray(f.Folders)) {
      result = result.concat(gatherTemplates(f.Folders, path));
    }
  }
  return result;
}

export const OrganizeTemplatesDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.ORGANIZE_TEMPLATES);
  const { data: userFolders = [] } = useUserFolders();
  const { data: unorganizedTemplates = [] } = useUnorganizedTemplates();
  const { updateFolder } = useFolderMutations();
  const { updateTemplate } = useTemplateMutations();

  const allFolders = useMemo(() => flattenFolders(userFolders), [userFolders]);
  const allTemplates = useMemo(() => {
    const fromFolders = gatherTemplates(userFolders);
    const unorganized = unorganizedTemplates.map(t => ({ ...t, path: 'Root' }));
    return [...fromFolders, ...unorganized];
  }, [userFolders, unorganizedTemplates]);

  if (!isOpen) return null;

  const handleChangeFolderParent = async (folder: TemplateFolder, parentId: string) => {
    const id = parentId === 'root' ? null : parseInt(parentId, 10);
    try {
      await updateFolder.mutateAsync({ id: folder.id, data: { parent_folder_id: id } });
    } catch (e) {
      console.error('Failed to update folder', e);
    }
  };

  const handleChangeTemplateFolder = async (template: Template, folderId: string) => {
    const id = folderId === 'root' ? null : parseInt(folderId, 10);
    try {
      await updateTemplate.mutateAsync({ id: template.id, data: { folder_id: id } });
    } catch (e) {
      console.error('Failed to update template', e);
    }
  };

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title="Organize Templates"
      description="Move folders and templates"
      className="jd-max-w-lg"
    >
      <div className="jd-space-y-4 jd-mt-4 jd-max-h-[70vh] jd-overflow-y-auto">
        {/* Folders */}
        {userFolders.map(folder => (
          <div key={`folder-${folder.id}`} className="jd-flex jd-items-center jd-justify-between jd-gap-2">
            <span>{getLocalizedContent(folder.title ?? folder.name)}</span>
            <Select
              value={folder.parent_folder_id ? String(folder.parent_folder_id) : 'root'}
              onValueChange={(val) => handleChangeFolderParent(folder, val)}
            >
              <SelectTrigger className="jd-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                {allFolders.filter(f => f.id !== folder.id).map(f => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <hr />
        {/* Templates */}
        {allTemplates.map(t => (
          <div key={`template-${t.id}`} className="jd-flex jd-items-center jd-justify-between jd-gap-2">
            <span className="jd-truncate jd-text-sm" title={t.title}>{t.title}</span>
            <Select
              value={t.folder_id ? String(t.folder_id) : 'root'}
              onValueChange={(val) => handleChangeTemplateFolder(t, val)}
            >
              <SelectTrigger className="jd-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                {allFolders.map(f => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="jd-flex jd-justify-end jd-gap-2 jd-mt-4">
        <Button variant="outline" onClick={() => dialogProps.onOpenChange(false)}>Close</Button>
      </div>
    </BaseDialog>
  );
};

export default OrganizeTemplatesDialog;
