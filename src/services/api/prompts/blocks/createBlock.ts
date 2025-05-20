// src/services/api/prompts/blocks/createBlock.ts
import { apiClient } from "@/services/api/ApiClient";

/**
 * Create a new block
 */
export async function createBlock(blockData: any): Promise<any> {
  try {
    // Ensure required fields are present
    if (!blockData.type || !blockData.content) {
      return {
        success: false,
        error: 'Type and content are required'
      };
    }
    
    const response = await apiClient.request('/prompts/blocks', {
      method: 'POST',
      body: JSON.stringify(blockData)
    });
    
    return response;
  } catch (error) {
    console.error('Error creating block:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

