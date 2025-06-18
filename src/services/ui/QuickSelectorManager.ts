import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { QuickBlockSelector } from '@/components/prompts/blocks/quick-selector';

export class QuickSelectorManager {
  private root: Root | null = null;
  private container: HTMLDivElement | null = null;
  private open = false;
  private inserting = false;

  show(position: { x: number; y: number }, targetElement: HTMLElement, cursorPosition?: number) {
    this.close();

    this.container = document.createElement('div');
    this.container.id = 'jaydai-quick-selector';
    document.body.appendChild(this.container);

    this.root = createRoot(this.container);
    this.root.render(
      React.createElement(QuickBlockSelector, {
        position,
        onClose: () => this.close(),
        targetElement,
        cursorPosition,
        onOpenFullDialog: () => {
          if (window.dialogManager && typeof window.dialogManager.openDialog === 'function') {
            window.dialogManager.openDialog(DIALOG_TYPES.INSERT_BLOCK);
          }
        }
      })
    );
    this.open = true;
  }

  close() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.open = false;
    setTimeout(() => {
      this.inserting = false;
    }, 100);
  }

  get isOpen() {
    return this.open;
  }

  get isInserting() {
    return this.inserting;
  }

  setInserting(value: boolean) {
    this.inserting = value;
  }
}

export const quickSelectorManager = new QuickSelectorManager();
