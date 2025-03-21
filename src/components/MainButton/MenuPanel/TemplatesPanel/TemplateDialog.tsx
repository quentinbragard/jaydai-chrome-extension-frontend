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

// Default form data to use as fallback
const DEFAULT_FORM_DATA: TemplateFormData = {
  name: '',
  content: '',
  description: '',
  folder: ''
};

const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  onOpenChange,
  currentTemplate,
  formData,
  onFormChange,
  onSaveTemplate
}) => {
  // Ensure we always have valid form data
  const safeFormData = formData || DEFAULT_FORM_DATA;
  
  // Safe handler for form changes that won't fail if formData is undefined
  const handleFormChange = (field: keyof TemplateFormData, value: string) => {
    onFormChange({
      ...safeFormData,
      [field]: value
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentTemplate ? chrome.i18n.getMessage('editTemplate') : chrome.i18n.getMessage('createTemplateTitle')}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {chrome.i18n.getMessage('createTemplateTitle')}
        </DialogDescription>
        
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">{chrome.i18n.getMessage('templateName')}</label>
            <Input 
              value={safeFormData.name} 
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder={chrome.i18n.getMessage('templateName')}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">{chrome.i18n.getMessage('templateDescription')}</label>
            <Input 
              value={safeFormData.description} 
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder={chrome.i18n.getMessage('templateDescription')}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">{chrome.i18n.getMessage('templateFolder')}</label>
            <Input 
              value={safeFormData.folder} 
              onChange={(e) => handleFormChange('folder', e.target.value)}
              placeholder="e.g. work/coding"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use / to create Folders (e.g. marketing/emails)
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">{chrome.i18n.getMessage('templateContent')}</label>
            <textarea 
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={6}
              value={safeFormData.content} 
              onChange={(e) => handleFormChange('content', e.target.value)}
              placeholder={chrome.i18n.getMessage('templateContent')}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {chrome.i18n.getMessage('cancel')}
          </Button>
          <Button onClick={onSaveTemplate}>
            {currentTemplate ? chrome.i18n.getMessage('update') : chrome.i18n.getMessage('create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;