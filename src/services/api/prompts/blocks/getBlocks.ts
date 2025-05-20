import { apiClient } from "@/services/api/ApiClient";

/**
 * Get blocks accessible to the user, optionally filtered by type
 */
export async function getBlocks(type?: string): Promise<any> {
  try {
    const endpoint = type ? `/prompts/blocks?type=${type}` : '/prompts/blocks';
    const response = await apiClient.request(endpoint, {
      method: 'GET'
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return { 
      success: false, 
      blocks: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}




