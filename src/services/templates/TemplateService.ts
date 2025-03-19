// src/services/TemplateService.ts
import { templateApi } from '@/api'

export interface Template {
  id: string;
  name: string;
  content: string;
  description?: string;
  folder?: string;
  created_at: string;
  updated_at?: string;
  usage_count?: number;
}

export interface TemplateFolder {
  path: string;
  name: string;
  templates: Template[];
  subfolders: TemplateFolder[];
}

export interface TemplateCollection {
  userTemplates: {
    templates: Template[];
    folders: TemplateFolder[];
  };
  officialTemplates: {
    templates: Template[];
    folders: TemplateFolder[];
  };
}

/**
 * Service to manage prompt templates
 */
export class TemplateService {
  private static instance: TemplateService;
  private templateCollection: TemplateCollection = {
    officialTemplates: { templates: [], folders: [] },
    userTemplates: { templates: [], folders: [] }
  };
  private isLoading: boolean = false;
  private lastLoadTime: number = 0;
  private updateCallbacks: ((templates: TemplateCollection) => void)[] = [];
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }
  
  /**
   * Initialize the template service
   */
  public async initialize(): Promise<void> {
    
    // Load templates immediately
    await this.loadTemplates();
    
  }
  
  /**
   * Load templates from backend
   * @param forceRefresh - Force refresh even if recently loaded
   */
  public async loadTemplates(forceRefresh = false): Promise<TemplateCollection> {
    // Skip if we've loaded recently (within 1 minute) and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && this.lastLoadTime > 0 && now - this.lastLoadTime < 60000) {
      return this.getTemplateCollection();
    }
    
    // Skip if already loading
    if (this.isLoading) {
      return this.getTemplateCollection();
    }
    
    this.isLoading = true;
    
    try {
      
      // Call API to get templates
      const response = await templateApi.getPinnedTemplates();
            
      if (response && response.success) {
        // Here's the fix - properly handle the separate userTemplates and officialTemplates
        this.templateCollection = {
          userTemplates: {
            templates: response.userTemplates || [],
            folders: this.organizeFolders(response.userTemplates || [])
          },
          officialTemplates: {
            templates: response.officialTemplates || [],
            folders: this.organizeFolders(response.officialTemplates || [])
          }
        };
        
        this.lastLoadTime = now;
        
        // Notify update listeners
        this.notifyUpdateListeners();
      } else {
        console.warn('⚠️ Template fetch returned no data or unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      this.isLoading = false;
    }
    
    return this.getTemplateCollection();
  }
  
  /**
   * Get the current template collection
   */
  public getTemplateCollection(): TemplateCollection {
    return { ...this.templateCollection };
  }
  
  /**
   * Get a template by ID
   */
  public getTemplate(id: string): Template | undefined {
    // Look in user templates first, then official templates
    const userTemplate = this.templateCollection.userTemplates.templates.find(t => t.id === id);
    if (userTemplate) return userTemplate;
    
    return this.templateCollection.officialTemplates.templates.find(t => t.id === id);
  }
  
  /**
   * Create a new template
   */
  public async createTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<Template> {
    try {
      const response = await templateApi.createTemplate(template);
      
      if (response && response.success && response.template) {
        // Add to local collection
        this.templateCollection.userTemplates.templates.push(response.template);
        
        // Rebuild folder structure
        this.templateCollection.userTemplates.folders = this.organizeFolders(
          this.templateCollection.userTemplates.templates
        );
        
        // Notify update listeners
        this.notifyUpdateListeners();
        
        return response.template;
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('❌ Error creating template:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing template
   */
  public async updateTemplate(id: string, template: Partial<Template>): Promise<Template> {
    try {
      const response = await templateApi.updateTemplate(id, template);
      
      if (response && response.success && response.template) {
        // Update in local collection
        const index = this.templateCollection.userTemplates.templates
          .findIndex(t => t.id === id);
          
        if (index >= 0) {
          this.templateCollection.userTemplates.templates[index] = response.template;
        }
        
        // Rebuild folder structure
        this.templateCollection.userTemplates.folders = this.organizeFolders(
          this.templateCollection.userTemplates.templates
        );
        
        // Notify update listeners
        this.notifyUpdateListeners();
        
        return response.template;
      } else {
        throw new Error('Failed to update template');
      }
    } catch (error) {
      console.error('❌ Error updating template:', error);
      throw error;
    }
  }
  
  /**
   * Delete a template
   */
  public async deleteTemplate(id: string): Promise<boolean> {
    try {
      const response = await templateApi.deleteTemplate(id);
      
      if (response && response.success) {
        // Remove from local collection
        this.templateCollection.userTemplates.templates = 
          this.templateCollection.userTemplates.templates.filter(t => t.id !== id);
        
        // Rebuild folder structure
        this.templateCollection.userTemplates.folders = this.organizeFolders(
          this.templateCollection.userTemplates.templates
        );
        
        // Notify update listeners
        this.notifyUpdateListeners();
        
        return true;
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      throw error;
    }
  }
  
  /**
   * Use a template and track usage
   */
  public async useTemplate(id: string): Promise<Template> {
    try {
      // Find template in cache
      const template = this.getTemplate(id);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Track usage
      await templateApi.useTemplate(id);
      
      // Update local usage count
      template.usage_count = (template.usage_count || 0) + 1;
      
      return template;
    } catch (error) {
      console.error('❌ Error using template:', error);
      throw error;
    }
  }
  
  /**
   * Insert a template's content into the ChatGPT input area
   */
  public insertTemplateContent(content: string): boolean {
    try {
      // Find the ChatGPT input area
      const inputArea = document.querySelector('textarea[data-id="root"]') as HTMLTextAreaElement;
      if (!inputArea) {
        console.error('❌ ChatGPT input area not found');
        return false;
      }
      
      // Insert content
      inputArea.value = content;
      
      // Trigger input event to ensure ChatGPT detects the change
      inputArea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Focus the input area
      inputArea.focus();
      
      return true;
    } catch (error) {
      console.error('❌ Error inserting template content:', error);
      return false;
    }
  }
  
  /**
   * Register for template updates
   * @returns Cleanup function
   */
  public onTemplatesUpdate(callback: (templates: TemplateCollection) => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Call immediately with current data
    callback(this.getTemplateCollection());
    
    // Return cleanup function
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }
  
 /**
 * Build folder structure from flat template list
 */
private organizeFolders(templates: Template[]): TemplateFolder[] {
  const folderMap: Record<string, TemplateFolder> = {};
  
  // Create root folder
  folderMap[''] = {
    path: '',
    name: 'Root',
    templates: [],
    subfolders: []
  };
  
  // First, collect all templates with no folder to the root
  templates.forEach(template => {
    if (!template.folder) {
      folderMap[''].templates.push(template);
    }
  });
  
  // Then process the templates with folders
  templates.forEach(template => {
    const folderPath = template.folder || '';
    
    if (!folderPath) {
      // Skip root templates as they're already added
      return;
    }
    
    const folderParts = folderPath.split('/');
    
    // Ensure all parent folders exist
    let currentPath = '';
    folderParts.forEach((part, index) => {
      currentPath += (index > 0 ? '/' : '') + part;
      
      if (!folderMap[currentPath]) {
        folderMap[currentPath] = {
          path: currentPath,
          name: part,
          templates: [],
          subfolders: []
        };
        
        // Add to parent folder's subfolders
        if (index > 0) {
          const parentPath = folderParts.slice(0, index).join('/');
          if (folderMap[parentPath]) {
            folderMap[parentPath].subfolders.push(folderMap[currentPath]);
          }
        } else {
          // Root-level folders go into root's subfolders
          folderMap[''].subfolders.push(folderMap[currentPath]);
        }
      }
    });
    
    // Add template to its folder
    folderMap[folderPath].templates.push(template);
  });
  
  // Return root's subfolders
  return folderMap[''].subfolders;
}
  
  /**
   * Notify all update listeners
   */
  private notifyUpdateListeners(): void {
    const templateCollection = this.getTemplateCollection();
    
    this.updateCallbacks.forEach(callback => {
      try {
        callback(templateCollection);
      } catch (error) {
        console.error('❌ Error in template update callback:', error);
      }
    });
  }
}

// Export the singleton instance
export const templateService = TemplateService.getInstance();