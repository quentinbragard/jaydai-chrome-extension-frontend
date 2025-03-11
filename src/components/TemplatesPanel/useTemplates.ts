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
  
  // Modified handleFinalizeTemplate function with more robust content insertion

const handleFinalizeTemplate = async (finalContent: string, closeCallback?: () => void) => {
  try {
    console.log('Inserting final template content:', finalContent);
    
    // Method 1: Enhanced DOM insertion approach
    const directInsertContent = () => {
      // Find all possible editor elements
      const editorDiv = document.querySelector('div.ProseMirror[id="prompt-textarea"]') as HTMLDivElement;
      console.log('Found editor div:', editorDiv);
      
      if (!editorDiv) {
        console.log('Editor div not found, trying alternative selectors');
        return false;
      }
      
      // Focus the editor
      editorDiv.focus();
      
      // Method 1.1: ProseMirror-specific approach
      try {
        console.log('Trying ProseMirror approach');
        
        // Clear existing content
        if (editorDiv.textContent === '') {
          // Create a paragraph to start with if empty
          const p = document.createElement('p');
          editorDiv.appendChild(p);
        }
        
        // Replace all content
        editorDiv.innerHTML = `<p>${finalContent.replace(/\n/g, '</p><p>')}</p>`;
        
        // Trigger input events
        editorDiv.dispatchEvent(new InputEvent('input', { bubbles: true }));
        editorDiv.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('Content inserted via direct HTML replacement');
        return true;
      } catch (proseMirrorError) {
        console.error('Error with ProseMirror approach:', proseMirrorError);
      }
      return false;
    };
    
    // Method 2: Enhanced textarea approach
    const textareaMethod = () => {
      console.log('Trying textarea approach');
      
      // Find all potential textareas, prioritizing visible ones
      const textareas = Array.from(document.querySelectorAll('textarea'));
      console.log('Found textareas:', textareas.length);
      
      // First try textareas with specific IDs/attributes
      const priorityTextareas = textareas.filter(ta => 
        ta.id === 'prompt-textarea' || 
        ta.getAttribute('data-id') === 'root' ||
        ta.placeholder?.includes('Send a message')
      );
      
      const potentialTextareas = [...priorityTextareas, ...textareas];
      
      for (const textarea of potentialTextareas) {
        try {
          console.log('Trying textarea:', textarea);
          
          // Store original value
          const originalValue = textarea.value;
          
          // Set new value
          textarea.value = finalContent;
          
          // Trigger input events
          textarea.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Focus textarea
          textarea.focus();
          
          // Set selection range to end
          textarea.setSelectionRange(finalContent.length, finalContent.length);
          
          // Verify change was successful
          if (textarea.value === finalContent) {
            console.log('Content inserted via textarea');
            return true;
          } else {
            // Restore original value if unsuccessful
            textarea.value = originalValue;
          }
        } catch (error) {
          console.error('Error with textarea:', error);
        }
      }
      
      return false;
    };
    
    // Method 3: Find any contenteditable element
    const contentEditableMethod = () => {
      console.log('Trying contenteditable approach');
      
      // Find all contenteditable elements
      const editables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
      console.log('Found contenteditable elements:', editables.length);
      
      for (const editable of editables) {
        try {
          console.log('Trying contenteditable:', editable);
          
          // Set content
          editable.innerHTML = finalContent.split('\n').map(line => `<p>${line}</p>`).join('');
          
          // Trigger input events
          editable.dispatchEvent(new InputEvent('input', { bubbles: true }));
          editable.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Focus element
          editable.focus();
          
          console.log('Content inserted via contenteditable');
          return true;
        } catch (error) {
          console.error('Error with contenteditable:', error);
        }
      }
      
      return false;
    };
    
    // Method 4: Clipboard fallback approach
    const clipboardFallback = async () => {
      console.log('Trying clipboard fallback approach');
      
      try {
        // Store original clipboard content
        let originalText = '';
        try {
          originalText = await navigator.clipboard.readText();
        } catch (e) {
          console.log('Could not read original clipboard content');
        }
        
        // Write to clipboard
        await navigator.clipboard.writeText(finalContent);
        
        // Alert user to paste manually
        alert('The template has been copied to your clipboard. Please press Ctrl+V or Cmd+V to paste it into the chat input.');
        
        // Attempt to restore original clipboard after a delay
        setTimeout(async () => {
          try {
            await navigator.clipboard.writeText(originalText);
          } catch (e) {
            console.error('Could not restore clipboard:', e);
          }
        }, 10000); // 10 second delay
        
        return true;
      } catch (error) {
        console.error('Error with clipboard fallback:', error);
        return false;
      }
    };
    
    // Try each method in sequence until one works
    console.log('Starting insertion attempts...');
    const success = await (async () => {
      // Try more direct approaches first
      return directInsertContent() || 
             textareaMethod() || 
             contentEditableMethod() || 
             await clipboardFallback();
    })();
    
    if (success) {
      console.log('Successfully inserted template content');
    } else {
      console.warn('All insertion methods failed');
    }
    
    // Use the callback to close panel if provided
    if (closeCallback) {
      console.log('Calling close callback');
      closeCallback();
    }
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