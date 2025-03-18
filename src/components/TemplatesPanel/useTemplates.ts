import { useState, useEffect } from 'react';
import { Template, TemplateFormData, TemplateCollection, TemplateFolder } from './types';
import { templateApi } from '@/api/TemplateApi';
import { toast } from 'sonner';

// Default form data
const DEFAULT_FORM_DATA: TemplateFormData = {
  name: '',
  content: '',
  description: '',
  folder: '',
  based_on_official_id: null
};

export interface TemplateCollection {
  userTemplates: {
    templates: Template[];
    folders: TemplateFolder[];
  };
  officialTemplates: {
    templates: Template[];
    folders: TemplateFolder[];
  };
  organizationTemplates?: {
    templates: Template[];
    folders: TemplateFolder[];
  };
  pinnedFolders: number[];
}

export function useTemplates() {
  // Template collection state
  const [templateCollection, setTemplateCollection] = useState<TemplateCollection>({
    userTemplates: { templates: [], folders: [] },
    officialTemplates: { templates: [], folders: [] }
  });
  
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);
  
  // Placeholder editor states
  const [placeholderEditorOpen, setPlaceholderEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);
  
  // Load templates from API
  const loadTemplates = async (forceRefresh = false): Promise<TemplateCollection> => {
    try {
      setLoading(true);
      
      const response = await templateApi.getAllTemplates();
      
      if (response && response.success) {
        // Process the templates and organize them
        const processedCollection = {
          userTemplates: {
            templates: response.userTemplates || [],
            folders: organizeFolders(response.userTemplates || [])
          },
          officialTemplates: {
            templates: response.officialTemplates || [],
            folders: response.officialFolders || []
          },
          pinnedFolders: response.pinnedFolders || []
        };
        
        // Add organization templates if they exist
        if (response.organizationTemplates && response.organizationTemplates.length > 0) {
          processedCollection.organizationTemplates = {
            templates: response.organizationTemplates || [],
            folders: response.organizationFolders || []
          };
        }
        
        setTemplateCollection(processedCollection);
        
        console.log(`🔢 Template counts - Official: ${processedCollection.officialTemplates.templates.length}, User: ${processedCollection.userTemplates.templates.length}, Organization: ${processedCollection.organizationTemplates?.templates.length || 0}`);
      } else {
        console.error('Failed to load templates:', response.error);
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
    
    return this.getTemplateCollection();
  }
  
  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    const newExpandedFolders = new Set(expandedFolders);
    
    if (newExpandedFolders.has(path)) {
      newExpandedFolders.delete(path);
    } else {
      newExpandedFolders.add(path);
    }
    
    setExpandedFolders(newExpandedFolders);
  };
  
  // Handle using a template
  const handleUseTemplate = async (template: Template, onClose?: () => void) => {
    try {
      // Set selected template for placeholder editor
      setSelectedTemplate(template);
      setPlaceholderEditorOpen(true);
      
      
      return true;
    } catch (error) {
      console.error('Error using template:', error);
      toast.error('Failed to use template');
      return false;
    }
  };
  
  // Finalize template usage after placeholder editing
  const handleFinalizeTemplate = (finalContent: string, onClose?: () => void) => {
    try {
      // Insert content into editor
      const success = insertTemplateContent(finalContent);
      
      if (success) {
        toast.success('Template applied successfully');
        if (onClose) onClose();
      } else {
        toast.error('Failed to insert template content');
      }
      
      // Clear selected template
      setSelectedTemplate(null);
      setPlaceholderEditorOpen(false);
    } catch (error) {
      console.error('Error finalizing template:', error);
      toast.error('Failed to apply template');
    }
  };
  
  // Insert template content into editor
  const insertTemplateContent = (content: string): boolean => {
    try {
      // Find ChatGPT textarea
      const textarea = document.querySelector('#prompt-textarea') as HTMLElement;
      if (!textarea) {
        console.error('ChatGPT textarea not found');
        return false;
      }
      console.log('🔑🔑🔑 inserting template content', content);
      
      // Try multiple approaches
      if (textarea.tagName === 'TEXTAREA') {
        // It's actually a textarea
        (textarea as HTMLTextAreaElement).value = content;
      } else if (textarea.isContentEditable) {
        // It's a contentEditable div
        textarea.textContent = content;
      } else {
        // Try to find the hidden input
        const input = textarea.querySelector('input, textarea');
        if (input) {
          (input as HTMLInputElement).value = content;
        } else {
          // Last resort
          textarea.textContent = content;
        }
      }
      
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.focus();
      
      return true;
    } catch (error) {
      console.error('Error inserting template content:', error);
      return false;
    }
  };
  
  // Open edit dialog
  const openEditDialog = (template: Template | null) => {
    setCurrentTemplate(template);
    
    // Initialize form data from template or defaults
    if (template) {
      setTemplateFormData({
        name: template.name || '',
        content: template.content || '',
        description: template.description || '',
        folder: template.folder || '',
        based_on_official_id: typeof template.based_on_official_id === 'number' ? 
          template.based_on_official_id : null
      });
    } else {
      setTemplateFormData(DEFAULT_FORM_DATA);
    }
    
    setEditDialogOpen(true);
  };
  
  // Save template (create or update)
  const handleSaveTemplate = async () => {
    try {
      if (!templateFormData.name || !templateFormData.content) {
        toast.error('Name and content are required');
        return;
      }
      
      let response;
      
      if (currentTemplate) {
        // Update existing template
        response = await templateApi.updateTemplate(currentTemplate.id, templateFormData);
        if (response.success) {
          toast.success('Template updated successfully');
        } else {
          throw new Error(response.error || 'Failed to update template');
        }
      } else {
        // Create new template
        response = await templateApi.createTemplate(templateFormData);
        if (response.success) {
          toast.success('Template created successfully');
        } else {
          throw new Error(response.error || 'Failed to create template');
        }
      }
      
      // Reload templates and close dialog
      await loadTemplates(true);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    }
  };
  
  // Delete template
  const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${template.title || template.name}"?`)) {
      try {
        const response = await templateApi.deleteTemplate(template.id);
        
        if (response.success) {
          toast.success('Template deleted successfully');
          await loadTemplates(true);
        } else {
          throw new Error(response.error || 'Failed to delete template');
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete template');
      }
    }
  };
  
  // Capture current prompt as template
  const captureCurrentPromptAsTemplate = () => {
    try {
      // Find ChatGPT textarea
      const textarea = document.querySelector('textarea[data-id="root"]') as HTMLTextAreaElement;
      if (!textarea || !textarea.value.trim()) {
        toast.error('No content to capture');
        return;
      }
      
      // Extract title from first line
      const content = textarea.value;
      const firstLine = content.split('\n')[0].trim();
      const title = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
      
      // Initialize form with captured content
      setTemplateFormData({
        name: title,
        content: content,
        description: '',
        folder: '',
        based_on_official_id: null
      });
      
      setCurrentTemplate(null);
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Error capturing prompt:', error);
      toast.error('Failed to capture current prompt');
    }
  };
  
  // Organize templates into folder structure
  const organizeFolders = (templates: Template[]): TemplateFolder[] => {
    const folderMap: Record<string, TemplateFolder> = {};
    
    // Create root folder
    folderMap[''] = {
      path: '',
      name: 'Root',
      templates: [],
      subfolders: []
    };
    
    // First, collect all templates with no folder to the root
    templates.forEach(template => {
      if (!template.folder) {
        folderMap[''].templates.push(template);
      }
    });
    
    // Then process the templates with folders
    templates.forEach(template => {
      const folderPath = template.folder || '';
      
      if (!folderPath) {
        // Skip root templates as they're already added
        return;
      }
      
      const folderParts = folderPath.split('/');
      
      // Ensure all parent folders exist
      let currentPath = '';
      folderParts.forEach((part, index) => {
        currentPath += (index > 0 ? '/' : '') + part;
        
        if (!folderMap[currentPath]) {
          folderMap[currentPath] = {
            path: currentPath,
            name: part,
            templates: [],
            subfolders: []
          };
          
          // Add to parent folder's subfolders
          if (index > 0) {
            const parentPath = folderParts.slice(0, index).join('/');
            if (folderMap[parentPath]) {
              folderMap[parentPath].subfolders.push(folderMap[currentPath]);
            }
          } else {
            // Root-level folders go into root's subfolders
            folderMap[''].subfolders.push(folderMap[currentPath]);
          }
        }
      });
      
      // Add template to its folder
      folderMap[folderPath].templates.push(template);
    });
    
    // Return root's subfolders
    return folderMap[''].subfolders;
  };

  // Pin a folder
