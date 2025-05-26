// src/services/api/BlocksApi.ts
import { apiClient } from './ApiClient';
import { Block, BlockType } from '@/components/templates/blocks/types';

export interface BlockResponse {
  id: number;
  type: BlockType;
  content: Record<string, string>;
  title?: Record<string, string>;
  description?: Record<string, string>;
  user_id?: string;
  organization_id?: string;
  company_id?: string;
  is_owned?: boolean;
  created_at: string;
}

export interface CreateBlockData {
  type: BlockType;
  content: Record<string, string>;
  title?: Record<string, string>;
  description?: Record<string, string>;
  organization_id?: string;
  company_id?: string;
}

export interface UpdateBlockData {
  type?: BlockType;
  content?: Record<string, string>;
  title?: Record<string, string>;
  description?: Record<string, string>;
}

export class BlocksApi {
  /**
   * Get all blocks accessible to the user
   */
  async getBlocks(type?: BlockType): Promise<any> {
    try {
      const params = type ? `?type=${type}` : '';
      return await apiClient.request(`/prompts/blocks${params}`);
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
   * Get blocks by specific type
   */
  async getBlocksByType(blockType: BlockType): Promise<any> {
    try {
      return await apiClient.request(`/prompts/blocks/by-type/${blockType}`);
    } catch (error) {
      console.error(`Error fetching ${blockType} blocks:`, error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new block
   */
  async createBlock(blockData: CreateBlockData): Promise<any> {
    try {
      return await apiClient.request('/prompts/blocks', {
        method: 'POST',
        body: JSON.stringify(blockData)
      });
    } catch (error) {
      console.error('Error creating block:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update an existing block
   */
  async updateBlock(blockId: number, blockData: UpdateBlockData): Promise<any> {
    try {
      return await apiClient.request(`/prompts/blocks/${blockId}`, {
        method: 'PUT',
        body: JSON.stringify(blockData)
      });
    } catch (error) {
      console.error('Error updating block:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a block
   */
  async deleteBlock(blockId: number): Promise<any> {
    try {
      return await apiClient.request(`/prompts/blocks/${blockId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting block:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all available block types
   */
  async getBlockTypes(): Promise<any> {
    try {
      return await apiClient.request('/prompts/blocks/types');
    } catch (error) {
      console.error('Error fetching block types:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Seed sample blocks (development only)
   */
  async seedSampleBlocks(): Promise<any> {
    try {
      return await apiClient.request('/prompts/blocks/seed-sample-blocks', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error seeding sample blocks:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const blocksApi = new BlocksApi();