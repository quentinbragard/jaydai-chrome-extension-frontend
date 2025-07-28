import { apiClient } from '@/services/api/ApiClient';

export async function getTemplateById(templateId: number): Promise<any> {
  try {
    const response = await apiClient.request(`/prompts/templates/${templateId}`, {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Error fetching template by id:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
