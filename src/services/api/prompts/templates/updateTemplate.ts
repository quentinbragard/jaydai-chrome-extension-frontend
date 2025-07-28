
/**
 * Update an existing template with automatic cache invalidation
 */
import { apiClient } from "@/services/api/ApiClient";
import { normalizeTemplate } from '@/utils/prompts/templateUtils';

export async function updateTemplate(templateId: number, templateData: any): Promise<any> {
  try {
    // Ensure required fields are present
    if (!templateData.title && !templateData.content) {
      return {
        success: false,
        message: 'At least one field to update is required'
      };
    }
    
    // Add type if not present
    const dataToSend = {
      ...templateData,
      type: templateData.type || 'user'
    };
    
  const response = await apiClient.request(`/prompts/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(dataToSend)
  });
  if (response.success && response.data) {
    response.data = normalizeTemplate(response.data);
  }

  return response;
  } catch (error) {
    console.error('Error updating template:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}