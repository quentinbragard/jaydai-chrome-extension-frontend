// src/components/TemplatesPanel/useTemplates.ts
import { useState, useEffect } from 'react';
import { Template, TemplateCollection } from './types';
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

  useEffect(() => {
    // Load templates
    const loadTemplates = async () => {
      console.log('Loading templates...');
      try {
        setLoading(true);
        
        // Directly get the templates from the service
        const collection = await templateService.loadTemplates(true); // Force refresh

        console.log('Templates loaded successfully:', collection);
        
        // Explicitly set the template collection
        setTemplateCollection(collection);
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
      setTemplateCollection(updatedCollection);
    });
    
    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

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
    console.log('===========================================================handleUseTemplate', template);
    try {

      
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
            navigator.clipboard.writeText(template.content).then(() => {
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
          p.textContent = template.content;
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
            data: template.content
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
          textarea.value = template.content;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Also try to find the composer area and insert text directly
        const composerArea = document.querySelector('#composer-background');
        if (composerArea) {
          const editorDiv = composerArea.querySelector('[contenteditable="true"]') as HTMLDivElement;
          if (editorDiv) {
            // Insert text
            editorDiv.innerHTML = `<p>${template.content}</p>`;
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
      
      if (onClose) onClose();
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
      setTemplateCollection(updatedCollection);
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
        setTemplateCollection(updatedCollection);
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
    toggleFolder,
    handleUseTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    captureCurrentPromptAsTemplate
  };
}