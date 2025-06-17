// src/services/api/PromptApi.ts
import { 
        getAllFolders,
        getUserFolders,
        getFolders,
        updatePinnedFolders,
        toggleFolderPin,
        createFolder,
        deleteFolder,
        updateFolder,
        reorderFolders
      } from './prompts/folders';
import {
        createTemplate,
        updateTemplate,
        deleteTemplate,
        getUnorganizedTemplates,
        getUserTemplates,
        trackTemplateUsage,
        reorderTemplates
      } from './prompts/templates';

/**
 * API client for working with prompt templates
 */
class PromptApiClient {
  
  async getAllFolders(type: string, empty: boolean = false, locale?: string): Promise<any> {
    return getAllFolders(type, empty, locale);
  }

  async getFolders(
    type?: string,
    withSubfolders: boolean = false,
    withTemplates: boolean = false,
    locale?: string
  ): Promise<any> {
    return getFolders(type, withSubfolders, withTemplates, locale);
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

  async deleteFolder(folderId: number): Promise<{ success: boolean; message?: string; data?: any }> {
    return deleteFolder(folderId);
  }

  async trackTemplateUsage(templateId: number): Promise<any> {
    return trackTemplateUsage(templateId);
  }

  async updateFolder(folderId: number, data: any): Promise<any> {
    return updateFolder(folderId, data);
  }

  async reorderFolders(parentId: number | null, ids: number[]): Promise<any> {
    return reorderFolders(parentId, ids);
  }

  async reorderTemplates(folderId: number | null, ids: number[]): Promise<any> {
    return reorderTemplates(folderId, ids);
  }

}

// Export a singleton instance
export const promptApi = new PromptApiClient();
