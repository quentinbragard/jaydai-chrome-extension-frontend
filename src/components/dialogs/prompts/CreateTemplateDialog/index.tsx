import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { BasicEditor, AdvancedEditor } from '../editors';
import { BasicInfoForm } from './BasicInfoForm';
import { useCreateTemplateDialog } from '@/hooks/dialogs/useCreateTemplateDialog';

export const CreateTemplateDialog: React.FC = () => {
  const dialog = useCreateTemplateDialog();

  if (!dialog.isOpen) return null;

  return (
    <BaseDialog
      open={dialog.isOpen}
      onOpenChange={open => {
        if (!open) dialog.handleClose();
      }}
      title={dialog.dialogTitle}
      className="jd-max-w-4xl jd-h-[80vh]"
    >
      <div className="jd-flex jd-flex-col jd-h-full jd-gap-4">
        <BasicInfoForm
          name={dialog.name}
          setName={dialog.setName}
          description={dialog.description}
          setDescription={dialog.setDescription}
          selectedFolderId={dialog.selectedFolderId}
          handleFolderSelect={dialog.handleFolderSelect}
          userFoldersList={dialog.userFoldersList}
          validationErrors={dialog.validationErrors}
        />

        <Tabs
          value={dialog.activeTab}
          onValueChange={value => dialog.setActiveTab(value as 'basic' | 'advanced')}
          className="jd-flex-1 jd-flex jd-flex-col"
        >
          <TabsList className="jd-grid jd-w-full jd-grid-cols-2">
            <TabsTrigger value="basic">Basic Editor</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Editor</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="jd-flex-1 jd-overflow-y-auto jd-mt-4">
            <BasicEditor blocks={dialog.blocks} onUpdateBlock={dialog.handleUpdateBlock} mode="create" />
          </TabsContent>

          <TabsContent value="advanced" className="jd-flex-1 jd-overflow-y-auto jd-mt-4">
            <AdvancedEditor
              content={dialog.content}
              metadata={dialog.metadata}
              onContentChange={dialog.setContent}
              onUpdateMetadata={dialog.handleUpdateMetadata}
            />
          </TabsContent>
        </Tabs>

        <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4 jd-border-t">
          <Button variant="outline" onClick={dialog.handleClose} disabled={dialog.isSubmitting}>
            Cancel
          </Button>
          <Button onClick={dialog.handleSave} disabled={dialog.isSubmitting}>
            {dialog.isSubmitting ? (
              <>
                <div className="jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-animate-spin jd-rounded-full jd-inline-block jd-mr-2"></div>
                Create
              </>
            ) : (
              dialog.dialogTitle
            )}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};
