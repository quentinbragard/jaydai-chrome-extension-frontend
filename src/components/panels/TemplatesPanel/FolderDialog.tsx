import React, { useState } from 'react';
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
import { useTemplates } from '@/hooks/templates';

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveFolder: (folderData: { name: string; path: string; description: string }) => Promise<boolean>;
}

const FolderDialog: React.FC<FolderDialogProps> = ({
  open,
  onOpenChange,
  onSaveFolder
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the createFolder function from useTemplates
  const { createFolder } = useTemplates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!name.trim()) {
      alert('Folder name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the folder using the path based on name
      const success = await createFolder({
        name: name.trim(),
        path: name.trim(), // Use name as path for simplicity
        description: description.trim()
      });
      
      if (success) {
        // Call the parent callback with the created folder data
        await onSaveFolder({
          name: name.trim(),
          path: name.trim(),
          description: description.trim()
        });
        
        // Close this dialog ONLY after success and reset form
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a folder to organize your templates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Folder Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="My Templates"
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
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FolderDialog;