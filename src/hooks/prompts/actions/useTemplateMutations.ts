// src/hooks/prompts/actions/useTemplateMutations.ts
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Template } from '@/types/prompts/templates';

interface TemplateData {
  title: string;
  content: string;
  description?: string;
  folder_id?: number | null;
  tags?: string[];
  locale?: string;
}

/**
 * Hook that provides mutations for template CRUD operations
 */
export function useTemplateMutations() {
  const queryClient = useQueryClient();
  
  // Invalidate all template-related queries
  const invalidateTemplateQueries = () => {
    queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
    queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
    queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
  };
  
  // Create template mutation
  const createTemplate = useMutation(
    async (data: TemplateData) => {
      const response = await promptApi.createTemplate(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create template');
      }
      return response.template;
    },
    {
      onSuccess: () => {
        invalidateTemplateQueries();
        toast.success('Template created successfully');
      },
      onError: (error: Error) => {
        console.error('Error creating template:', error);
        toast.error(`Failed to create template: ${error.message}`);
      }
    }
  );
  
  // Update template mutation
  const updateTemplate = useMutation(
    async ({ id, data }: { id: number; data: Partial<TemplateData> }) => {
      const response = await promptApi.updateTemplate(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update template');
      }
      return response.template;
    },
    {
      onSuccess: () => {
        invalidateTemplateQueries();
        toast.success('Template updated successfully');
      },
      onError: (error: Error) => {
        console.error('Error updating template:', error);
        toast.error(`Failed to update template: ${error.message}`);
      }
    }
  );
  
  // Delete template mutation
  const deleteTemplate = useMutation(
    async (id: number) => {
      const response = await promptApi.deleteTemplate(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete template');
      }
      return id;
    },
    {
      onSuccess: () => {
        invalidateTemplateQueries();
        toast.success('Template deleted successfully');
      },
      onError: (error: Error) => {
        console.error('Error deleting template:', error);
        toast.error(`Failed to delete template: ${error.message}`);
      }
    }
  );
  
  // Track template usage
  const trackTemplateUsage = useMutation(
    async (id: number) => {
      return await promptApi.trackTemplateUsage(id);
    },
    {
      onSuccess: () => {
        // Silently update template data
        queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
      },
      onError: (error: Error) => {
        console.error('Error tracking template usage:', error);
        // No toast for usage tracking errors
      }
    }
  );
  
  return {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    trackTemplateUsage
  };
}