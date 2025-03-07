import { useState, useEffect } from 'react';
import { Template, TemplateCollection } from './types';
import { templateService } from '@/services/TemplateService';

// Default empty template collection structure
const DEFAULT_TEMPLATE_COLLECTION: TemplateCollection = {
  officialTemplates: { 
    templates: [], 
    folders: [] 
  },
  userTemplates: { 
    templates: [], 
    folders: [] 
  }
};

export function useTemplates() {
  const [templateCollection, setTemplateCollection] = useState<TemplateCollection>(DEFAULT_TEMPLATE_COLLECTION);
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
    const cleanup = templateService.onTemplatesUpdate((collection) => {
      // Ensure a default structure even if collection is incomplete
      setTemplateCollection({
        officialTemplates: collection.officialTemplates || { templates: [], folders: [] },
        userTemplates: collection.userTemplates || { templates: [], folders: [] }
      });
      setLoading(false);
    });
    
    // Load templates
    templateService.loadTemplates()
      .then(() => setLoading(false))
      .catch(() => {
        // Ensure we exit loading state even if load fails
        setTemplateCollection(DEFAULT_TEMPLATE_COLLECTION);
        setLoading(false);
      });
    
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

  const handleUseTemplate = async (template: Template, onClose?: () => void) => {
    try {
      await templateService.useTemplate(template.id);
      
      // Insert template content into ChatGPT input
      const inputArea = document.querySelector('textarea[data-id="root"]') as HTMLTextAreaElement;
      if (inputArea) {
        inputArea.value = template.content;
        inputArea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const openEditDialog = (template: Template | null) => {
    if (template) {
      setCurrentTemplate(template);
      setTemplateFormData({
        name: template.title || '',
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
      const templateData = {
        title: templateFormData.name,
        content: templateFormData.content,
        description: templateFormData.description,
        folder: templateFormData.folder
      };

      if (currentTemplate) {
        // Update existing template
        await templateService.updateTemplate(currentTemplate.id, templateData);
      } else {
        // Create new template
        await templateService.createTemplate(templateData);
      }
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${template.title}"?`)) {
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

  return {
    templateCollection,
    loading,
    expandedFolders,
    editDialogOpen,
    setEditDialogOpen,
    currentTemplate,
    templateFormData,
    setTemplateFormData,
    toggleFolder,
    handleUseTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    captureCurrentPromptAsTemplate
  };
}