import { create } from 'zustand';
import { DialogType, DialogProps, DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';

interface DialogStateEntry<T> {
  isOpen: boolean;
  data?: T;
}

type DialogStoreState = {
  [K in DialogType]: DialogStateEntry<DialogProps[K]>;
};

interface DialogStore extends DialogStoreState {
  openDialog: <T extends DialogType>(type: T, data?: DialogProps[T]) => void;
  closeDialog: (type: DialogType) => void;
  closeAllDialogs: () => void;
}

const initialState: DialogStoreState = Object.values(DIALOG_TYPES).reduce((acc, type) => {
  acc[type as DialogType] = { isOpen: false, data: undefined };
  return acc;
}, {} as DialogStoreState);

export const useDialogStore = create<DialogStore>((set) => ({
  ...initialState,

  openDialog: (type, data) =>
    set(() => ({
      [type]: { isOpen: true, data }
    })),

  closeDialog: (type) =>
    set((state) => ({
      [type]: { ...state[type], isOpen: false }
    })),

  closeAllDialogs: () =>
    set((state) => {
      const newState: Partial<DialogStoreState> = {};
      for (const dialogType of Object.values(DIALOG_TYPES)) {
        newState[dialogType as DialogType] = {
          ...state[dialogType as DialogType],
          isOpen: false
        };
      }
      return newState;
    })
}));
