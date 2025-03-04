// src/components/TemplatesPanel/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit,
  Trash,
  X
} from "lucide-react";
import { 
  templateService, 
  Template, 
  TemplateFolder,
  TemplateCollection
} from '@/services/TemplateService';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface TemplatesPanelProps {
  onClose?: () => void;
  maxHeight?: string;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ 
  onClose, 
  maxHeight = '400px' 
}) => {
  const [templateCollection, setTemplateCollection] = useState<TemplateCollection>({
    templates: [],
    folders: [],
    rootTemplates: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([''])); // Root folder starts expanded
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    content: '',
    description: '',
    folder: ''
  });

  useEffect(() => {
    // Register for template updates
    const cleanup = templateService.onTemplatesUpdate((templates) => {
      setTemplateCollection(templates);
      setLoading(false);
    });
    
    // Load templates
    templateService.loadTemplates()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
    
    return cleanup;
  }, []);
  
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };
  
  const useTemplate = async (template: Template) => {
    try {
      await templateService.useTemplate(template.id);
      templateService.insertTemplateContent(template.content);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error using template:', error);
    }
  };
  
  const openEditDialog = (template: Template | null) => {
    if (template) {
      setCurrentTemplate(template);
      setTemplateFormData({
        name: template.name,
        content: template.content,
        description: template.description || '',
        folder: template.folder || ''
      });
    } else {
      setCurrentTemplate(null);
      setTemplateFormData({
        name: '',
        content: '',
        description: '',
        folder: ''
      });
    }
    setEditDialogOpen(true);
  };
  
  const handleSaveTemplate = async () => {
    try {
      if (currentTemplate) {
        // Update existing template
        await templateService.updateTemplate(currentTemplate.id, templateFormData);
      } else {
        // Create new template
        await templateService.createTemplate(templateFormData);
      }
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };
  
  const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await templateService.deleteTemplate(template.id);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };
  
  const captureCurrentPromptAsTemplate = () => {
    // Find the ChatGPT input area
    const inputArea = document.querySelector('textarea[data-id="root"]') as HTMLTextAreaElement;
    if (!inputArea || !inputArea.value.trim()) {
      alert('Please type something in the ChatGPT input area first.');
      return;
    }
    
    openEditDialog(null);
    setTemplateFormData(prev => ({
      ...prev,
      content: inputArea.value.trim()
    }));
  };
  
  const renderFolderTree = (folder: TemplateFolder, path: string = '') => {
    const isExpanded = expandedFolders.has(path);
    const currentPath = path ? `${path}/${folder.name}` : folder.name;
    
    return (
      <div key={currentPath} className="folder-container">
        <div 
          className="folder-header flex items-center p-2 hover:bg-accent cursor-pointer"
          onClick={() => toggleFolder(currentPath)}
        >
          {isExpanded ? 
            <ChevronDown className="h-4 w-4 mr-1" /> : 
            <ChevronRight className="h-4 w-4 mr-1" />}
          <FolderOpen className="h-4 w-4 mr-2 text-amber-500" />
          <span className="text-sm">{folder.name}</span>
          <span className="ml-auto text-xs text-muted-foreground">{folder.templates.length}</span>
        </div>
        
        {isExpanded && (
          <div className="folder-content pl-5">
            {folder.templates.map(template => renderTemplateItem(template))}
            {folder.subfolders.map(subfolder => renderFolderTree(subfolder, currentPath))}
          </div>
        )}
      </div>
    );
  };
  
  const renderTemplateItem = (template: Template) => {
    return (
      <div 
        key={template.id} 
        className="template-item flex items-center p-2 hover:bg-accent rounded-sm cursor-pointer group"
        onClick={() => useTemplate(template)}
      >
        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">{template.name}</div>
          {template.description && (
            <div className="text-xs text-muted-foreground truncate">{template.description}</div>
          )}
        </div>
        <div className="ml-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(template);
            }}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-destructive"
            onClick={(e) => handleDeleteTemplate(template, e)}
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="w-80 shadow-lg">
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={captureCurrentPromptAsTemplate}
              className="h-7 px-2 text-xs"
              title="Create from current prompt"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
            {onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-0">
          <div 
            className="overflow-y-auto py-1" 
            style={{ maxHeight }}
          >
            {loading ? (
              <div className="py-8 text-center">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading templates...</p>
              </div>
            ) : templateCollection.templates.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No templates found</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openEditDialog(null)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create your first template
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Root templates */}
                <div className="p-2">
                  {templateCollection.rootTemplates.map(template => renderTemplateItem(template))}
                </div>
                
                {/* Folders */}
                {templateCollection.folders.length > 0 && (
                  <div className="p-2">
                    {templateCollection.folders.map(folder => renderFolderTree(folder))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input 
                value={templateFormData.name} 
                onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})}
                placeholder="Template name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input 
                value={templateFormData.description} 
                onChange={(e) => setTemplateFormData({...templateFormData, description: e.target.value})}
                placeholder="Brief description"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Folder (optional)</label>
              <Input 
                value={templateFormData.folder} 
                onChange={(e) => setTemplateFormData({...templateFormData, folder: e.target.value})}
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
                value={templateFormData.content} 
                onChange={(e) => setTemplateFormData({...templateFormData, content: e.target.value})}
                placeholder="Template content"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {currentTemplate ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplatesPanel;