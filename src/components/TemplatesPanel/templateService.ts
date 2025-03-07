import { apiService } from './ApiService';

export interface Template {
  id: string;
  title: string;
  content: string;
  description?: string;
  folder?: string;
  category?: string;
  created_at: string;
  usage_count?: number;
  based_on_official_id?: string | null;
}

export interface TemplateFolder {
  path: string;
  name: string;
  templates: Template[];
  subfolders: TemplateFolder[];
}

export interface TemplateCollection {
  officialTemplates: {
    templates: Template[];
    folders: TemplateFolder[];
  };
  userTemplates: {
    templates: Template[];
    folders: TemplateFolder[];
  };
}

export class TemplateService {
  private static instance: TemplateService;
  private templateCollection: TemplateCollection = {
    officialTemplates: { templates: [], folders: [] },
    userTemplates: { templates: [], folders: [] }
  };
  private isLoading: boolean = false;
  private updateCallbacks: ((collection: TemplateCollection) => void)[] = [];

  private constructor() {}

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
    console.log('📝 Initializing template service...........................................................');


    
    // Load templates immediately
    await this.loadTemplates();
    
    console.log('✅ Template service initialized');
  }

  /**
   * Organize templates into folder structure
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
    
    // Process each template
    templates.forEach(template => {
      const folderPath = template.folder || '';
      const folderParts = folderPath.split('/');
      
      // Ensure all parent folders exist
      let currentPath = '';
      folderParts.forEach((part, index) => {
        currentPath += (currentPath ? '/' : '') + part;
        
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
            folderMap[parentPath].subfolders.push(folderMap[currentPath]);
          } else {
            // Root-level folders go into root's subfolders
            folderMap[''].subfolders.push(folderMap[currentPath]);
          }
        }
      });
      
      // Add template to its folder
      folderMap[folderPath].templates.push(template);
    });
    
    // Return root's subfolders (excluding root itself)
    return folderMap[''].subfolders;
  }

  /**
   * Load templates from backend
   */
  public async loadTemplates(forceRefresh = false): Promise<TemplateCollection> {
    // Prevent concurrent loads
    if (this.isLoading && !forceRefresh) {
      return this.templateCollection;
    }
    
    this.isLoading = true;
    
    try {
      // Fetch official templates
      const officialResponse = await apiService.request('/prompt-templates/official-templates');
      if (officialResponse.success && officialResponse.templates) {
        this.templateCollection.officialTemplates = {
          templates: officialResponse.templates,
          folders: this.organizeFolders(officialResponse.templates)
        };
      }
      
      // Fetch user templates
      const userResponse = await apiService.request('/prompt-templates/user-templates');
      if (userResponse.success && userResponse.templates) {
        this.templateCollection.userTemplates = {
          templates: userResponse.templates,
          folders: this.organizeFolders(userResponse.templates)
        };
      }

      console.log("this.templateCollection-------------------=", this.templateCollection);
      
      // Notify listeners
      this.notifyUpdateListeners();
      
      return this.templateCollection;
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      return this.templateCollection;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get the current template collection
   */
  public getTemplateCollection(): TemplateCollection {
    return { ...this.templateCollection };
  }

  /**
   * Create a new template
   */
  public async createTemplate(templateData: Partial<Template>): Promise<Template | null> {
    try {
      const response = await apiService.request('/prompt-templates/template', {
        method: 'POST',
        body: JSON.stringify(templateData)
      });
      
      if (response.success && response.template) {
        // Reload templates to update collection
        await this.loadTemplates(true);
        return response.template;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error creating template:', error);
      return null;
    }
  }

  /**
   * Update an existing template
   */
  public async updateTemplate(templateId: string, templateData: Partial<Template>): Promise<Template | null> {
    try {
      const response = await apiService.request(`/prompt-templates/template/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData)
      });
      
      if (response.success && response.template) {
        // Reload templates to update collection
        await this.loadTemplates(true);
        return response.template;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error updating template:', error);
      return null;
    }
  }

  /**
   * Delete a template
   */
  public async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const response = await apiService.request(`/prompt-templates/template/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Reload templates to update collection
        await this.loadTemplates(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      return false;
    }
  }

  /**
   * Register for template updates
   */
  public onTemplatesUpdate(callback: (collection: TemplateCollection) => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Call immediately with current data
    callback(this.getTemplateCollection());
    
    // Return cleanup function
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify update listeners
   */
  private notifyUpdateListeners(): void {
    const collection = this.getTemplateCollection();
    
    this.updateCallbacks.forEach(callback => {
      try {
        callback(collection);
      } catch (error) {
        console.error('❌ Error in template update callback:', error);
      }
    });
  }
}

// Export the singleton instance
export const templateService = TemplateService.getInstance();