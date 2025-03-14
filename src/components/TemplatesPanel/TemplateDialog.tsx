import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Template, TemplateFormData } from './types';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplate: Template | null;
  formData: TemplateFormData;
  onFormChange: (formData: TemplateFormData) => void;
  onSaveTemplate: () => void;
}

const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  onOpenChange,
  currentTemplate,
  formData,
  onFormChange,
  onSaveTemplate
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogDescription>
          Create and manage your templates
        </DialogDescription>
        <DialogHeader>
          <DialogTitle>{currentTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input 
              value={formData.name} 
              onChange={(e) => onFormChange({...formData, name: e.target.value})}
              placeholder="Template name"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Input 
              value={formData.description} 
              onChange={(e) => onFormChange({...formData, description: e.target.value})}
              placeholder="Brief description"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Folder (optional)</label>
            <Input 
              value={formData.folder} 
              onChange={(e) => onFormChange({...formData, folder: e.target.value})}
              placeholder="e.g. work/coding"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use / to create subfolders (e.g. marketing/emails)
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Content</label>
            <textarea 
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={6}
              value={formData.content} 
              onChange={(e) => onFormChange({...formData, content: e.target.value})}
              placeholder="Template content"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSaveTemplate}>
            {currentTemplate ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog; 