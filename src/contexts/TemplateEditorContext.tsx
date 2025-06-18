// src/contexts/TemplateEditorContext.tsx
import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { PromptMetadata } from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';

// === STATE TYPES ===
interface DialogState {
  isOpen: boolean;
  mode: 'create' | 'customize' | 'edit';
  isSubmitting: boolean;
  isProcessing: boolean;
  error: string | null;
}

interface ContentState {
  content: string;
  finalPromptContent: string;
  hasUnsavedChanges: boolean;
  modifiedBlocks: Record<number, string>;
  activeTab: 'basic' | 'advanced';
}

interface MetadataState {
  metadata: PromptMetadata;
  expandedMetadata: Set<string>;
  metadataCollapsed: boolean;
  secondaryMetadataCollapsed: boolean;
  customValues: Record<string, string>;
}

interface BlockState {
  availableMetadataBlocks: Record<string, Block[]>;
  availableBlocksByType: Record<string, Block[]>;
  blockContentCache: Record<number, string>;
  isLoading: boolean;
}

interface UIState {
  validationErrors: Record<string, string>;
  activeSecondaryMetadata: Set<string>;
}

interface FormState {
  name: string;
  description: string;
  selectedFolderId: string;
}

interface TemplateEditorState {
  dialog: DialogState;
  content: ContentState;
  metadata: MetadataState;
  blocks: BlockState;
  ui: UIState;
  form: FormState;
}

// === ACTION TYPES ===
type TemplateEditorAction = 
  | { type: 'OPEN_DIALOG'; payload: { mode: DialogState['mode']; data?: any } }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_CONTENT'; payload: string }
  | { type: 'UPDATE_FINAL_CONTENT'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: 'basic' | 'advanced' }
  | { type: 'UPDATE_METADATA'; payload: Partial<PromptMetadata> }
  | { type: 'TOGGLE_METADATA_EXPANDED'; payload: string }
  | { type: 'SET_METADATA_COLLAPSED'; payload: boolean }
  | { type: 'UPDATE_BLOCK_CONTENT'; payload: { blockId: number; content: string } }
  | { type: 'SET_BLOCKS_DATA'; payload: Partial<BlockState> }
  | { type: 'UPDATE_FORM'; payload: Partial<FormState> }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string> }
  | { type: 'RESET_STATE' }
  | { type: 'APPLY_FINAL_CHANGES' }
  | { type: 'DISCARD_FINAL_CHANGES' };

// === REDUCER ===
function templateEditorReducer(
  state: TemplateEditorState, 
  action: TemplateEditorAction
): TemplateEditorState {
  switch (action.type) {
    case 'OPEN_DIALOG':
      return {
        ...state,
        dialog: {
          ...state.dialog,
          isOpen: true,
          mode: action.payload.mode,
          error: null
        }
      };

    case 'CLOSE_DIALOG':
      return {
        ...state,
        dialog: {
          ...state.dialog,
          isOpen: false,
          isSubmitting: false,
          error: null
        }
      };

    case 'UPDATE_CONTENT':
      return {
        ...state,
        content: {
          ...state.content,
          content: action.payload,
          hasUnsavedChanges: true
        }
      };

    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        content: {
          ...state.content,
          activeTab: action.payload
        }
      };

    case 'UPDATE_FINAL_CONTENT':
      return {
        ...state,
        content: {
          ...state.content,
          finalPromptContent: action.payload,
          hasUnsavedChanges: true
        }
      };

    case 'UPDATE_METADATA':
      return {
        ...state,
        metadata: {
          ...state.metadata,
          metadata: { ...state.metadata.metadata, ...action.payload }
        }
      };

    case 'UPDATE_BLOCK_CONTENT':
      return {
        ...state,
        content: {
          ...state.content,
          modifiedBlocks: {
            ...state.content.modifiedBlocks,
            [action.payload.blockId]: action.payload.content
          },
          hasUnsavedChanges: true
        }
      };

    case 'UPDATE_FORM':
      return {
        ...state,
        form: {
          ...state.form,
          ...action.payload
        }
      };

    case 'APPLY_FINAL_CHANGES':
      return {
        ...state,
        content: {
          ...state.content,
          content: state.content.finalPromptContent,
          hasUnsavedChanges: false,
          modifiedBlocks: {}
        }
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        ui: {
          ...state.ui,
          validationErrors: action.payload
        }
      };

    // Add other cases...
    default:
      return state;
  }
}

