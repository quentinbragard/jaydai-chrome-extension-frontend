
// src/services/api/prompts/blocks/deleteBlock.ts
import { apiClient } from "@/services/api/ApiClient";

/**
 * Delete a block
 */
export async function deleteBlock(blockId: number): Promise<any> {
  try {
    const response = await apiClient.request(`/prompts/blocks/${blockId}`, {
      method: 'DELETE'
    });
    
    return response;
  } catch (error) {
    console.error('Error deleting block:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
