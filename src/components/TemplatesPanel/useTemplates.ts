// src/components/TemplatesPanel/useTemplates.ts
import { useState, useEffect } from 'react';
import { Template, TemplateCollection, TemplateFolder } from './types';
// Import the correct templateService from services directory
import { templateService } from '@/services/TemplateService';

// Default empty template collection structure
const DEFAULT_TEMPLATE_COLLECTION: TemplateCollection = {
  userTemplates: { 
    templates: [], 
    folders: [] 
  },
  officialTemplates: { 
    templates: [], 
    folders: [] 
  }
};

export function useTemplates() {
  const [templateCollection, setTemplateCollection] = useState<TemplateCollection>(DEFAULT_TEMPLATE_COLLECTION);
  const [loading, setLoading] = useState(true);
  // Initialize with empty Set - no folders expanded initially
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set()); 
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    content: '',
    description: '',
    folder: ''
  });
  const [placeholderEditorOpen, setPlaceholderEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    // Load templates
    const loadTemplates = async () => {
      console.log('Loading templates...');
      try {
        setLoading(true);
        
        // Directly get the templates from the service
        const collection = await templateService.loadTemplates(true); // Force refresh

        console.log('Templates loaded successfully:', collection);
        
        // Process templates to properly organize folders
        const processedCollection = {
          userTemplates: {
            templates: collection.userTemplates.templates || [],
            folders: organizeTemplateFolders(collection.userTemplates.templates || [])
          },
          officialTemplates: {
            templates: collection.officialTemplates.templates || [],
            folders: organizeTemplateFolders(collection.officialTemplates.templates || [])
          }
        };
        
        // Explicitly set the template collection
        setTemplateCollection(processedCollection);
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplateCollection(DEFAULT_TEMPLATE_COLLECTION);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
    
    // Set up a listener for template updates
    const unsubscribe = templateService.onTemplatesUpdate((updatedCollection) => {
      console.log('Template update received:', updatedCollection);
      
      // Process templates for proper folder organization
      const processedCollection = {
        userTemplates: {
          templates: updatedCollection.userTemplates.templates || [],
          folders: organizeTemplateFolders(updatedCollection.userTemplates.templates || [])
        },
        officialTemplates: {
          templates: updatedCollection.officialTemplates.templates || [],
          folders: organizeTemplateFolders(updatedCollection.officialTemplates.templates || [])
        }
      };
      
      setTemplateCollection(processedCollection);
    });
    
    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Properly organize templates into folder structures
  const organizeTemplateFolders = (templates: Template[]): TemplateFolder[] => {
    // Map to store folders by their path
    const folderMap: Record<string, TemplateFolder> = {};
    
    // Create root-level folders first
    templates.forEach(template => {
      // Skip templates with no folder
      if (!template.folder) return;
      
      const folderParts = template.folder.split('/');
      let currentPath = '';
      
      // Create each folder in the path
      folderParts.forEach((part, index) => {
        // Build current path
        if (index > 0) {
          currentPath += '/';
        }
        currentPath += part;
        
        // If folder doesn't exist yet, create it
        if (!folderMap[currentPath]) {
          folderMap[currentPath] = {
            path: currentPath,
            name: part,
            templates: [],
            subfolders: []
          };
        }
      });
    });
    
    // Add templates to their appropriate folders
    templates.forEach(template => {
      if (template.folder && folderMap[template.folder]) {
        folderMap[template.folder].templates.push(template);
      }
    });
    
    // Build the folder hierarchy (parent-child relationships)
    Object.keys(folderMap).forEach(path => {
      const lastSlashIndex = path.lastIndexOf('/');
      if (lastSlashIndex > 0) {
        // This folder has a parent
        const parentPath = path.substring(0, lastSlashIndex);
        if (folderMap[parentPath]) {
          // Add this folder as a subfolder of its parent
          folderMap[parentPath].subfolders.push(folderMap[path]);
        }
      }
    });
    
    // Return only root level folders (those without parents)
    return Object.values(folderMap).filter(folder => {
      return !folder.path.includes('/') || folder.path.indexOf('/') === folder.path.lastIndexOf('/');
    });
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleUseTemplate = async (template: Template, onClose?: () => void) => {
    // Set the selected template and open the placeholder editor
    setSelectedTemplate(template);
    setPlaceholderEditorOpen(true);
    
    // Close the templates panel when opening the placeholder editor
    // The actual template insertion will happen after placeholder replacement
  };
  
  const handleFinalizeTemplate = async (finalContent: string) => {
    try {
      console.log('Inserting final template content:', finalContent);
      
      // Method 1: Try clipboard approach
      const insertViaClipboard = () => {
        // Get the editor element
        const editorDiv = document.querySelector('div.ProseMirror[id="prompt-textarea"]');
        
        if (editorDiv) {
          // Focus the editor
          editorDiv.focus();
          
          // Use the Clipboard API to insert text
          const originalClipboard = async () => {
            try {
              return await navigator.clipboard.readText();
            } catch (e) {
              return '';
            }
          };
          
          // Save original clipboard content
          originalClipboard().then(originalText => {
            // Write template content to clipboard
            navigator.clipboard.writeText(finalContent).then(() => {
              // Execute paste command
              document.execCommand('paste');
              
              // Restore original clipboard content
              setTimeout(() => {
                navigator.clipboard.writeText(originalText).catch(e => {
                  console.error('Error restoring clipboard:', e);
                });
              }, 100);
            }).catch(error => {
              console.error('Error writing to clipboard:', error);
              fallbackMethod();
            });
          });
          
          return true;
        }
        return false;
      };
      
      // Method 2: Try programmatic input event
      const fallbackMethod = () => {
        console.log('Using fallback method to insert template content');
        
        // Find the editor element
        const editorDiv = document.querySelector('div.ProseMirror[id="prompt-textarea"]') as HTMLDivElement;
        
        if (editorDiv) {
          // Clear current content if it's a placeholder
          if (editorDiv.querySelector('p.placeholder')) {
            editorDiv.innerHTML = '';
          }
          
          // Create paragraph with template content
          const p = document.createElement('p');
          p.textContent = finalContent;
          editorDiv.appendChild(p);
          
          // Focus and position cursor at the end
          editorDiv.focus();
          
          // Try to position cursor at the end
          const selection = window.getSelection();
          const range = document.createRange();
          
          if (selection) {
            // Find the last text node
            const lastChild = editorDiv.lastChild;
            if (lastChild) {
              range.selectNodeContents(lastChild);
              range.collapse(false); // Collapse to end
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
          
          // Dispatch input event to notify the application of the change
          editorDiv.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: finalContent
          }));
          
          return true;
        }
        
        return false;
      };
      
      // Method 3: Try modifying the internal textarea
      const inputFieldMethod = () => {
        console.log('Using input field method to insert template content');
        
        // Check for any textareas in the vicinity of the editor
        const textAreas = document.querySelectorAll('textarea');
        for (const textarea of textAreas) {
          textarea.value = finalContent;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Also try to find the composer area and insert text directly
        const composerArea = document.querySelector('#composer-background');
        if (composerArea) {
          const editorDiv = composerArea.querySelector('[contenteditable="true"]') as HTMLDivElement;
          if (editorDiv) {
            // Insert text
            editorDiv.innerHTML = `<p>${finalContent}</p>`;
            editorDiv.focus();
            editorDiv.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
        }
        
        return false;
      };
      
      // Try methods in sequence until one works
      if (!insertViaClipboard()) {
        if (!fallbackMethod()) {
          inputFieldMethod();
        }
      }
      
      // Close the template panel if needed
      if (selectedTemplate && onClose) onClose();
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const openEditDialog = (template: Template | null) => {
    if (template) {
      setCurrentTemplate(template);
      setTemplateFormData({
        name: template.title || template.name || '',
        content: template.content,
        description: template.description || '',
        folder: template.folder || ''
      });
    } else {
      setCurrentTemplate(null);
      setTemplateFormData({
        name: '',
        content: '',
        description: '',
        folder: ''
      });
    }
    setEditDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        name: templateFormData.name,
        content: templateFormData.content,
        description: templateFormData.description,
        folder: templateFormData.folder
      };

      if (currentTemplate) {
        // Update existing template
        await templateService.updateTemplate(currentTemplate.id, templateData);
      } else {
        // Create new template
        await templateService.createTemplate(templateData);
      }
      setEditDialogOpen(false);
      
      // Reload templates to reflect changes
      const updatedCollection = await templateService.loadTemplates(true);
      
      // Process templates for proper folder organization
      const processedCollection = {
        userTemplates: {
          templates: updatedCollection.userTemplates.templates || [],
          folders: organizeTemplateFolders(updatedCollection.userTemplates.templates || [])
        },
        officialTemplates: {
          templates: updatedCollection.officialTemplates.templates || [],
          folders: organizeTemplateFolders(updatedCollection.officialTemplates.templates || [])
        }
      };
      
      setTemplateCollection(processedCollection);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${template.title || template.name}"?`)) {
      try {
        await templateService.deleteTemplate(template.id);
        
        // Reload templates to reflect changes
        const updatedCollection = await templateService.loadTemplates(true);
        
        // Process templates for proper folder organization
        const processedCollection = {
          userTemplates: {
            templates: updatedCollection.userTemplates.templates || [],
            folders: organizeTemplateFolders(updatedCollection.userTemplates.templates || [])
          },
          officialTemplates: {
            templates: updatedCollection.officialTemplates.templates || [],
            folders: organizeTemplateFolders(updatedCollection.officialTemplates.templates || [])
          }
        };
        
        setTemplateCollection(processedCollection);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const captureCurrentPromptAsTemplate = () => {
    // Find the ChatGPT input area
    const inputArea = document.querySelector('textarea[data-id="root"]') as HTMLTextAreaElement;
    if (!inputArea || !inputArea.value.trim()) {
      alert('Please type something in the ChatGPT input area first.');
      return;
    }
    
    openEditDialog(null);
    setTemplateFormData(prev => ({
      ...prev,
      content: inputArea.value.trim()
    }));
  };

  return {
    templateCollection,
    loading,
    expandedFolders,
    editDialogOpen,
    setEditDialogOpen,
    currentTemplate,
    templateFormData,
    setTemplateFormData,
    placeholderEditorOpen,
    setPlaceholderEditorOpen,
    selectedTemplate,
    toggleFolder,
    handleUseTemplate,
    handleFinalizeTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    captureCurrentPromptAsTemplate
  };
}