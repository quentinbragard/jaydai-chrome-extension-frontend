
// src/services/api/prompts/blocks/getBlockTypes.ts
import { apiClient } from "@/services/api/ApiClient";

/**
 * Get all available block types
 */
export async function getBlockTypes(): Promise<any> {
  //try {
    const response = await apiClient.request('/prompts/blocks/types', {
      method: 'GET'
    });
    
    return response;
  //} catch (error) {
  //  console.error('Error fetching block types:', error);
  //  return { 
  //    success: false, 
  //    types: [],
  //    error: error instanceof Error ? error.message : 'Unknown error'
  //  };
  //}
}