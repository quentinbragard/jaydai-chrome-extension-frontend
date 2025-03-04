import { useState, useEffect } from 'react';
import { Template, TemplateCollection, TemplateFormData } from './types';
import templateService from './templateService';

export function useTemplates() {
  const [templateCollection, setTemplateCollection] = useState<TemplateCollection>({
    templates: [],
    folders: [],
    rootTemplates: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([''])); // Root folder starts expanded
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>({
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
      .then((data) => {
        setTemplateCollection(data);
        setLoading(false);
      })
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

  const handleUseTemplate = async (template: Template, onClose?: () => void) => {
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