// src/components/dialogs/templates/CreateFolderDialog.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDialog } from '../../DialogContext';
import { DIALOG_TYPES } from '../../DialogRegistry';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { BaseDialog } from '../../BaseDialog';
import { getMessage } from '@/core/utils/i18n';

/**
 * Dialog for creating new template folders
 * This version uses direct API calls to avoid React Query errors
 */
export const CreateFolderDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.CREATE_FOLDER);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setIsSubmitting(false);
    }
  }, [isOpen]);
  
  // Safe extraction of dialog data with defaults
  const onSaveFolder = data?.onSaveFolder || (() => Promise.resolve(false));
  const onFolderCreated = data?.onFolderCreated; // New callback for when folder is created
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare folder data
      const folderData = {
        name: name.trim(),
        path: name.trim().toLowerCase().replace(/\s+/g, '-'), // Generate path from name
        description: description.trim()
      };
      
      // Call the provided callback with folder data if it exists
      // This allows for custom handling by parent components
      if (onSaveFolder) {
        const customResult = await onSaveFolder(folderData);
        if (customResult && customResult.success && customResult.folder) {
          // Use the folder from the custom result
          if (onFolderCreated) {
            onFolderCreated(customResult.folder);
          }
          
          toast.success(`Folder "${name}" created successfully`);
          resetForm();
          dialogProps.onOpenChange(false);
          return;
        } else if (customResult && !customResult.success) {
          // Handle custom error case
          toast.error(customResult.error || 'Failed to create folder');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Default handling - use direct API call
      const response = await promptApi.createFolder(folderData);

      if (response.success && response.data) {
        // Call the onFolderCreated callback if provided with the created folder
        if (onFolderCreated) {
          onFolderCreated(response.data);
        }
        
        toast.success(`Folder "${name}" created successfully`);
        
        // Reset form and close dialog
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
    setName('');
    setDescription('');
  };
  
  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          resetForm();
        }
        dialogProps.onOpenChange(open);
      }}
      title={getMessage('createFolder', undefined, 'Create Folder')}
      description={getMessage('createFolderDescription', undefined, 'Create a new folder to organize your templates')}
      className="jd-max-w-xl"
    >
      <form onSubmit={handleSubmit} className="jd-flex jd-flex-col jd-space-y-4 jd-mt-4">
        <div>
          <label className="jd-text-sm jd-font-medium">{getMessage('folderName', undefined, 'Folder Name')}</label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // Prevent form submission and propagation when Enter is pressed
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            placeholder={getMessage('enterFolderName', undefined, 'Enter folder name')}
            className="jd-mt-1"
            autoFocus
          />
        </div>
        
        <div>
          <label className="jd-text-sm jd-font-medium">{getMessage('description', undefined, 'Description')}</label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              // Prevent event propagation to prevent leaking
              e.stopPropagation();
              
              // Allow Enter key to create a new line
              if (e.key === 'Enter') {
                // Prevent default behavior (which might submit the form)
                e.preventDefault();
                
                // Get the current cursor position
                const textarea = e.target as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                // Insert a newline at the cursor position
                const newContent = 
                  description.substring(0, start) + 
                  '\n' + 
                  description.substring(end);
                
                // Update the description state
                setDescription(newContent);
                
                // Set the cursor position after the newline
                setTimeout(() => {
                  textarea.selectionStart = textarea.selectionEnd = start + 1;
                }, 0);
              }
            }}
            placeholder={getMessage('enterFolderDescription', undefined, 'Enter folder description (optional)')}
            className="jd-mt-1"
            rows={3}
          />
        </div>
        
        <div className="jd-flex jd-justify-end jd-space-x-2 jd-mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => dialogProps.onOpenChange(false)}
            disabled={isSubmitting}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !name.trim()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {isSubmitting ? (
              <>
                <div className="jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-animate-spin jd-rounded-full jd-inline-block jd-mr-2"></div>
                {getMessage('creating', undefined, 'Creating...')}
              </>
            ) : (
              getMessage('create', undefined, 'Create')
            )}
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
};