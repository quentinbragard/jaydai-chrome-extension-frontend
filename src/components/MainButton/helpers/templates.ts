// src/features/Templates/utils/templateHelpers.ts
import { Template, TemplateFolder } from '../types';

/**
 * Processes a folder's templates and creates a hierarchical folder structure
 * based on template paths.
 */
export function processTemplatesIntoFolderStructure(folder: TemplateFolder | null) {
  if (!folder || !folder.templates) {
    return { directTemplates: [], subfolders: {} };
  }

  const directTemplates: Template[] = [];
  const subfolders: Record<string, {
    name: string,
    templates: Template[],
    children: Record<string, any>
  }> = {};

  folder.templates.forEach(template => {
    if (!template.path || template.path === '') {
      // Templates without path go directly in this folder
      directTemplates.push(template);
      return;
    }

    // Split the path and process
    const pathParts = template.path.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      // Empty path after filtering - add to direct templates
      directTemplates.push(template);
      return;
    }

    // Process the path parts to create the folder hierarchy
    let currentLevel = subfolders;
    let currentPath = '';

    pathParts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      // Create this level if it doesn't exist
      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          templates: [],
          children: {}
        };
      }
      
      // If this is the last path part, add the template to this folder
      if (index === pathParts.length - 1) {
        currentLevel[part].templates.push(template);
      }
      
      // Move to the next level for the next iteration
      currentLevel = currentLevel[part].children;
    });
  });

  return { directTemplates, subfolders };
}

/**
 * Flattens a hierarchical folder structure into an array for use in dropdowns
 */
export function flattenFolderHierarchy(folders: TemplateFolder[]) {
  const flattened: {id: number, name: string, path: string}[] = [];
  
  const processFolders = (folders: TemplateFolder[], parentPath = '') => {
    folders.forEach(folder => {
      if (!folder || !folder.id || !folder.name) return;
      
      const fullPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
      flattened.push({
        id: folder.id,
        name: folder.name,
        path: fullPath
      });
      
      if (folder.Folders && folder.Folders.length > 0) {
        processFolders(folder.Folders, fullPath);
      }
    });
  };
  
  processFolders(folders);
  return flattened;
}

/**
 * Extracts placeholders from template content
 */
export function extractPlaceholders(content: string) {
  const placeholderRegex = /\[(.*?)\]/g;
  const matches = [...content.matchAll(placeholderRegex)];

  const uniqueKeys = new Set();
  const placeholders = [];

  for (const match of matches) {
    const placeholder = match[0];

    if (uniqueKeys.has(placeholder)) continue;
    uniqueKeys.add(placeholder);

    placeholders.push({
      key: placeholder,
      value: ""
    });
  }

  return placeholders;
}

/**
 * Highlights placeholders in text for display
 */
export function highlightPlaceholders(content: string) {
  return content.replace(
    /\[(.*?)\]/g,
    `<span class="bg-yellow-300 text-yellow-900 font-bold px-1 rounded">${"$&"}</span>`
  );
}

/**
 * Escapes special RegExp characters in a string
 */
export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}