// src/services/api/prompts/blocks/updateBlock.ts
import { apiClient } from "@/services/api/ApiClient";

/**
 * Update an existing block
 */
export async function updateBlock(blockId: number, blockData: any): Promise<any> {
  try {
    // Ensure at least one field to update is provided
    if (!blockData.type && !blockData.content && !blockData.title && !blockData.description) {
      return {
        success: false,
        error: 'At least one field to update is required'
      };
    }
    
    const response = await apiClient.request(`/prompts/blocks/${blockId}`, {
      method: 'PUT',
      body: JSON.stringify(blockData)
    });
    
    return response;
  } catch (error) {
    console.error('Error updating block:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}