const handlePinFolder = async (folderId: number) => {
  try {
    const response = await templateApi.pinFolder(folderId);
    
    if (response.success) {
      toast.success('Folder pinned successfully');
      
      // Update pinned folders in the state
      setTemplateCollection(prev => ({
        ...prev,
        pinnedFolders: response.pinned_folders
      }));
      
      return true;
    } else {
      toast.error('Failed to pin folder');
      return false;
    }
  } catch (error) {
    console.error('Error pinning folder:', error);
    toast.error('Failed to pin folder');
    return false;
  }
};

// Unpin a folder
const handleUnpinFolder = async (folderId: number) => {
  try {
    const response = await templateApi.unpinFolder(folderId);
    
    if (response.success) {
      toast.success('Folder unpinned');
      
      // Update pinned folders in the state
      setTemplateCollection(prev => ({
        ...prev,
        pinnedFolders: response.pinned_folders
      }));
      
      return true;
    } else {
      toast.error('Failed to unpin folder');
      return false;
    }
  } catch (error) {
    console.error('Error unpinning folder:', error);
    toast.error('Failed to unpin folder');
    return false;
  }
};

  
  return {
    templateCollection,
    loading,
    expandedFolders,
    editDialogOpen,
    setEditDialogOpen,
    currentTemplate,
    templateFormData,
    setTemplateFormData,
    placeholderEditorOpen,
    setPlaceholderEditorOpen,
    selectedTemplate,
    toggleFolder,
    handleUseTemplate,
    handleFinalizeTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    captureCurrentPromptAsTemplate,
    handlePinFolder,
    handleUnpinFolder
  };
}