// === INITIAL STATE ===
const initialState: TemplateEditorState = {
  dialog: {
    isOpen: false,
    mode: 'create',
    isSubmitting: false,
    isProcessing: false,
    error: null
  },
  content: {
    content: '',
    finalPromptContent: '',
    hasUnsavedChanges: false,
    modifiedBlocks: {},
    activeTab: 'basic'
  },
  metadata: {
    metadata: {} as PromptMetadata,
    expandedMetadata: new Set(),
    metadataCollapsed: false,
    secondaryMetadataCollapsed: false,
    customValues: {}
  },
  blocks: {
    availableMetadataBlocks: {},
    availableBlocksByType: {},
    blockContentCache: {},
    isLoading: false
  },
  ui: {
    validationErrors: {},
    activeSecondaryMetadata: new Set()
  },
  form: {
    name: '',
    description: '',
    selectedFolderId: ''
  }
};

// === CONTEXT ===
interface TemplateEditorContextValue {
  state: TemplateEditorState;
  dispatch: React.Dispatch<TemplateEditorAction>;
  actions: {
    openDialog: (mode: DialogState['mode'], data?: any) => void;
    closeDialog: () => void;
    updateContent: (content: string) => void;
    updateMetadata: (metadata: Partial<PromptMetadata>) => void;
    updateForm: (payload: Partial<FormState>) => void;
    updateActiveTab: (tab: 'basic' | 'advanced') => void;
    saveTemplate: () => Promise<void>;
    // ... other action creators
  };
  computed: {
    canSave: boolean;
    dialogTitle: string;
    dialogDescription: string;
    hasBlockChanges: boolean;
  };
}

export const TemplateEditorContext = createContext<TemplateEditorContextValue | null>(null);

// === PROVIDER ===
export const TemplateEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(templateEditorReducer, initialState);

  // Tie into global dialog manager
  const createDialog = useDialog(DIALOG_TYPES.CREATE_TEMPLATE);
  const editDialog = useDialog(DIALOG_TYPES.EDIT_TEMPLATE);
  const placeholderDialog = useDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);

  // Sync local state with dialog context
  useEffect(() => {
    if (createDialog.isOpen) {
      dispatch({ type: 'OPEN_DIALOG', payload: { mode: 'create', data: createDialog.data } });
    } else if (editDialog.isOpen) {
      dispatch({ type: 'OPEN_DIALOG', payload: { mode: 'edit', data: editDialog.data } });
    } else if (placeholderDialog.isOpen) {
      dispatch({ type: 'OPEN_DIALOG', payload: { mode: 'customize', data: placeholderDialog.data } });
    } else {
      dispatch({ type: 'CLOSE_DIALOG' });
    }
  }, [createDialog.isOpen, editDialog.isOpen, placeholderDialog.isOpen]);

  // Action creators
  const actions = useMemo(() => ({
    openDialog: (mode: DialogState['mode'], data?: any) => {
      if (mode === 'create') {
        createDialog.open(data);
      } else if (mode === 'edit') {
        editDialog.open(data);
      } else {
        placeholderDialog.open(data);
      }
    },
    closeDialog: () => {
      createDialog.close();
      editDialog.close();
      placeholderDialog.close();
      dispatch({ type: 'CLOSE_DIALOG' });
    },
    updateContent: (content: string) => {
      dispatch({ type: 'UPDATE_CONTENT', payload: content });
    },
    updateMetadata: (metadata: Partial<PromptMetadata>) => {
      dispatch({ type: 'UPDATE_METADATA', payload: metadata });
    },
    updateForm: (payload: Partial<FormState>) => {
      dispatch({ type: 'UPDATE_FORM', payload });
    },
    updateActiveTab: (tab: 'basic' | 'advanced') => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    },
    saveTemplate: async () => {
      dispatch({ type: 'SET_SUBMITTING', payload: true });
      try {
        // Implement save logic
        console.log('Saving template...', state);
        // await templateService.save(state);
        dispatch({ type: 'CLOSE_DIALOG' });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Save failed' });
      } finally {
        dispatch({ type: 'SET_SUBMITTING', payload: false });
      }
    }
  }), [state, createDialog, editDialog, placeholderDialog]);

  // Computed values
  const computed = useMemo(() => ({
    canSave: !state.dialog.isSubmitting && state.form.name.trim() && 
             (state.content.content.trim() || Object.keys(state.content.modifiedBlocks).length > 0),
    dialogTitle: state.dialog.mode === 'create' ? 'Create Template' : 'Customize Template',
    dialogDescription: state.dialog.mode === 'create' ? 'Build your prompt using metadata and content' : 'Customize your prompt template',
    hasBlockChanges: Object.keys(state.content.modifiedBlocks).length > 0
  }), [state]);

  const value: TemplateEditorContextValue = {
    state,
    dispatch,
    actions,
    computed
  };

  return (
    <TemplateEditorContext.Provider value={value}>
      {children}
    </TemplateEditorContext.Provider>
  );
};

// === HOOK ===
export const useTemplateEditor = () => {
  const context = useContext(TemplateEditorContext);
  if (!context) {
    throw new Error('useTemplateEditor must be used within TemplateEditorProvider');
  }
  return context;
};