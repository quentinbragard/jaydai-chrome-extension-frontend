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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Template, TemplateFormData, TemplateFolder, DEFAULT_FORM_DATA } from './types';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplate: Template | null;
  formData: TemplateFormData;
  onFormChange: (formData: TemplateFormData) => void;
  onSaveTemplate: () => void;
  userFolders?: TemplateFolder[];
}

const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  onOpenChange,
  currentTemplate,
  formData,
  onFormChange,
  onSaveTemplate,
  userFolders = []
}) => {
  // Ensure we always have valid form data
  const safeFormData = formData || DEFAULT_FORM_DATA;
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [useFolderPath, setUseFolderPath] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Flatten folder hierarchy for select dropdown
  const [flattenedFolders, setFlattenedFolders] = useState<{id: number, name: string, path: string}[]>([]);
  
  useEffect(() => {
    // If template has a folder_id, set it as selected
    if (currentTemplate?.folder_id) {
      setSelectedFolderId(currentTemplate.folder_id.toString());
      setUseFolderPath(false);
    } else if (currentTemplate?.folder || currentTemplate?.path) {
      setUseFolderPath(true);
    }
    
    // Flatten folder hierarchy for the dropdown
    const flattened: {id: number, name: string, path: string}[] = [];
    
    const processFolders = (folders: TemplateFolder[], parentPath = '') => {
      folders.forEach(folder => {
        if (!folder || !folder.id || !folder.name) return;
        
        const fullPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
        flattened.push({
          id: folder.id,
          name: folder.name,
          path: fullPath
        });
        
        if (folder.Folders && folder.Folders.length > 0) {
          processFolders(folder.Folders, fullPath);
        }
      });
    };
    
    processFolders(userFolders);
    setFlattenedFolders(flattened);
  }, [currentTemplate, userFolders]);
  
  // Safe handler for form changes that won't fail if formData is undefined
  const handleFormChange = (field: keyof TemplateFormData, value: any) => {
    onFormChange({
      ...safeFormData,
      [field]: value
    });
  };
  
  // Handle folder selection from dropdown
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setUseFolderPath(false);
    
    // Find the selected folder's path
    const selectedFolder = flattenedFolders.find(f => f.id.toString() === folderId);
    if (selectedFolder) {
      // Update both folder path and folder_id
      handleFormChange('folder', selectedFolder.path);
      handleFormChange('folder_id', selectedFolder.id);
    }
  };
  
  // Toggle between folder selection and manual path entry
  const toggleFolderInputMode = () => {
    setUseFolderPath(!useFolderPath);
    if (!useFolderPath) {
      setSelectedFolderId('');
      // Clear folder_id when switching to manual path
      handleFormChange('folder_id', undefined);
    }
  };

  // Handle save with loading state
  const handleSave = async () => {
    if (!safeFormData.name.trim()) {
      alert('Template name is required');
      return;
    }

    if (!safeFormData.content.trim()) {
      alert('Template content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveTemplate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentTemplate ? chrome.i18n.getMessage('editTemplate') : chrome.i18n.getMessage('createTemplateTitle')}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {currentTemplate ? chrome.i18n.getMessage('editTemplateDesc') : chrome.i18n.getMessage('createTemplateDesc')}
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">{chrome.i18n.getMessage('templateFolder')}</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={toggleFolderInputMode}
              >
                {useFolderPath ? "Select folder" : "Enter path manually"}
              </Button>
            </div>
            
            {useFolderPath ? (
              <>
                <Input 
                  value={safeFormData.folder} 
                  onChange={(e) => handleFormChange('folder', e.target.value)}
                  placeholder="e.g. work/coding"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use / to create folders (e.g. marketing/emails)
                </p>
              </>
            ) : (
              <Select value={selectedFolderId} onValueChange={handleFolderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {flattenedFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium">{chrome.i18n.getMessage('templateContent')}</label>
            <textarea 
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              rows={6}
              value={safeFormData.content} 
              onChange={(e) => handleFormChange('content', e.target.value)}
              placeholder={chrome.i18n.getMessage('templateContent')}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {chrome.i18n.getMessage('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full inline-block mr-2"></div>
                {currentTemplate ? chrome.i18n.getMessage('updating') : chrome.i18n.getMessage('creating')}
              </>
            ) : (
              currentTemplate ? chrome.i18n.getMessage('update') : chrome.i18n.getMessage('create')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;