// src/services/TemplateService.ts
import { apiService } from './ApiService';

export interface Template {
  id: string;
  name: string;
  content: string;
  description?: string;
  folder?: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

export interface TemplateFolder {
  path: string;
  name: string;
  templates: Template[];
  subfolders: TemplateFolder[];
}

export interface TemplateCollection {
  templates: Template[];
  folders: TemplateFolder[];
  rootTemplates: Template[];
}

/**
 * Service to manage prompt templates
 */
export class TemplateService {
  private static instance: TemplateService;
  private templates: Template[] = [];
  private folderStructure: TemplateFolder[] = [];
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
    console.log('📝 Initializing template service...');
    
    // Load templates immediately
    await this.loadTemplates();
    
    console.log('✅ Template service initialized');
  }
  
  /**
   * Load templates from backend
   * @param forceRefresh - Force refresh even if recently loaded
   */
  public async loadTemplates(forceRefresh = false): Promise<TemplateCollection> {
    // Skip if we've loaded recently (within 1 minute) and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && this.lastLoadTime > 0 && now - this.lastLoadTime < 60000) {
      console.log('🔄 Using cached templates');
      return this.getTemplateCollection();
    }
    
    // Skip if already loading
    if (this.isLoading) {
      console.log('⏳ Templates already loading');
      return this.getTemplateCollection();
    }
    
    this.isLoading = true;
    
    try {
      console.log('📝 Loading templates from API...');
      
      // Call API to get templates
      const response = await apiService.getAllTemplates();
      
      console.log('📦 API Response:', JSON.stringify(response, null, 2));
      
      if (response && response.success) {
        this.templates = response.templates || [];
        
        // Build folder structure
        this.buildFolderStructure();
        
        this.lastLoadTime = now;
        console.log(`✅ Loaded ${this.templates.length} templates`);
        
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
    return {
      templates: [...this.templates],
      folders: [...this.folderStructure],
      rootTemplates: this.templates.filter(t => !t.folder)
    };
  }
  
  /**
   * Get a template by ID
   */
  public getTemplate(id: string): Template | undefined {
    return this.templates.find(t => t.id === id);
  }
  
  /**
   * Create a new template
   */
  public async createTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<Template> {
    try {
      const response = await apiService.createTemplate(template);
      
      if (response && response.success && response.template) {
        // Add to local cache
        this.templates.push(response.template);
        
        // Rebuild folder structure
        this.buildFolderStructure();
        
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
      const response = await apiService.updateTemplate(id, template);
      
      if (response && response.success && response.template) {
        // Update in local cache
        const index = this.templates.findIndex(t => t.id === id);
        if (index >= 0) {
          this.templates[index] = response.template;
        }
        
        // Rebuild folder structure
        this.buildFolderStructure();
        
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
      const response = await apiService.deleteTemplate(id);
      
      if (response && response.success) {
        // Remove from local cache
        this.templates = this.templates.filter(t => t.id !== id);
        
        // Rebuild folder structure
        this.buildFolderStructure();
        
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
      const template = this.templates.find(t => t.id === id);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Track usage
      await apiService.trackTemplateUsage(id);
      
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
  private buildFolderStructure(): void {
    // Reset folder structure
    this.folderStructure = [];
    
    // Get all unique folder paths
    const folderPaths = new Set<string>();
    this.templates.forEach(template => {
      if (template.folder) {
        folderPaths.add(template.folder);
        
        // Add parent folders too
        const parts = template.folder.split('/');
        for (let i = 1; i < parts.length; i++) {
          folderPaths.add(parts.slice(0, i).join('/'));
        }
      }
    });
    
    // Create map of folder objects
    const folderMap: Record<string, TemplateFolder> = {};
    
    // Add root level
    folderMap[''] = {
      path: '',
      name: 'Root',
      templates: [],
      subfolders: []
    };
    
    // Create folder objects
    Array.from(folderPaths).sort().forEach(path => {
      const parts = path.split('/');
      const name = parts[parts.length - 1];
      
      folderMap[path] = {
        path,
        name,
        templates: [],
        subfolders: []
      };
    });
    
    // Build hierarchy
    Array.from(folderPaths).sort().forEach(path => {
      const parts = path.split('/');
      if (parts.length > 1) {
        const parentPath = parts.slice(0, parts.length - 1).join('/');
        const parent = folderMap[parentPath] || folderMap[''];
        parent.subfolders.push(folderMap[path]);
      } else {
        folderMap[''].subfolders.push(folderMap[path]);
      }
    });
    
    // Add templates to folders
    this.templates.forEach(template => {
      if (template.folder) {
        const folder = folderMap[template.folder];
        if (folder) {
          folder.templates.push(template);
        } else {
          // If folder doesn't exist (which shouldn't happen but just in case),
          // add to root
          folderMap[''].templates.push(template);
        }
      } else {
        // No folder specified, add to root
        folderMap[''].templates.push(template);
      }
    });
    
    // Set folder structure for the service
    this.folderStructure = folderMap[''].subfolders;
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