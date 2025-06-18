// src/hooks/dialogs/useTemplateDialogBase.ts - Fixed Version
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  PromptMetadata, 
  DEFAULT_METADATA,
  MetadataType,
  SingleMetadataType,
  MultipleMetadataType,
  MetadataItem,
  isMultipleMetadataType,
  PRIMARY_METADATA
} from '@/types/prompts/metadata';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
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
  extractCustomValues,
  validateMetadata
} from '@/utils/prompts/metadataUtils';

export interface TemplateDialogConfig {
  dialogType: 'create' | 'customize';
  initialData?: any;
  onComplete: (content: string, metadata: PromptMetadata, finalContent?: string) => Promise<boolean> | boolean;
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
  
  // Final content state
  finalPromptContent: string;
  hasUnsavedFinalChanges: boolean;
  modifiedBlocks: Record<number, string>;
  
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
  
  // Final content management
  setFinalPromptContent: (content: string, markAsChanged?: boolean) => void;
  applyFinalContentChanges: () => void;
  discardFinalContentChanges: () => void;
  updateBlockContent: (blockId: number, newContent: string) => void;
  
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
  
  // **FIX: Track baseline content to detect real changes**
  const baselineContentRef = useRef<string>('');
  const isInitializingRef = useRef(true);
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [state, setState] = useState<TemplateDialogState>({
    // Basic form state
    name: '',
    description: '',
    content: '',
    selectedFolderId: '',
    
    // Metadata state
    metadata: createMetadata(),
    
    // Final content state
    finalPromptContent: '',
    hasUnsavedFinalChanges: false,
    modifiedBlocks: {},
    
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
  // FINAL CONTENT MANAGEMENT - FIXED
  // ============================================================================
  
  const setFinalPromptContent = useCallback((content: string, markAsChanged: boolean = true) => {
    console.log('setFinalPromptContent called:', { 
      content: content.substring(0, 50) + '...', 
      markAsChanged, 
      isInitializing: isInitializingRef.current,
      baseline: baselineContentRef.current.substring(0, 50) + '...'
    });
    
    setState(prev => {
      // **FIX: Only mark as changed if we're not initializing and content actually differs**
      const shouldMarkAsChanged = markAsChanged && 
        !isInitializingRef.current && 
        content !== baselineContentRef.current;
      
      console.log('setFinalPromptContent decision:', { shouldMarkAsChanged });
      
      return {
        ...prev,
        finalPromptContent: content,
        hasUnsavedFinalChanges: shouldMarkAsChanged ? true : prev.hasUnsavedFinalChanges
      };
    });
  }, []);

  const updateBlockContent = useCallback((blockId: number, newContent: string) => {
    console.log('updateBlockContent called:', { blockId, newContent: newContent.substring(0, 50) + '...' });
    
    setState(prev => ({
      ...prev,
      modifiedBlocks: {
        ...prev.modifiedBlocks,
        [blockId]: newContent
      },
      hasUnsavedFinalChanges: !isInitializingRef.current
    }));
  }, []);

  const applyFinalContentChanges = useCallback(() => {
    console.log('applyFinalContentChanges called');
    
    // For customize dialog, just update the content
    if (dialogType === 'customize') {
      setState(prev => ({
        ...prev,
        content: prev.finalPromptContent,
        hasUnsavedFinalChanges: false
      }));
      // **FIX: Update baseline to new content**
      baselineContentRef.current = state.finalPromptContent;
      return;
    }

    // For create dialog, the modifications will be handled during save
    setState(prev => ({
      ...prev,
      hasUnsavedFinalChanges: false
    }));
    baselineContentRef.current = state.finalPromptContent;
  }, [dialogType, state.finalPromptContent]);

  const discardFinalContentChanges = useCallback(() => {
    console.log('discardFinalContentChanges called');
    
    setState(prev => ({
      ...prev,
      finalPromptContent: baselineContentRef.current,
      hasUnsavedFinalChanges: false,
      modifiedBlocks: {}
    }));
  }, []);
  
  // ============================================================================
  // FORM ACTIONS (keeping existing implementations)
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
  // METADATA ACTIONS (keeping existing implementations)
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
  // UI ACTIONS (keeping existing implementations)
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
  // FORM VALIDATION (updated to consider final content)
  // ============================================================================
  
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    // Basic validation
    if (dialogType === 'create' && !state.name.trim()) {
      errors.name = getMessage('templateNameRequired', undefined, 'Template name is required');
    }
    
    // Check final content instead of just content
    const contentToValidate = state.finalPromptContent || state.content;
    if (!contentToValidate.trim()) {
      errors.content = getMessage('templateContentRequired', undefined, 'Template content is required');
    }
    
    if (state.activeTab === 'advanced') {
      const metadataValidation = validateMetadata(state.metadata);
      if (!metadataValidation.isValid) {
        errors.content = metadataValidation.errors.join(', ');
      }
    }
    
    setState(prev => ({ ...prev, validationErrors: errors }));
    return Object.keys(errors).length === 0;
  }, [dialogType, state.name, state.content, state.finalPromptContent, state.activeTab, state.metadata]);
  
