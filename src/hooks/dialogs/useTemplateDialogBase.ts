
// src/hooks/dialogs/useTemplateDialogBase.ts - Simplified Version
import { useState, useEffect, useCallback } from 'react';
import { 
  PromptMetadata, 
  DEFAULT_METADATA,
  MetadataType,
  SingleMetadataType,
  MultipleMetadataType,
  PRIMARY_METADATA
} from '@/types/prompts/metadata';
import { getMessage } from '@/core/utils/i18n';
import {
  createMetadata,
  updateSingleMetadata,
  updateCustomValue,
  addMetadataItem,
  removeMetadataItem,
  updateMetadataItem,
  reorderMetadataItems,
  addSecondaryMetadata,
  removeSecondaryMetadata,
  getActiveSecondaryMetadata,
  getFilledMetadataTypes,
  extractCustomValues,
  validateMetadata,
  parseTemplateMetadata,  
} from '@/utils/prompts/metadataUtils';

export interface TemplateDialogConfig {
  dialogType: 'create' | 'customize';
  initialData?: any;
  onComplete: (content: string, metadata: PromptMetadata) => Promise<boolean> | boolean;
  onClose: () => void;
}

export interface TemplateDialogState {
  // Basic form state
  name: string;
  description: string;
  content: string;
  selectedFolderId: string;
  
  // Metadata state
  metadata: PromptMetadata;
  
  // UI state
  activeTab: 'basic' | 'advanced';
  expandedMetadata: Set<MetadataType>;
  metadataCollapsed: boolean;
  secondaryMetadataCollapsed: boolean;
  
  // Status state
  isProcessing: boolean;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
}

export interface TemplateDialogActions {
  // Basic form actions
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setContent: (content: string) => void;
  setSelectedFolderId: (folderId: string) => void;
  
