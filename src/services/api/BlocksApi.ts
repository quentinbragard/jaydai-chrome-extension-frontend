
// src/services/api/BlocksApi.ts - Enhanced Version
import { apiClient } from './ApiClient';
import { Block, BlockType } from '@/types/prompts/blocks';

interface CreateBlockData {
  title: string;                    
  content: string;                  
  type: BlockType;
  description?: string;             
  published?: boolean;
  parent_block_id?: number;
  tags?: string[];
}

interface UpdateBlockData {
  title?: string;
  content?: string;
  description?: string;
  published?: boolean;
  tags?: string[];
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class BlocksApiClient {
  /**
   * Get all blocks
   */
  async getBlocks(): Promise<ApiResponse<Block[]>> {
    try {
      const response = await apiClient.request('/prompts/blocks');
      return response;
    } catch (error) {
      console.error('Error fetching blocks:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all blocks of a specific type
   */
  async getBlocksByType(type: BlockType): Promise<ApiResponse<Block[]>> {
    try {
      const response = await apiClient.request(`/prompts/blocks?type=${type}`);
      return response;
    } catch (error) {
      console.error(`Error fetching blocks of type ${type}:`, error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a single block by ID
   */
  async getBlock(id: number): Promise<ApiResponse<Block>> {
    try {
      const response = await apiClient.request(`/prompts/blocks/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching block ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * **NEW: Get a single block by ID (alias for compatibility)**
   */
  async getBlockById(id: number): Promise<ApiResponse<Block>> {
    return this.getBlock(id);
  }

  /**
   * **NEW: Create a new block**
   */
  async createBlock(data: CreateBlockData): Promise<ApiResponse<Block>> {
    try {

      // Validate required fields
      if (!data.title || !data.content || !data.type) {
        return {
          success: false,
          message: 'Title, content, and type are required'
        };
      }

      const requestBody = {
        title: data.title,
        content: data.content,
        type: data.type,
        description: data.description || '',
        published: data.published ?? true, // Default to published
        parent_block_id: data.parent_block_id || null,
        tags: data.tags || []
      };

      const response = await apiClient.request('/prompts/blocks', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      if (response.success) {
      }

      return response;
    } catch (error) {
      console.error('Error creating block:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * **NEW: Update an existing block**
   */
  async updateBlock(id: number, data: UpdateBlockData): Promise<ApiResponse<Block>> {
    try {
      
      const requestBody = {
        title: data.title,             
        content: data.content,          
        description: data.description, 
        published: data.published,
        tags: data.tags
      };
  
      const response = await apiClient.request(`/prompts/blocks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });
  
      return response;
    } catch (error) {
      console.error(`Error updating block ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * **NEW: Delete a block**
   */
  async deleteBlock(id: number): Promise<ApiResponse<void>> {
    try {
      
      const response = await apiClient.request(`/prompts/blocks/${id}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error(`Error deleting block ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * **NEW: Duplicate a block with modifications**
   */
  async duplicateBlock(
    originalId: number, 
    modifications: Partial<CreateBlockData>
  ): Promise<ApiResponse<Block>> {
    try {
      // First, get the original block
      const originalResponse = await this.getBlock(originalId);
      if (!originalResponse.success || !originalResponse.data) {
        return {
          success: false,
          message: 'Could not fetch original block'
        };
      }
  
      const original = originalResponse.data;
      
      // Create new block data - all strings now
      const newBlockData: CreateBlockData = {
        title: modifications.title || `${original.title} (Copy)`,
        content: modifications.content || original.content,
        type: modifications.type || original.type,
        description: modifications.description || original.description,
        published: modifications.published ?? false,
        parent_block_id: modifications.parent_block_id ?? originalId,
        tags: modifications.tags || original.tags || []
      };
  
      return this.createBlock(newBlockData);
    } catch (error) {
      console.error(`Error duplicating block ${originalId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * **NEW: Bulk create blocks (useful for batch operations)**
   */
  async createBlocks(blocksData: CreateBlockData[]): Promise<ApiResponse<Block[]>> {
    try {
      
      const results = await Promise.all(
        blocksData.map(data => this.createBlock(data))
      );

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        console.warn(`${failed.length} blocks failed to create`);
      }

      return {
        success: successful.length > 0,
        data: successful.map(r => r.data!),
        message: failed.length > 0 
          ? `${successful.length} blocks created, ${failed.length} failed`
          : `${successful.length} blocks created successfully`
      };
    } catch (error) {
      console.error('Error creating multiple blocks:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * **NEW: Search blocks by content or title**
   */
  async searchBlocks(query: string, type?: BlockType): Promise<ApiResponse<Block[]>> {
    try {
      const params = new URLSearchParams({ q: query });
      if (type) params.append('type', type);
      
      const response = await apiClient.request(`/prompts/blocks/search?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error searching blocks:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * **NEW: Get blocks by parent ID (for finding modified versions)**
   */
  async getBlocksByParent(parentId: number): Promise<ApiResponse<Block[]>> {
    try {
      const response = await apiClient.request(`/prompts/blocks?parent_id=${parentId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching child blocks of ${parentId}:`, error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const blocksApi = new BlocksApiClient();