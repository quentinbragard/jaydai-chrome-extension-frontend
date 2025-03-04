import React, { ComponentType } from 'react';
import { createRoot, Root } from 'react-dom/client';

interface ComponentInstance {
  root: Root;
  containerId: string;
  cleanup: () => void;
}

/**
 * Manages injection and cleanup of React components in the DOM
 */
class ComponentInjector {
  private instances: Map<string, ComponentInstance> = new Map();
  private stylesInjected: boolean = false;

  /**
   * Injects global styles needed by components
   */
  private injectStyles(): void {
    if (this.stylesInjected) return;
    
    try {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = chrome.runtime.getURL('assets/globals.css');
      style.id = 'archimind-styles';
      document.head.appendChild(style);
      
      this.stylesInjected = true;
      console.log('✅ Archimind styles injected');
    } catch (error) {
      console.error('❌ Failed to inject styles:', error);
    }
  }

  /**
   * Creates a container for a component with proper isolation
   */
  private createContainer(id: string, options: InjectOptions): HTMLElement {
    const existingContainer = document.getElementById(id);
    if (existingContainer) return existingContainer;

    const container = document.createElement('div');
    container.id = id;
    
    // Apply positioning styles based on options
    if (options.position) {
      Object.assign(container.style, {
        position: options.position.type || 'fixed',
        zIndex: '999999',
        ...options.position
      });
    }
    
    // Apply any additional styles
    if (options.containerStyle) {
      Object.assign(container.style, options.containerStyle);
    }
    
    // Append to target element or body
    const targetElement = options.targetSelector 
      ? document.querySelector(options.targetSelector) 
      : document.body;
      
    if (!targetElement) {
      console.warn(`Target element not found: ${options.targetSelector}`);
      document.body.appendChild(container);
    } else {
      targetElement.appendChild(container);
    }
    
    return container;
  }

  /**
   * Injects a React component into the DOM
   */
  inject<P extends object>(
    Component: ComponentType<P>,
    props: P,
    options: InjectOptions = {}
  ): string {
    this.injectStyles();
    
    // Create unique ID for this instance
    const id = options.id || `archimind-${Component.displayName || 'component'}-${Date.now()}`;
    const containerId = `${id}-container`;
    
    // Create or get container
    const container = this.createContainer(containerId, options);
    
    // Create React root and render component
    const root = createRoot(container);
    root.render(<Component {...props} />);
    
    // Store instance for later cleanup
    const cleanup = () => {
      try {
        root.unmount();
        container.remove();
        this.instances.delete(id);
        console.log(`✅ Cleaned up component: ${id}`);
      } catch (error) {
        console.error(`❌ Error cleaning up component ${id}:`, error);
      }
    };
    
    this.instances.set(id, { root, containerId, cleanup });
    console.log(`✅ Injected component: ${id}`);
    
    return id;
  }

  /**
   * Removes a specific component instance
   */
  remove(id: string): boolean {
    const instance = this.instances.get(id);
    if (!instance) {
      console.warn(`Component not found: ${id}`);
      return false;
    }
    
    instance.cleanup();
    return true;
  }

  /**
   * Cleans up all injected components
   */
  removeAll(): void {
    this.instances.forEach(instance => instance.cleanup());
    
    // Also remove styles if they were injected
    if (this.stylesInjected) {
      const styleElement = document.getElementById('archimind-styles');
      if (styleElement) styleElement.remove();
      this.stylesInjected = false;
    }
    
    console.log('✅ All components removed');
  }
}

export interface InjectOptions {
  id?: string;
  targetSelector?: string;
  position?: {
    type?: 'fixed' | 'absolute' | 'relative';
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  containerStyle?: Record<string, string>;
}

// Export singleton instance
export const componentInjector = new ComponentInjector();