import { apiClient } from '@/services/api/ApiClient';

export async function getWhichTemplate(): Promise<any> {
  try {
    const response = await apiClient.request('/onboarding/which-template');
    return response;
  } catch (error) {
    console.error('Error fetching onboarding template:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
