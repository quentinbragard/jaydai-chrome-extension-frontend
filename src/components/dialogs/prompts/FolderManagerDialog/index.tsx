import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { getMessage } from '@/core/utils/i18n';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { toast } from 'sonner';
import { useFolderMutations } from '@/hooks/prompts/actions';
import { TemplateFolder } from '@/types/prompts/templates';

interface FolderManagerData {
  folder: TemplateFolder;
  userFolders: TemplateFolder[];
  onUpdated?: (folder: TemplateFolder) => void;
}

export const FolderManagerDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.FOLDER_MANAGER);
  const { updateFolder } = useFolderMutations();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogData = (data || {}) as FolderManagerData;
  const folder = dialogData.folder;
  const folders = dialogData.userFolders || [];

  useEffect(() => {
    if (isOpen && folder) {
      const folderTitle = folder.title ?? folder.title;
      const folderDesc = folder.description;
      setTitle(getLocalizedContent(folderTitle) || '');
      setDescription(getLocalizedContent(folderDesc) || '');
      setParentId(folder.parent_folder_id ?? folder.parent_id ?? null);
      setIsSubmitting(false);
    }
  }, [isOpen, folder]);

  if (!isOpen || !folder) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSubmitting(true);
    try {
      await updateFolder.mutateAsync({
        id: folder.id,
        data: {
          title,
          ...(description ? { description } : {}),
          parent_folder_id: parentId,
        },
      });
      toast.success('Folder updated');
      if (dialogData.onUpdated) {
        dialogData.onUpdated({ ...folder, title, description, parent_folder_id: parentId });
      }
      dialogProps.onOpenChange(false);
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={getMessage('editFolder', undefined, 'Edit Folder')}
      description={getMessage('editFolderDescription', undefined, 'Update folder information')}
      className="jd-max-w-xl"
    >
      <form onSubmit={handleSave} className="jd-space-y-4 jd-mt-4">
        <div>
          <label className="jd-text-sm jd-font-medium">{getMessage('name', undefined, 'Name')}</label>
          <Input
            value={title}
            placeholder="Folder name"
            onChange={(e) => setTitle(e.target.value)}
            className="jd-mt-1"
          />
        </div>
        <div>
          <label className="jd-text-sm jd-font-medium">Description</label>
          <Textarea
            value={description}
            placeholder="Optional description"
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="jd-mt-1"
          />
        </div>
        <div>
          <label className="jd-text-sm jd-font-medium">{getMessage('parentFolder', undefined, 'Parent Folder')}</label>
          <Select
            value={parentId !== null ? String(parentId) : 'root'}
            onValueChange={(val) =>
              setParentId(val === 'root' ? null : parseInt(val))
            }
          >
            <SelectTrigger className="jd-mt-1">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">None</SelectItem>

              {folders.filter(f => f.id !== folder.id).map(f => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {getLocalizedContent(f.title ?? f.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4">
          <Button type="button" variant="outline" onClick={() => dialogProps.onOpenChange(false)} disabled={isSubmitting}>
            {getMessage('cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting || !title.trim()}
            className="jd-flex jd-items-center jd-gap-1">
            {isSubmitting && (
              <div className="jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-animate-spin jd-rounded-full"></div>
            )}
            <span>{getMessage('save')}</span>
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
};

export default FolderManagerDialog;
