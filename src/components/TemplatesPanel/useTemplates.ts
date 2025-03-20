import { useState, useEffect } from 'react';
import { Template, TemplateFormData } from './types';
import { toast } from 'sonner';

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
  const [templates, setTemplates] = useState({
    user: [],
    official: [],
    organization: []
  });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);
  const [placeholderEditorOpen, setPlaceholderEditorOpen] = useState(false);
  
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
      
        
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    }
  };
  
  const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${template.title}"?`)) return;
  };
  
  return {
    templates,
    expandedFolders,
    editDialogOpen,
    setEditDialogOpen,
    selectedTemplate,
    templateFormData,
    setTemplateFormData,
    placeholderEditorOpen,
    setPlaceholderEditorOpen,
    toggleFolder,
    handleUseTemplate,
    handleFinalizeTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
  };
}