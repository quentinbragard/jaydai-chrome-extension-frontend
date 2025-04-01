// src/hooks/templates/index.ts
// Central export file for all template-related hooks

// Data fetching hooks from queries
export {
  usePinnedFolders,
  useUserFolders,
  useAllFolders,
  useUnorganizedTemplates,
  useUserTemplates
} from './queries';

// Action hooks
export { useTemplateActions } from './useTemplateActions';

// Template management hooks
export { useTemplateEditor } from './useTemplateEditor';
export { useTemplatePlaceholders } from './useTemplatePlaceholders';
export { useFolderSearch } from './useFolderSearch';
export { useTemplateCreation } from './useTemplateCreation';

// Type exports
export type { Template, Placeholder } from '@/types/prompts/templates';