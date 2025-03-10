// src/components/TemplatesPanel/useTemplates.ts
import { useState, useEffect } from 'react';
import { Template, TemplateCollection } from './types';
// Import the correct templateService from services directory
import { templateService } from '@/services/TemplateService';

// Default empty template collection structure
const DEFAULT_TEMPLATE_COLLECTION: TemplateCollection = {
  userTemplates: { 
    templates: [], 
    folders: [] 
  },
  officialTemplates: { 
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
    // Load templates
    const loadTemplates = async () => {
      console.log('Loading templates...');
      try {
        setLoading(true);
        
        // Directly get the templates from the service
        const collection = await templateService.loadTemplates(true); // Force refresh

        console.log('Templates loaded successfully:', collection);
        
        // Explicitly set the template collection
        setTemplateCollection(collection);
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplateCollection(DEFAULT_TEMPLATE_COLLECTION);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
    
    // Set up a listener for template updates
    const unsubscribe = templateService.onTemplatesUpdate((updatedCollection) => {
      console.log('Template update received:', updatedCollection);
      setTemplateCollection(updatedCollection);
    });
    
    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
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
      // Track template usage
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
        name: template.title || template.name || '',
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
        name: templateFormData.name,
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
      
      // Reload templates to reflect changes
      const updatedCollection = await templateService.loadTemplates(true);
      setTemplateCollection(updatedCollection);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${template.title || template.name}"?`)) {
      try {
        await templateService.deleteTemplate(template.id);
        
        // Reload templates to reflect changes
        const updatedCollection = await templateService.loadTemplates(true);
        setTemplateCollection(updatedCollection);
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

  // Log the current template collection structure
  console.log("Template Collection:", JSON.stringify(templateCollection, null, 2));
  
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