  // ============================================================================
  // FORM SUBMISSION (updated to handle final content and block modifications)
  // ============================================================================
  
  const handleComplete = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));
    
    try {
      // Use final content if available, otherwise use base content
      const contentToSave = state.finalPromptContent || state.content;
      
      const success = await onComplete(
        contentToSave, 
        state.metadata, 
        state.finalPromptContent
      );
      
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
  }, [validateForm, onComplete, onClose, state.content, state.metadata, state.finalPromptContent]);
  
  const handleClose = useCallback(() => {
    // **FIX: Reset initialization flag**
    isInitializingRef.current = true;
    baselineContentRef.current = '';
    
    setState({
      name: '',
      description: '',
      content: '',
      selectedFolderId: '',
      metadata: createMetadata(),
      finalPromptContent: '',
      hasUnsavedFinalChanges: false,
      modifiedBlocks: {},
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
  // INITIALIZATION - FIXED
  // ============================================================================
  
  useEffect(() => {
    if (initialData) {
      console.log('Initializing dialog with data:', initialData);
      isInitializingRef.current = true;
      
      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null
      }));
      
      try {
        // Initialize form data
        if (dialogType === 'create') {
          const meta = initialData.template?.metadata || createMetadata();
          const content = getLocalizedContent(initialData.template?.content || '');
          
          // **FIX: Set baseline content before setting final content**
          baselineContentRef.current = content;
          
          setState(prev => ({
            ...prev,
            name: initialData.template?.title || '',
            description: initialData.template?.description || '',
            content,
            selectedFolderId: initialData.selectedFolder?.id?.toString() || '',
            metadata: meta,
            finalPromptContent: content,
            hasUnsavedFinalChanges: false, // **FIX: Explicitly set to false**
            expandedMetadata: new Set([
              ...PRIMARY_METADATA,
              ...Array.from(getActiveSecondaryMetadata(meta))
            ]),
            isProcessing: false
          }));
        } else if (dialogType === 'customize') {
          const meta = initialData.metadata || createMetadata();
          const content = getLocalizedContent(initialData.content || '');
          
          // **FIX: Set baseline content before setting final content**
          baselineContentRef.current = content;
          
          setState(prev => ({
            ...prev,
            content,
            metadata: meta,
            finalPromptContent: content,
            hasUnsavedFinalChanges: false, // **FIX: Explicitly set to false**
            expandedMetadata: new Set([
              ...PRIMARY_METADATA,
              ...Array.from(getActiveSecondaryMetadata(meta))
            ]),
            isProcessing: false
          }));
        }
        
        // **FIX: Mark initialization as complete after a short delay**
        setTimeout(() => {
          isInitializingRef.current = false;
          console.log('Dialog initialization complete');
        }, 100);
        
      } catch (error) {
        console.error('Error initializing template dialog:', error);
        setState(prev => ({
          ...prev,
          error: getMessage('errorProcessingTemplate', undefined, 'Error processing template'),
          isProcessing: false
        }));
        isInitializingRef.current = false;
      }
    }
  }, [initialData, dialogType]);
  
  // ============================================================================
  // RETURN API
  // ============================================================================
  
  const actions: TemplateDialogActions = {
    // Form actions
    setName,
    setDescription,
    setContent,
    setSelectedFolderId,
    
    // Final content actions
    setFinalPromptContent,
    applyFinalContentChanges,
    discardFinalContentChanges,
    updateBlockContent,
    
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