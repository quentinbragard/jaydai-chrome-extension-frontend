import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { QuickBlockSelector } from '@/components/prompts/blocks/quick-selector';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';

export class QuickSelectorManager {
  private root: Root | null = null;
  private container: HTMLDivElement | null = null;
  public isOpen = false;

  open(position: { x: number; y: number }, targetElement: HTMLElement, cursorPosition?: number) {
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
    this.isOpen = true;
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
    this.isOpen = false;
  }
}

