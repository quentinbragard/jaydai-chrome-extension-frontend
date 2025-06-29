
// src/components/dialogs/templates/CreateFolderDialog.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { useUserFolders } from '@/hooks/prompts';
import { FolderPicker } from '@/components/prompts/folders';
import { TemplateFolder } from '@/types/prompts/templates';

/**
 * Dialog for creating new template folders
 * Enhanced for dialog stacking scenarios and Claude.ai compatibility
 */
export const CreateFolderDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.CREATE_FOLDER);
  console.log("data--->", data);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentId, setParentId] = useState<number | null>(null);
  const [parentPath, setParentPath] = useState('Root');

  const { data: userFolders = [] } = useUserFolders();
  console.log("userFolders--->", userFolders);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setIsSubmitting(false);
      setParentId(null);
      setParentPath('Root');
    }
  }, [isOpen]);
  
  // Safe extraction of dialog data with defaults
  const onSaveFolder = data?.onSaveFolder || (() => Promise.resolve(false));
  const onFolderCreated = data?.onFolderCreated;

  const handleParentSelect = useCallback((folder: TemplateFolder | null, path: string) => {
    setParentId(folder?.id ?? null);
    setParentPath(path || 'Root');
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!title.trim()) {
      toast.error('Folder title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare folder data. The backend will handle localization, so send plain strings.
      const folderData = {
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        parent_folder_id: parentId,
      };
      
      // Call the provided callback with folder data if it exists
      if (onSaveFolder) {
        const customResult = await onSaveFolder(folderData);
        if (customResult && customResult.success && customResult.folder) {
          if (onFolderCreated) {
            onFolderCreated(customResult.folder);
          }
          
          toast.success(`Folder "${title}" created successfully`);
          resetForm();
          dialogProps.onOpenChange(false);
          return;
        } else if (customResult && !customResult.success) {
          toast.error(customResult.error || 'Failed to create folder');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Default handling - use direct API call
      const response = await promptApi.createFolder(folderData);

      if (response.success && response.data) {
        if (onFolderCreated) {
          onFolderCreated(response.data);
        }
        
        toast.success(`Folder "${title}" created successfully`);
        resetForm();
        dialogProps.onOpenChange(false);
      } else {
        toast.error(response.message || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('An error occurred while creating the folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    dialogProps.onOpenChange(open);
  };

  if (!isOpen) return null;
  
  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={handleClose}
      title={getMessage('createFolder', undefined, 'Create Folder')}
      description={getMessage('createFolderDescription', undefined, 'Create a new folder to organize your templates')}
      className="jd-max-w-xl"
    >
      <form onSubmit={handleSubmit} className="jd-space-y-4 jd-mt-4">
          <div>
            <label className="jd-text-sm jd-font-medium">
              {getMessage('folderTitle', undefined, 'Folder Title')}
            </label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getMessage('enterFolderTitle', undefined, 'Enter folder title')}
              className="jd-mt-1"
              autoFocus
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') {
                  e.preventDefault();
                  return;
                }
              }}
              onKeyPress={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
            />
          </div>
          
          <div>
            <label className="jd-text-sm jd-font-medium">
              {getMessage('description', undefined, 'Description')}
            </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
              placeholder={getMessage('enterFolderDescription', undefined, 'Enter folder description (optional)')}
              className="jd-mt-1"
              rows={3}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') {
                  e.preventDefault();
                  return;
                }
                // Let Enter work for new lines in textarea
              }}
              onKeyPress={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
            />
          </div>

          <div>
            <label className="jd-text-sm jd-font-medium">
              Parent Folder
            </label>
            <FolderPicker
              folders={userFolders as TemplateFolder[]}
              onSelect={handleParentSelect}
            />
            <p className="jd-text-xs jd-text-muted-foreground jd-mt-1">Selected: {parentPath}</p>
          </div>
          
          <div className="jd-flex jd-justify-end jd-space-x-2 jd-pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              {getMessage('cancel', undefined, 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className={cn(
                'jd-transition-all jd-duration-300',
                'jd-bg-gradient-to-r jd-from-purple-500 jd-to-blue-500',
                'hover:jd-from-purple-600 hover:jd-to-blue-600 jd-text-white'
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-animate-spin jd-rounded-full jd-inline-block jd-mr-2"></div>
                  {getMessage('creating', undefined, 'Creating...')}
                </>
              ) : (
                <>
                  <Plus className="jd-h-4 jd-w-4 jd-mr-1" />
                  {getMessage('create', undefined, 'Create')}
                </>
              )}
            </Button>
          </div>
        </form>
    </BaseDialog>
  );
};