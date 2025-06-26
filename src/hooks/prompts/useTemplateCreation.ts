// src/hooks/templates/useTemplateCreation.ts
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { promptApi } from '@/services/api/PromptApi';
import { Template } from '@/types/prompts/templates';
import { trackEvent, EVENTS, incrementUserProperty } from '@/utils/amplitude';

interface TemplateFormData {
  name: string;
  content: string;
  description?: string;
  folder_id?: number | null;
  tags?: string[];
  locale?: string;
  metadata?: Record<string, number | number[]>;
}

interface TemplateValidationErrors {
  name?: string;
  content?: string;
  description?: string;
}

/**
 * Hook for template creation and management functionality
 */
export function useTemplateCreation() {
  const queryClient = useQueryClient();
  const [validationErrors, setValidationErrors] = useState<TemplateValidationErrors>({});
  
  // Create template mutation
  const createTemplateMutation = useMutation(
    async (data: TemplateFormData) => {
      // Prepare API payload
      const templateData = {
        title: data.name.trim(),
        content: data.content.trim(),
        description: data.description?.trim(),
        folder_id: data.folder_id || null,
        metadata: data.metadata || {},
        tags: data.tags || [],
        locale: data.locale || navigator.language || 'en',
        ...(data.metadata ? { metadata: data.metadata } : {})
      };

      console.log("TEMPLATE DATA", templateData);
      
      const response = await promptApi.createTemplate(templateData);
      if (!response.success) {
        trackEvent(EVENTS.TEMPLATE_CREATE_ERROR, {
          error: response.message || 'Failed to create template'
        });
        throw new Error(response.message || 'Failed to create template');
      }
      incrementUserProperty('template_created_count', 1);
      trackEvent(EVENTS.TEMPLATE_CREATE, {
        template_id: response.data.id,
        template_name: response.data.title,
        template_type: response.data.type
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userFolders');
        queryClient.invalidateQueries('unorganizedTemplates');
        toast.success('Template created successfully');
      },
      onError: (error: any) => {
        console.error('Error creating template:', error);
        toast.error(`Failed to create template: ${error?.message || 'Unknown error'}`);
      }
    }
  );
  
  // Update template mutation
  const updateTemplateMutation = useMutation(
    async ({ id, data }: { id: number; data: TemplateFormData }) => {
      // Prepare API payload
      const templateData = {
        title: data.name.trim(),
        content: data.content.trim(),
        description: data.description?.trim(),
        folder_id: data.folder_id || null,
        tags: data.tags || [],
        ...(data.metadata ? { metadata: data.metadata } : {})
      };
      
      const response = await promptApi.updateTemplate(id, templateData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update template');
      }
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userFolders');
        queryClient.invalidateQueries('unorganizedTemplates');
        toast.success('Template updated successfully');
      },
      onError: (error: any) => {
        console.error('Error updating template:', error);
        toast.error(`Failed to update template: ${error?.message || 'Unknown error'}`);
      }
    }
  );
  
  /**
   * Validate template form data
   */
  const validateTemplateForm = useCallback((data: TemplateFormData): boolean => {
    const errors: TemplateValidationErrors = {};
    
    if (!data.name?.trim()) {
      errors.name = 'Template name is required';
    }
    
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);
  
  /**
   * Save a template (create new or update existing)
   */
  const saveTemplate = useCallback(async (
    data: TemplateFormData, 
    templateId?: number
  ): Promise<boolean> => {

    console.log("DATAAAAAAA", data);
    // Validate the form data first
    if (!validateTemplateForm(data)) {
      return false;
    }
    
    try {
      if (templateId) {
        // Update existing template
        await updateTemplateMutation.mutateAsync({ id: templateId, data });
      } else {
        // Create new template
        await createTemplateMutation.mutateAsync(data);
      }
      return true;
    } catch (error) {
      return false;
    }
  }, [validateTemplateForm, createTemplateMutation, updateTemplateMutation]);
  
  /**
   * Clone a template
   */
  const cloneTemplate = useCallback(async (template: Template): Promise<boolean> => {
    if (!template) {
      toast.error('Cannot clone: Invalid template');
      return false;
    }
    
    try {
      const clonedData: TemplateFormData = {
        name: `${template.title || 'Untitled'} (Copy)`,
        content: template.content || '',
        description: template.description,
        folder_id: template.folder_id
      };
      
      await createTemplateMutation.mutateAsync(clonedData);
      return true;
    } catch (error) {
      console.error('Error cloning template:', error);
      return false;
    }
  }, [createTemplateMutation]);
  
  return {
    isCreating: createTemplateMutation.isLoading,
    isUpdating: updateTemplateMutation.isLoading,
    validationErrors,
    saveTemplate,
    cloneTemplate,
    validateTemplateForm
  };
}