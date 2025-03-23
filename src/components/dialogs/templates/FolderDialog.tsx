// src/components/dialogs/templates/FolderDialog.tsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDialog } from '@/components/dialogs/core/DialogContext';
import { DIALOG_TYPES } from '@/core/dialogs/registry';
import { toast } from 'sonner';

/**
 * Dialog for creating new template folders
 */
export const FolderDialog: React.FC = () => {
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
      
      // Call the provided callback with folder data
      const result = await onSaveFolder(folderData);
      
      if (result && result.success) {
        // Call the onFolderCreated callback if provided with the created folder
        if (onFolderCreated && result.folder) {
          onFolderCreated(result.folder);
        }
        
        toast.success(`Folder "${name}" created successfully`);
        
        // Reset form and close dialog
        resetForm();
        dialogProps.onOpenChange(false);
      } else {
        toast.error(result?.error || 'Failed to create folder');
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
  
  if (!isOpen) return null;

  return (
    <Dialog {...dialogProps}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a folder to organize your templates.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Folder Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="My Templates"
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Templates for work projects"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => dialogProps.onOpenChange(false)} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};