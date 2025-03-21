import { useState, useEffect, useCallback } from 'react';
import { Template, TemplateFormData, TemplateFolder } from './types';
import { toast } from 'sonner';
import { promptApi } from '@/api/PromptApi';

// Default form data
const DEFAULT_FORM_DATA: TemplateFormData = {
  name: '',
  content: '',
  description: '',
  folder: '',
  based_on_official_id: null
};

export function useTemplates() {
  // Essential states
  const [templates, setTemplates] = useState<{
    user: Template[];
    official: Template[];
    organization: Template[];
  }>({
    user: [],
    official: [],
    organization: []
  });
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Folder states
  const [pinnedOfficialFolders, setPinnedOfficialFolders] = useState<TemplateFolder[]>([]);
  const [pinnedOrganizationFolders, setPinnedOrganizationFolders] = useState<TemplateFolder[]>([]);
  const [userFolders, setUserFolders] = useState<TemplateFolder[]>([]);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);
  const [placeholderEditorOpen, setPlaceholderEditorOpen] = useState(false);

  // Load folders on component mount
  useEffect(() => {
    loadFolders();
  }, []);

  // Function to load all folders and templates
  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user's metadata to get pinned folder IDs
      const userMetadataResponse = await promptApi.getUserMetadata();
      
      if (!userMetadataResponse.success) {
        throw new Error('Failed to load user metadata');
      }
      
      const metadata = userMetadataResponse.data;
      
      // Get pinned official folders
      const officialFolderIds = metadata?.pinned_official_folder_ids || [];
      console.log("officialFolderIds--->", officialFolderIds)
      let officialFolders: TemplateFolder[] = [];
      
      if (officialFolderIds.length > 0) {
        const officialResponse = await promptApi.getPromptTemplatesFolders('official', officialFolderIds);
        if (officialResponse.success) {
          officialFolders = officialResponse.folders || [];
        }
      }
      console.log("officialFolders--->", officialFolders)
      
      // Get pinned organization folders
      const orgFolderIds = metadata?.pinned_organization_folder_ids || [];
      let orgFolders: TemplateFolder[] = [];
      
      if (orgFolderIds.length > 0) {
        const orgResponse = await promptApi.getPromptTemplatesFolders('organization', orgFolderIds);
        if (orgResponse.success) {
          orgFolders = orgResponse.folders || [];
        }
      }
      
      // Get user folders
      const userResponse = await promptApi.getPromptTemplatesFolders('user');
      const userFolders = userResponse.success ? userResponse.folders || [] : [];
      
      // Update state
      setPinnedOfficialFolders(officialFolders);
      setPinnedOrganizationFolders(orgFolders);
      setUserFolders(userFolders);
      
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to refresh folders after changes
  const refreshFolders = useCallback(() => {
    loadFolders();
  }, [loadFolders]);
  
  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  // Handle template usage
  const handleUseTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    setPlaceholderEditorOpen(true);
    
    // Track template usage
    try {
      if (template.id) {
        await promptApi.trackTemplateUsage(template.id);
      }
    } catch (error) {
      // Silent fail for usage tracking - doesn't affect user experience
      console.error('Failed to track template usage:', error);
    }
  };
  
  // Apply template content
  const handleFinalizeTemplate = (finalContent: string, onClose?: () => void) => {
    const textarea = document.querySelector('#prompt-textarea');
    if (!textarea) {
      toast.error('Could not find input area');
      return;
    }

    try {
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.value = finalContent;
      } else {
        textarea.textContent = finalContent;
      }
      
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.focus();
      
      toast.success('Template applied');
      setPlaceholderEditorOpen(false);
      setSelectedTemplate(null);
      if (onClose) onClose();
    } catch (error) {
      toast.error('Failed to apply template');
    }
  };
  
  // Template CRUD operations
  const openEditDialog = (template: Template | null) => {
    setSelectedTemplate(template);
    setTemplateFormData(template ? {
      name: template.title || '',
      content: template.content || '',
      description: template.description || '',
      folder: template.folder || '',
      based_on_official_id: template.based_on_official_id ?? null
    } : DEFAULT_FORM_DATA);
    setEditDialogOpen(true);
  };
  
  const handleSaveTemplate = async () => {
    try {
      if (!templateFormData.name || !templateFormData.content) {
        toast.error('Name and content are required');
        return;
      }
      
      setLoading(true);
      
      // Prepare template data
      const templateData = {
        name: templateFormData.name,
        content: templateFormData.content,
        description: templateFormData.description || '',
        folder: templateFormData.folder || '',
        based_on_official_id: templateFormData.based_on_official_id
      };
      
      let response;
      
      if (selectedTemplate?.id) {
        // Update existing template
        response = await promptApi.updateTemplate(selectedTemplate.id, templateData);
      } else {
        // Create new template
        response = await promptApi.createTemplate(templateData);
      }
      
      if (response.success) {
        toast.success(selectedTemplate ? 'Template updated' : 'Template created');
        setEditDialogOpen(false);
        
        // Refresh folders to show the new or updated template
        refreshFolders();
      } else {
        toast.error(`Failed to ${selectedTemplate ? 'update' : 'create'} template: ${response.error}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${template.title}"?`)) return;
    
    try {
      setLoading(true);
      
      if (!template.id) {
        toast.error('Template ID is missing');
        return;
      }
      
      const response = await promptApi.deleteTemplate(template.id);
      
      if (response.success) {
        toast.success('Template deleted');
        
        // Refresh folders to update the UI
        refreshFolders();
      } else {
        toast.error(`Failed to delete template: ${response.error}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  // Folder CRUD operations
  const createFolder = async (folderData: { name: string, path: string, description?: string }) => {
    try {
      setLoading(true);
      
      const response = await promptApi.createFolder(folderData);
      
      if (response.success) {
        toast.success('Folder created');
        
        // Refresh folders to update the UI
        refreshFolders();
        return true;
      } else {
        toast.error(`Failed to create folder: ${response.error}`);
        return false;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create folder');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteFolder = async (folderId: number) => {
    if (!window.confirm('Delete this folder and all templates inside?')) return false;
    
    try {
      setLoading(true);
      
      const response = await promptApi.deleteFolder(folderId);
      
      if (response.success) {
        toast.success('Folder deleted');
        
        // Refresh folders to update the UI
        refreshFolders();
        return true;
      } else {
        toast.error(`Failed to delete folder: ${response.error}`);
        return false;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete folder');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    templates,
    expandedFolders,
    loading,
    editDialogOpen,
    setEditDialogOpen,
    selectedTemplate,
    templateFormData,
    setTemplateFormData,
    placeholderEditorOpen,
    setPlaceholderEditorOpen,
    pinnedOfficialFolders,
    pinnedOrganizationFolders,
    userFolders,
    toggleFolder,
    handleUseTemplate,
    handleFinalizeTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    refreshFolders,
    createFolder,
    deleteFolder
  };
}