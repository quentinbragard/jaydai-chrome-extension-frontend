// src/services/api/PromptApi.ts
import { 
        getAllFolders,
        getUserFolders,
        updatePinnedFolders,
        toggleFolderPin,
        createFolder,
        deleteFolder
      } from './prompts/folders';
import {
        createTemplate,
        updateTemplate,
        deleteTemplate,
        getUnorganizedTemplates,
        getUserTemplates,
        trackTemplateUsage
      } from './prompts/templates';

import { 
        getBlocks,
        createBlock,
        updateBlock,
        deleteBlock,
        getBlockTypes
      } from './prompts/blocks';

/**
 * API client for working with prompt templates
 */
class PromptApiClient {
  
  async getAllFolders(type: string, empty: boolean = false, locale?: string): Promise<any> {
    return getAllFolders(type, empty, locale);
  }
  
  async updatePinnedFolders(type: 'official' | 'organization', folderIds: number[]): Promise<any> {
    return updatePinnedFolders(type, folderIds);
  }

  async toggleFolderPin(folderId: number, isPinned: boolean, type: 'official' | 'organization'): Promise<any> {
    return toggleFolderPin(folderId, isPinned, type);
  }

  async createTemplate(templateData: any): Promise<any> {
    return createTemplate(templateData);
  }

  async updateTemplate(templateId: number, templateData: any): Promise<any> {
    return updateTemplate(templateId, templateData);
  }

  async getUserFolders(): Promise<any> {
    return getUserFolders();
  }

  async deleteTemplate(templateId: number): Promise<any> {
    return deleteTemplate(templateId);
  }

  async getUnorganizedTemplates(): Promise<any> {
    return getUnorganizedTemplates();
  }

  async getUserTemplates(): Promise<any> {
    return getUserTemplates();
  }

  async createFolder(folderData: { name: string, path: string, description?: string }): Promise<any> {
    return createFolder(folderData);
  }

  async deleteFolder(folderId: number): Promise<{ success: boolean; error?: string }> {
    return deleteFolder(folderId);
  }

  async trackTemplateUsage(templateId: number): Promise<any> {
    return trackTemplateUsage(templateId);
  }

  async getBlocks(type?: string): Promise<any> {
    return getBlocks(type);
  }
  
  async getBlockTypes(): Promise<any> {
    return getBlockTypes();
  }
  
  async createBlock(blockData: any): Promise<any> {
    return createBlock(blockData);
  }
  
  async updateBlock(blockId: number, blockData: any): Promise<any> {
    return updateBlock(blockId, blockData);
  }
  
  async deleteBlock(blockId: number): Promise<any> {
    return deleteBlock(blockId);
  }

}

// Export a singleton instance
export const promptApi = new PromptApiClient();











