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
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Folder name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use path if provided, otherwise use name
      const finalPath = path.trim() || name.trim();
      
      const success = await onSaveFolder({
        name: name.trim(),
        path: finalPath,
        description: description.trim()
      });
      
      if (success) {
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPath('');
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
            <label className="text-sm font-medium">Folder Path (Optional)</label>
            <Input 
              value={path} 
              onChange={(e) => setPath(e.target.value)}
              placeholder="work/projects"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use / to create nested paths (e.g. work/projects). Leave empty to use the folder name.
            </p>
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