  // Metadata actions
  updateSingleMetadataValue: (type: SingleMetadataType, blockId: string) => void;
  updateCustomMetadataValue: (type: SingleMetadataType, value: string) => void;
  addMultipleMetadataItem: (type: MultipleMetadataType) => void;
  removeMultipleMetadataItem: (type: MultipleMetadataType, itemId: string) => void;
  updateMultipleMetadataItem: (type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => void;
  reorderMultipleMetadataItems: (type: MultipleMetadataType, newItems: MetadataItem[]) => void;
  addSecondaryMetadataType: (type: MetadataType) => void;
  removeSecondaryMetadataType: (type: MetadataType) => void;

  // Direct metadata setter
  setMetadata: (updater: (metadata: PromptMetadata) => PromptMetadata) => void;
  
  // UI actions
  setActiveTab: (tab: 'basic' | 'advanced') => void;
  toggleExpandedMetadata: (type: MetadataType) => void;
  setMetadataCollapsed: (collapsed: boolean) => void;
  setSecondaryMetadataCollapsed: (collapsed: boolean) => void;
  
  // Form actions
  handleComplete: () => Promise<void>;
  handleClose: () => void;
  validateForm: () => boolean;
}

export function useTemplateDialogBase(config: TemplateDialogConfig) {
  const { dialogType, initialData, onComplete, onClose } = config;
  
  // ============================================================================
  // STATE MANAGEMENT - SIMPLIFIED
  // ============================================================================
  
  const [state, setState] = useState<TemplateDialogState>({
    // Basic form state
    name: '',
    description: '',
    content: '',
    selectedFolderId: '',
    
    // Metadata state
    metadata: createMetadata(),
    
    // UI state
    activeTab: 'basic',
    expandedMetadata: new Set(PRIMARY_METADATA),
    metadataCollapsed: false,
    secondaryMetadataCollapsed: false,
    
    // Status state
    isProcessing: false,
    isSubmitting: false,
    error: null,
    validationErrors: {}
  });
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const activeSecondaryMetadata = getActiveSecondaryMetadata(state.metadata);
  const customValues = extractCustomValues(state.metadata);
  
  // ============================================================================
  // FORM ACTIONS
  // ============================================================================
  
  const setName = useCallback((name: string) => {
    setState(prev => ({ ...prev, name }));
  }, []);
  
  const setDescription = useCallback((description: string) => {
    setState(prev => ({ ...prev, description }));
  }, []);
  
  const setContent = useCallback((content: string) => {
    setState(prev => ({ ...prev, content }));
  }, []);
  
  const setSelectedFolderId = useCallback((selectedFolderId: string) => {
    setState(prev => ({ ...prev, selectedFolderId }));
  }, []);
  
  // ============================================================================
  // METADATA ACTIONS
  // ============================================================================
  
  const updateSingleMetadataValue = useCallback((type: SingleMetadataType, value: string) => {
    const numericValue = parseInt(value, 10);
    const blockId = isNaN(numericValue) ? 0 : numericValue;
    
    setState(prev => ({
      ...prev,
      metadata: updateSingleMetadata(prev.metadata, type, blockId)
    }));
  }, []);
  
  const updateCustomMetadataValue = useCallback((type: SingleMetadataType, value: string) => {
    setState(prev => ({
      ...prev,
      metadata: updateCustomValue(prev.metadata, type, value)
    }));
  }, []);
  
  const addMultipleMetadataItem = useCallback((type: MultipleMetadataType) => {
    setState(prev => ({
      ...prev,
      metadata: addMetadataItem(prev.metadata, type)
    }));
  }, []);
  
  const removeMultipleMetadataItem = useCallback((type: MultipleMetadataType, itemId: string) => {
    setState(prev => ({
      ...prev,
      metadata: removeMetadataItem(prev.metadata, type, itemId)
    }));
  }, []);
  
  const updateMultipleMetadataItem = useCallback((type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => {
    setState(prev => ({
      ...prev,
      metadata: updateMetadataItem(prev.metadata, type, itemId, updates)
    }));
  }, []);
  
  const reorderMultipleMetadataItems = useCallback((type: MultipleMetadataType, newItems: MetadataItem[]) => {
    setState(prev => ({
      ...prev,
      metadata: reorderMetadataItems(prev.metadata, type, newItems)
    }));
  }, []);
  
  const addSecondaryMetadataType = useCallback((type: MetadataType) => {
    setState(prev => ({
      ...prev,
      metadata: addSecondaryMetadata(prev.metadata, type),
      expandedMetadata: new Set(prev.expandedMetadata).add(type)
    }));
  }, []);

  const removeSecondaryMetadataType = useCallback((type: MetadataType) => {
    setState(prev => ({
      ...prev,
      metadata: removeSecondaryMetadata(prev.metadata, type),
      expandedMetadata: (() => { const s = new Set(prev.expandedMetadata); s.delete(type); return s; })()
    }));
  }, []);

  const setMetadata = useCallback(
    (updater: (metadata: PromptMetadata) => PromptMetadata) => {
      setState(prev => ({ ...prev, metadata: updater(prev.metadata) }));
    },
    []
  );
  
  // ============================================================================
  // UI ACTIONS
  // ============================================================================
  
  const setActiveTab = useCallback((activeTab: 'basic' | 'advanced') => {
    setState(prev => ({ ...prev, activeTab }));
  }, []);

  const toggleExpandedMetadata = useCallback((type: MetadataType) => {
    setState(prev => {
      const newSet = new Set(prev.expandedMetadata);
      if (newSet.has(type)) newSet.delete(type); else newSet.add(type);
      return { ...prev, expandedMetadata: newSet };
    });
  }, []);
  
  const setMetadataCollapsed = useCallback((metadataCollapsed: boolean) => {
    setState(prev => ({ ...prev, metadataCollapsed }));
  }, []);
  
  const setSecondaryMetadataCollapsed = useCallback((secondaryMetadataCollapsed: boolean) => {
    setState(prev => ({ ...prev, secondaryMetadataCollapsed }));
  }, []);
  
  // ============================================================================
  // FORM VALIDATION - SIMPLIFIED
  // ============================================================================
  
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    // Basic validation
    if (dialogType === 'create' && !state.name.trim()) {
      errors.name = getMessage('templateNameRequired', undefined, 'Template name is required');
    }
    
    
    // Only require metadata validation when creating or editing templates.
    // In customize mode we allow incomplete metadata so users can quickly
    // insert a prompt even if some fields are missing.
    if (state.activeTab === 'advanced' && dialogType !== 'customize') {
      const metadataValidation = validateMetadata(state.metadata);
      if (!metadataValidation.isValid) {
        errors.content = metadataValidation.errors.join(', ');
      }
    }
    
    setState(prev => ({ ...prev, validationErrors: errors }));
    return Object.keys(errors).length === 0;
  }, [dialogType, state.name, state.content, state.activeTab, state.metadata]);
  
