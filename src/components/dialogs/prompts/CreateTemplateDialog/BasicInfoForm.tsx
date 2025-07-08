import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderPlus } from 'lucide-react';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { useFolderMutations } from '@/hooks/prompts/actions/useFolderMutations';
import { useQueryClient } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TemplateFolder } from '@/types/prompts/templates';
import { getMessage } from '@/core/utils/i18n';
import { FolderData, truncateFolderPath } from '@/utils/prompts/templateUtils';
import { trackEvent, EVENTS } from '@/utils/amplitude';

interface Props {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  selectedFolderId: string;
  handleFolderSelect: (v: string) => void;
  userFoldersList: FolderData[];
  validationErrors: Record<string, string>;
}

export const BasicInfoForm: React.FC<Props> = ({
  name,
  setName,
  description,
  setDescription,
  selectedFolderId,
  handleFolderSelect,
  userFoldersList,
  validationErrors
}) => {
  // Defensive programming: ensure userFoldersList is always an array
  const safeFoldersList = Array.isArray(userFoldersList) ? userFoldersList : [];
  const { openCreateFolder } = useDialogActions();
  const { createFolder } = useFolderMutations();
  const queryClient = useQueryClient();

  // Pre-render folder items so they can be inserted before the "create new" action
  const folderListItems = safeFoldersList.map(folder => (
    <SelectItem
      key={folder.id}
      value={folder.id.toString()}
      className="jd-truncate"
      title={folder.fullPath}
    >
      {folder.fullPath}
    </SelectItem>
  ));

  const onFolderChange = (value: string) => {
    if (value === 'new') {
      openCreateFolder({
        onSaveFolder: async (folderData: { title: string; description?: string; parent_folder_id?: number | null }) => {
          try {
            const result = await createFolder.mutateAsync(folderData);
            return { success: true, folder: result };
          } catch (error) {
            console.error('Error creating folder:', error);
            return { success: false, error: 'Failed to create folder' };
          }
        },
        onFolderCreated: async (folder: TemplateFolder) => {
          await queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
          handleFolderSelect(folder.id.toString());
          trackEvent(EVENTS.TEMPLATE_FOLDER_CREATED, {
            folder_id: folder.id,
            folder_name: typeof folder.title === 'string' ? folder.title : (folder.title as any)?.en || folder.name,
            source: 'CreateTemplateDialog'
          });
        }
      });
      return;
    }
    handleFolderSelect(value);
  };

  return (
    <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-3 jd-gap-4 jd-mb-4">
      <div>
        <label className="jd-text-sm jd-font-medium">{getMessage('templateName')}</label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={getMessage('enterTemplateName')}
          className={`jd-mt-1 ${validationErrors.name ? 'jd-border-red-500' : ''}`}
          onKeyDown={e => e.stopPropagation()}
          onKeyPress={e => e.stopPropagation()}
          onKeyUp={e => e.stopPropagation()}
        />
        {validationErrors.name && (
          <p className="jd-text-xs jd-text-red-500 jd-mt-1">{validationErrors.name}</p>
        )}
      </div>
      <div>
        <label className="jd-text-sm jd-font-medium">{getMessage('description')}</label>
        <Input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={getMessage('templateDescriptionPlaceholder')}
          className="jd-mt-1"
          onKeyDown={e => e.stopPropagation()}
          onKeyPress={e => e.stopPropagation()}
          onKeyUp={e => e.stopPropagation()}
        />
      </div>
      <div>
        <label className="jd-text-sm jd-font-medium">{getMessage('folder')}</label>
        <Select value={selectedFolderId || 'root'} onValueChange={onFolderChange}>
          <SelectTrigger className="jd-w-full jd-mt-1">
            <SelectValue placeholder={getMessage('selectFolder')}>
              {selectedFolderId === 'root' ? (
                <span className="jd-text-muted-foreground">{getMessage('noFolder')}</span>
              ) : selectedFolderId ? (
                <span className="jd-truncate">
                  {truncateFolderPath(
                    safeFoldersList.find(f => f.id.toString() === selectedFolderId)?.fullPath || ''
                  )}
                </span>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="jd-max-h-80 jd-bg-background">
            <SelectItem value="root">
              <span className="jd-text-muted-foreground">{getMessage('noFolder')}</span>
            </SelectItem>
            {/* Folder list should appear before the create folder action */}
            {folderListItems}
            <SelectItem value="new" className="jd-text-primary jd-font-medium">
              <div className="jd-flex jd-items-center">
                <FolderPlus className="jd-h-4 jd-w-4 jd-mr-2" />
                {getMessage('createNewFolder')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
