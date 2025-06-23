import { apiClient } from "@/services/api/ApiClient";

export async function getPinnedTemplates(): Promise<any> {
  try {
    const response = await apiClient.request('/prompts/templates/pinned', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Error fetching pinned templates:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
