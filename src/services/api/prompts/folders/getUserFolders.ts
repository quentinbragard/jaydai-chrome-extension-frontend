
import { apiClient } from "../../ApiClient";

/**
   * Get user folders
   */
export async function getUserFolders(): Promise<any> {
    try {
      const response = await apiClient.request('/prompts/folders?type=user', {
        method: 'GET'
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching user folders:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }