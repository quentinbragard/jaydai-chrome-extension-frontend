// src/components/dialogs/prompts/UnifiedTemplateDialog/BasicInfoForm.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderPlus } from 'lucide-react';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { getMessage } from '@/core/utils/i18n';

export const BasicInfoForm: React.FC = () => {
  const { state, actions } = useTemplateEditor();
  const { openCreateFolder } = useDialogActions();

  const handleFormUpdate = (field: string, value: string) => {
    actions.updateForm({ [field]: value });
  };

  const handleFolderSelect = (value: string) => {
    if (value === 'new') {
      openCreateFolder({});
      return;
    }
    handleFormUpdate('selectedFolderId', value);
  };

  return (
    <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-3 jd-gap-4 jd-mb-4">
      <div>
        <label className="jd-text-sm jd-font-medium">{getMessage('templateName')}</label>
        <Input
          value={state.form.name}
          onChange={(e) => handleFormUpdate('name', e.target.value)}
          placeholder={getMessage('enterTemplateName')}
          className={`jd-mt-1 ${state.ui.validationErrors.name ? 'jd-border-red-500' : ''}`}
        />
        {state.ui.validationErrors.name && (
          <p className="jd-text-xs jd-text-red-500 jd-mt-1">
            {state.ui.validationErrors.name}
          </p>
        )}
      </div>

      <div>
        <label className="jd-text-sm jd-font-medium">{getMessage('description')}</label>
        <Input
          value={state.form.description}
          onChange={(e) => handleFormUpdate('description', e.target.value)}
          placeholder={getMessage('templateDescriptionPlaceholder')}
          className="jd-mt-1"
        />
      </div>

      <div>
        <label className="jd-text-sm jd-font-medium">{getMessage('folder')}</label>
        <Select value={state.form.selectedFolderId || 'root'} onValueChange={handleFolderSelect}>
          <SelectTrigger className="jd-w-full jd-mt-1">
            <SelectValue placeholder={getMessage('selectFolder')} />
          </SelectTrigger>
          <SelectContent className="jd-max-h-80 jd-bg-background">
            <SelectItem value="root">
              <span className="jd-text-muted-foreground">{getMessage('noFolder')}</span>
            </SelectItem>
            {/* Folder list would be populated from context */}
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