/**
 * Export all template hooks for easy importing elsewhere
 */

export { default as useTemplates } from './useTemplates';
export { default as useTemplateEditor } from './useTemplateEditor';
export { default as useTemplateFolders } from './useTemplateFolders';
export { default as useTemplatePlaceholders } from './useTemplatePlaceholders';

// Also export types for convenience
export type { 
  Template, 
  TemplateFolder, 
  TemplateFormData
} from '@/types/templates';