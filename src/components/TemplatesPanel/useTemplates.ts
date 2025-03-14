// src/features/templates/useTemplates.ts

import { useState, useEffect } from 'react';
import { Template } from '@/types/templates';
import { templateApi } from '@/api';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { onEvent, emitEvent, AppEvent } from '@/core/events/events';

export function useTemplates() {
  const [officialTemplates, setOfficialTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  
  // Load templates on mount
  useEffect(() => {
    loadTemplates();
    
    // Listen for template events
    const unsubscribeCreated = onEvent(AppEvent.TEMPLATE_CREATED, () => {
      loadTemplates();
    });
    
    const unsubscribeUpdated = onEvent(AppEvent.TEMPLATE_UPDATED, () => {
      loadTemplates();
    });
    
    const unsubscribeDeleted = onEvent(AppEvent.TEMPLATE_DELETED, () => {
      loadTemplates();
    });
    
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, []);
  
  // Load templates from API
  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      const response = await templateApi.getAllTemplates();
      
      if (response && response.success) {
        // Organize templates
        setOfficialTemplates(response.officialTemplates.templates || []);
        setUserTemplates(response.userTemplates.templates || []);
      } else {
        throw new AppError('Failed to load templates', ErrorCode.API_ERROR);
      }
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error loading templates'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle template usage
  const handleUseTemplate = async (template: Template) => {
    try {
      // Track template usage
      await templateApi.trackTemplateUsage(template.id!);
      
      // Emit event
      emitEvent(AppEvent.TEMPLATE_USED, {
        templateId: String(template.id),
        name: template.name
      });
      
      // Insert template content into input area
      const content = template.content;
      const result = insertTemplateContent(content);
      
      return result;
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error using template'));
      return false;
    }
  };
  
  // Insert template content into input area
  const insertTemplateContent = (content: string): boolean => {
    try {
      // Find the input area
      const inputArea = document.querySelector('textarea[data-id="root"]') as HTMLTextAreaElement;
      
      if (!inputArea) {
        console.error('Input area not found');
        return false;
      }
      
      // Set content
      inputArea.value = content;
      
      // Trigger input event
      inputArea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Focus the input
      inputArea.focus();
      
      return true;
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error inserting template content'));
      return false;
    }
  };
  
  // Handle edit template
  const handleEditTemplate = (template: Template) => {
    setCurrentTemplate(template);
    setEditDialogOpen(true);
  };
  
  // Handle create template
  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setEditDialogOpen(true);
  };
  
  // Handle delete template
  const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling
    
    try {
      if (!confirm(`Are you sure you want to delete "${template.title || template.name}"?`)) {
        return;
      }
      
      await templateApi.deleteTemplate(template.id!);
      
      // Emit event
      emitEvent(AppEvent.TEMPLATE_DELETED, {
        templateId: String(template.id)
      });
      
      // Refresh templates
      loadTemplates();
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error deleting template'));
    }
  };
  
  return {
    officialTemplates,
    userTemplates,
    loading,
    editDialogOpen,
    currentTemplate,
    setEditDialogOpen,
    handleUseTemplate,
    handleEditTemplate,
    handleCreateTemplate,
    handleDeleteTemplate
  };
}