  // ============================================================================
  // FORM SUBMISSION - SIMPLIFIED
  // ============================================================================
  
  const handleComplete = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));
    
    try {
      // Simple: just pass content and metadata
      const success = await onComplete(state.content, state.metadata);
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error completing template dialog:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [validateForm, onComplete, onClose, state.content, state.metadata]);
  
  const handleClose = useCallback(() => {
    setState({
      name: '',
      description: '',
      content: '',
      selectedFolderId: '',
      metadata: createMetadata(),
      activeTab: 'basic',
      expandedMetadata: new Set(PRIMARY_METADATA),
      metadataCollapsed: false,
      secondaryMetadataCollapsed: false,
      isProcessing: false,
      isSubmitting: false,
      error: null,
      validationErrors: {}
    });
    onClose();
  }, [onClose]);
  
  // ============================================================================
  // INITIALIZATION - SIMPLIFIED
  // ============================================================================
  
  useEffect(() => {
    if (initialData) {
      console.log('Initializing dialog with data:', initialData);
      
      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null
      }));
      
      try {
        if (dialogType === 'create') {
          const meta = initialData.template?.metadata 
            ? parseTemplateMetadata(initialData.template.metadata)
            : createMetadata();
          const content = getLocalizedContent(initialData.template?.content || '');
          
          setState(prev => ({
            ...prev,
            name: initialData.template?.title || '',
            description: initialData.template?.description || '',
            content,
            selectedFolderId: initialData.selectedFolder?.id?.toString() || '',
            metadata: meta,
            expandedMetadata: new Set([
              ...PRIMARY_METADATA,
              ...Array.from(getFilledMetadataTypes(meta))
            ]),
            isProcessing: false
          }));
        } else if (dialogType === 'customize') {
          // Enhanced customize mode initialization
          const meta = initialData.metadata 
            ? (typeof initialData.metadata === 'object' && initialData.metadata.role !== undefined
                ? initialData.metadata // Already parsed
                : parseTemplateMetadata(initialData.metadata))
            : createMetadata();
            
          const content = getLocalizedContent(initialData.content || '');
  
          console.log('Customize mode - parsed metadata:', meta);
          console.log('Customize mode - filled types:', Array.from(getFilledMetadataTypes(meta)));
  
          setState(prev => ({
            ...prev,
            content,
            metadata: meta,
            // Expand all filled metadata types so user can see what's selected
            expandedMetadata: new Set([
              ...PRIMARY_METADATA,
              ...Array.from(getFilledMetadataTypes(meta))
            ]),
            // Keep primary metadata visible, but collapse secondary if there are many
            metadataCollapsed: false,
            secondaryMetadataCollapsed: Array.from(getActiveSecondaryMetadata(meta)).length > 2,
            isProcessing: false
          }));
        }
        
      } catch (error) {
        console.error('Error initializing template dialog:', error);
        setState(prev => ({
          ...prev,
          error: getMessage('errorProcessingTemplate', undefined, 'Error processing template'),
          isProcessing: false
        }));
      }
    }
  }, [initialData, dialogType]);
  
  // ============================================================================
  // RETURN API - SIMPLIFIED
  // ============================================================================
  
  const actions: TemplateDialogActions = {
    // Form actions
    setName,
    setDescription,
    setContent,
    setSelectedFolderId,
    
    // Metadata actions
    updateSingleMetadataValue,
    updateCustomMetadataValue,
    addMultipleMetadataItem,
    removeMultipleMetadataItem,
    updateMultipleMetadataItem,
    reorderMultipleMetadataItems,
    addSecondaryMetadataType,
    removeSecondaryMetadataType,
    setMetadata,
    
    // UI actions
    setActiveTab,
    toggleExpandedMetadata,
    setMetadataCollapsed,
    setSecondaryMetadataCollapsed,
    
    // Form actions
    handleComplete,
    handleClose,
    validateForm
  };
  
  return {
    // State
    ...state,
    
    // Computed values
    activeSecondaryMetadata,
    customValues,
    
    // Actions
    ...actions
  };
}

// Helper function (if not already available)
function getLocalizedContent(content: any): string {
  if (typeof content === 'string') return content;
  if (content && typeof content === 'object') {
    return content.en || Object.values(content)[0] || '';
  }
  return '';
}