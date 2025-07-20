// src/hooks/prompts/useTemplateCreation.ts - Updated with onboarding tracking
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { promptApi } from '@/services/api/PromptApi';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { Template } from '@/types/prompts/templates';
import { trackEvent, EVENTS, incrementUserProperty } from '@/utils/amplitude';
import { onboardingTracker } from '@/services/onboarding/OnboardingTracker';

interface TemplateFormData {
  name: string;
  content: string;
  description?: string;
  folder_id?: number | null;
  tags?: string[];
  locale?: string;
  metadata?: Record<string, number | number[]>;
  metadata_fields?: string[];
  source?: string;
}

interface TemplateValidationErrors {
  name?: string;
  content?: string;
  description?: string;
}

/**
 * Hook for template creation and management functionality with onboarding tracking
 */
export function useTemplateCreation() {
  const queryClient = useQueryClient();
  const { openDialog } = useDialogManager();
  const [validationErrors, setValidationErrors] = useState<TemplateValidationErrors>({});
  
  // Create template mutation with onboarding tracking
  const createTemplateMutation = useMutation(
    async (data: TemplateFormData) => {
      const { source, metadata_fields, ...form } = data;
      // Prepare API payload
      const templateData = {
        title: form.name.trim(),
        content: form.content.trim(),
        description: form.description?.trim(),
        folder_id: form.folder_id || null,
        metadata: form.metadata || {},
        tags: form.tags || [],
        locale: form.locale || navigator.language || 'en',
        ...(form.metadata ? { metadata: form.metadata } : {})
      };

      const response = await promptApi.createTemplate(templateData);
      if (!response.success) {
        trackEvent(EVENTS.TEMPLATE_CREATE_ERROR, {
          error: response.message || 'Failed to create template'
        });
        throw new Error(response.message || 'Failed to create template');
      }

      // Track onboarding completion for first template
      await onboardingTracker.markTemplateCreated();
      
      incrementUserProperty('template_created_count', 1);
      trackEvent(EVENTS.TEMPLATE_CREATE, {
        template_id: response.data.id,
        template_name: response.data.title,
        template_type: response.data.type,
        metadata_fields: metadata_fields,
        source: source || 'CreateTemplateDialog'
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
        if (error?.message && error.message.includes('Subscription')) {
          openDialog(DIALOG_TYPES.PAYWALL);
        }
        toast.error(`Failed to create template: ${error?.message || 'Unknown error'}`);
      }
    }
  );
  
  // Update template mutation with onboarding tracking
  const updateTemplateMutation = useMutation(
    async ({ id, data }: { id: number; data: TemplateFormData }) => {
      // Prepare API payload
      const { metadata_fields, ...rest } = data;
      const templateData = {
        title: rest.name.trim(),
        content: rest.content.trim(),
        description: rest.description?.trim(),
        folder_id: rest.folder_id || null,
        tags: rest.tags || [],
        ...(rest.metadata ? { metadata: rest.metadata } : {})
      };
      
      const response = await promptApi.updateTemplate(id, templateData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update template');
      }
      return response.data;
    },
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries('userFolders');
        queryClient.invalidateQueries('unorganizedTemplates');
        toast.success('Template updated successfully');
        trackEvent(EVENTS.TEMPLATE_EDIT, { template_id: variables.id });
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
   * Save a template (create new or update existing) with onboarding tracking
   */
  const saveTemplate = useCallback(async (
    data: TemplateFormData,
    templateId?: number,
    source: string = 'CreateTemplateDialog'
  ): Promise<boolean> => {
    
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
        await createTemplateMutation.mutateAsync({ ...data, source });
      }
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Subscription')) {
        openDialog(DIALOG_TYPES.PAYWALL);
      }
      return false;
    }
  }, [validateTemplateForm, createTemplateMutation, updateTemplateMutation]);
  
  /**
   * Clone a template with onboarding tracking
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
      
      await createTemplateMutation.mutateAsync({ ...clonedData, source: 'CreateTemplateDialog' });
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