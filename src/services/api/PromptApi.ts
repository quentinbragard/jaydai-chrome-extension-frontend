// src/services/api/PromptApi.ts
import { 
        getAllFolders,
        getUserFolders,
        getFolders,
        updatePinnedFolders,
        toggleFolderPin,
        createFolder,
        deleteFolder,
        updateFolder
      } from './prompts/folders';
import {
        createTemplate,
        updateTemplate,
        deleteTemplate,
        getUnorganizedTemplates,
        getUserTemplates,
        getTemplatesByFolder,
        trackTemplateUsage,
        toggleTemplatePin
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
  
  async updatePinnedFolders(type: 'company' | 'organization', folderIds: number[]): Promise<any> {
    return updatePinnedFolders(type, folderIds);
  }

  async toggleFolderPin(folderId: number, isPinned: boolean, type: 'company' | 'organization' | 'user'): Promise<any> {
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

  async toggleTemplatePin(templateId: number, isPinned: boolean, type: 'company' | 'organization' | 'user'): Promise<any> {
    return toggleTemplatePin(templateId, isPinned, type);
  }

  async getUnorganizedTemplates(): Promise<any> {
    return getUnorganizedTemplates();
  }

  async getUserTemplates(): Promise<any> {
    return getUserTemplates();
  }

  async getTemplatesByFolder(folderId: number): Promise<any> {
    return getTemplatesByFolder(folderId);
  }

  async createFolder(folderData: { title: string; description?: string; parent_folder_id?: number | null }): Promise<any> {
    return createFolder(folderData);
  }

  async deleteFolder(folderId: number): Promise<{ success: boolean; message?: string; data?: any }> {
    return deleteFolder(folderId);
  }

  async updateFolder(folderId: number, data: { title?: string; description?: string; parent_folder_id?: number | null }): Promise<any> {
    return updateFolder(folderId, data);
  }

  async trackTemplateUsage(templateId: number): Promise<any> {
    return trackTemplateUsage(templateId);
  }

}

// Export a singleton instance
export const promptApi = new PromptApiClient();