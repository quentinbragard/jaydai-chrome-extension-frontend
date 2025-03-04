import { Template, TemplateCollection, TemplateFormData } from './types';

// Mock template service implementation
const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Research Template',
    content: 'Please help me research [TOPIC]. I need to understand the following aspects: 1. History 2. Current trends 3. Future possibilities 4. Important figures in the field',
    description: 'Template for researching topics thoroughly',
    folder: 'academic',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    usage_count: 5
  },
  {
    id: '2',
    name: 'Bug Fix Template',
    content: 'I am encountering an error in my [LANGUAGE] code: ```\n[CODE]\n```\n\nThe error message is: [ERROR]\n\nCan you help me fix this issue?',
    description: 'Template for debugging code issues',
    folder: 'programming',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    usage_count: 12
  },
  {
    id: '3',
    name: 'Creative Writing Prompt',
    content: 'Can you write a short story about [TOPIC] with the following elements: - Setting: [SETTING] - Main character: [CHARACTER] - Theme: [THEME] - Style: [STYLE]',
    folder: 'creative',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    usage_count: 3
  }
];

const mockFolders = [
  {
    path: 'academic',
    name: 'Academic',
    templates: [],
    subfolders: []
  },
  {
    path: 'programming',
    name: 'Programming',
    templates: [],
    subfolders: []
  },
  {
    path: 'creative',
    name: 'Creative',
    templates: [],
    subfolders: []
  }
];

export const templateService = {
  loadTemplates: async (): Promise<TemplateCollection> => {
    return Promise.resolve({
      templates: mockTemplates,
      folders: mockFolders,
      rootTemplates: []
    });
  },
  
  createTemplate: async (templateData: TemplateFormData): Promise<{success: boolean}> => {
    console.log('Creating template:', templateData);
    return Promise.resolve({ success: true });
  },
  
  updateTemplate: async (id: string, templateData: TemplateFormData): Promise<{success: boolean}> => {
    console.log('Updating template:', id, templateData);
    return Promise.resolve({ success: true });
  },
  
  deleteTemplate: async (id: string): Promise<{success: boolean}> => {
    console.log('Deleting template:', id);
    return Promise.resolve({ success: true });
  },
  
  useTemplate: async (id: string): Promise<{success: boolean}> => {
    console.log('Using template:', id);
    return Promise.resolve({ success: true });
  },
  
  insertTemplateContent: (content: string): boolean => {
    console.log('Inserting template content:', content);
    return true;
  },
  
  onTemplatesUpdate: (callback: (templates: TemplateCollection) => void): () => void => {
    // In a real implementation, this would register a callback
    // to be called when templates change
    const timeoutId = setTimeout(() => {
      templateService.loadTemplates().then(templates => callback(templates));
    }, 1000); // Simulate a templates update after 1s
    
    return () => {
      clearTimeout(timeoutId);
    };
  }
};

export default templateService; 