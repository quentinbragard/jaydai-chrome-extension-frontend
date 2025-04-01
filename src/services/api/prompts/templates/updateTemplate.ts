/**
 * Update an existing template
 */

import { apiClient } from "@/services/api/ApiClient";

export async function updateTemplate(templateId: number, templateData: any): Promise<any> {
    try {
      // Ensure required fields are present
      if (!templateData.title && !templateData.content) {
        return {
          success: false,
          error: 'At least one field to update is required'
        };
      }
            
      const response = await apiClient.request(`/prompts/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData)
      });
      return response;
    } catch (error) {
      console.error('Error updating template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
