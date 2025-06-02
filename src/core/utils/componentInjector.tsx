// src/core/utils/componentInjector.ts
import React from 'react';
import ReactDOM from 'react-dom/client';
import { getCurrentTheme } from '@/hooks/useThemeDetector';

// Define a type for position configuration
type PositionConfig = {
  type: 'fixed' | 'absolute' | 'relative' | 'sticky' | 'static';
  zIndex?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};

// Define component injection options
interface InjectionOptions {
  id: string;
  position?: PositionConfig;
  useShadowDom?: boolean;
  preventAutoTheme?: boolean;
}

/**
 * Utility class to inject React components into the page with Shadow DOM support
 * and automatic theme synchronization
 */
class ComponentInjector {
  private roots: Map<string, ReactDOM.Root> = new Map();
  private containers: Map<string, HTMLElement> = new Map();
  private shadowContainers: Map<string, ShadowRoot> = new Map();
  private styleElements: Map<string, HTMLStyleElement> = new Map();
  private themeObservers: Map<string, MutationObserver> = new Map();

  /**
   * Get or create a shadow DOM element in the page
   * @param containerId - The ID for the container element
   * @param position - Optional position configuration
   * @param preventAutoTheme - Whether to disable automatic theme detection
   * @returns The shadow root element
   */
  private getOrCreateShadowRoot(
    containerId: string, 
    position?: PositionConfig,
    preventAutoTheme = false
  ): ShadowRoot {
    // Check if container already exists
    let container = document.getElementById(containerId);
    
    // Create container if it doesn't exist
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      
      // Apply positioning styles
      if (position) {
        container.style.position = position.type;
        
        if (position.zIndex) container.style.zIndex = position.zIndex;
        if (position.top) container.style.top = position.top;
        if (position.right) container.style.right = position.right;
        if (position.bottom) container.style.bottom = position.bottom;
        if (position.left) container.style.left = position.left;
      }
      
      // Add to document
      document.body.appendChild(container);
    }
    
    // Store container reference
    this.containers.set(containerId, container);
    
    // Check if shadow root exists
    let shadowRoot = this.shadowContainers.get(containerId);
    
    // Create shadow root if it doesn't exist
    if (!shadowRoot) {
      shadowRoot = container.attachShadow({ mode: 'open', delegatesFocus: true });
      this.shadowContainers.set(containerId, shadowRoot);
      
      // Create initial style element
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        :host {
          all: initial;
          display: contents;
        }
      `;
      shadowRoot.appendChild(styleEl);
      
      // Try to load content.css
      this.injectStylesheet(shadowRoot, chrome.runtime.getURL('assets/content.css'));
      
      // Set initial theme if auto theme is enabled
      if (!preventAutoTheme) {
        this.syncThemeWithHost(container);
        
        // Set up theme observer to sync theme changes
        this.observeThemeChanges(containerId, container);
      }
    }
    
    return shadowRoot;
  }

  /**
   * Sync the theme of the shadow root with the host document
   * @param container - The shadow host element
   */
  private syncThemeWithHost(container: HTMLElement): void {
    const theme = getCurrentTheme();
    
    // Apply theme to shadow host
    if (theme === 'dark') {
      container.classList.add('dark');
      container.setAttribute('data-theme', 'dark');
    } else {
      container.classList.remove('dark');
      container.setAttribute('data-theme', 'light');
    }
  }

  /**
   * Set up a mutation observer to watch for theme changes in the host document
   * @param id - The component ID
   * @param container - The shadow host element
   */
  private observeThemeChanges(id: string, container: HTMLElement): void {
    // Remove existing observer if any
    const existingObserver = this.themeObservers.get(id);
    if (existingObserver) {
      existingObserver.disconnect();
    }
    
    // Create new observer
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class' || 
            mutation.attributeName === 'data-theme' ||
            mutation.attributeName === 'data-mode' ||
            mutation.attributeName === 'style') {
          // Sync theme when relevant attributes change
          this.syncThemeWithHost(container);
          break;
        }
      }
    });
    
    // Observe both html and body elements for theme changes
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });
    
    // Store reference to observer
    this.themeObservers.set(id, observer);
  }

  /**
   * Inject a stylesheet into a shadow root
   * @param shadowRoot - The shadow root to inject the stylesheet into
   * @param cssUrl - The URL of the CSS file
   */
  private injectStylesheet(shadowRoot: ShadowRoot, cssUrl: string): void {
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = cssUrl;
    shadowRoot.appendChild(linkEl);
    
    // Also add a loading element that will be removed when the CSS loads
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-shadow-dom';
    loadingEl.textContent = 'Loading extension UI...';
    shadowRoot.appendChild(loadingEl);
    
    // Remove loading element when CSS loads
    linkEl.onload = () => {
      shadowRoot.contains(loadingEl) && shadowRoot.removeChild(loadingEl);
    };
    
    // Handle errors
    linkEl.onerror = () => {
      console.error('Failed to load CSS:', cssUrl);
      loadingEl.textContent = 'Error loading UI styles';
    };
  }

  /**
   * Inject a React component into the page
   * @param Component - The React component to inject
   * @param props - Props to pass to the component
   * @param options - Injection options
   */
  public inject<P extends object>(
    Component: React.ComponentType<P>,
    props: P,
    options: InjectionOptions
  ): void {
    const { id, position, useShadowDom = true, preventAutoTheme = false } = options;
    
    try {
      // Remove existing component if any
      this.remove(id);
      
      if (useShadowDom) {
        // Get or create the shadow root
        const shadowRoot = this.getOrCreateShadowRoot(id, position, preventAutoTheme);
        
        // Create a container for the React component inside the shadow root
        const reactContainer = document.createElement('div');
        reactContainer.id = `${id}-react-container`;
        shadowRoot.appendChild(reactContainer);
        
        // Create a React root and render the component
        const root = ReactDOM.createRoot(reactContainer);
        root.render(React.createElement(Component, props));
        
        // Store references
        this.roots.set(id, root);
      } else {
        // For direct injection without Shadow DOM
        let container = document.getElementById(id);
        
        if (!container) {
          container = document.createElement('div');
          container.id = id;
          
          // Apply positioning styles
          if (position) {
            container.style.position = position.type;
            
            if (position.zIndex) container.style.zIndex = position.zIndex;
            if (position.top) container.style.top = position.top;
            if (position.right) container.style.right = position.right;
            if (position.bottom) container.style.bottom = position.bottom;
            if (position.left) container.style.left = position.left;
          }
          
          document.body.appendChild(container);
        }
        
        // Store container reference
        this.containers.set(id, container);
        
        // Create a React root and render the component
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(Component, props));
        
        // Store root reference
        this.roots.set(id, root);
      }
      
      console.log(`Component "${id}" injected successfully`);
    } catch (error) {
      console.error(`Error injecting component "${id}":`, error);
    }
  }

  /**
   * Remove an injected component
   * @param id - The ID of the component to remove
   */
  public remove(id: string): void {
    try {
      // Disconnect theme observer if exists
      const observer = this.themeObservers.get(id);
      if (observer) {
        observer.disconnect();
        this.themeObservers.delete(id);
      }
      
      // Unmount the React root if it exists
      const root = this.roots.get(id);
      if (root) {
        root.unmount();
        this.roots.delete(id);
      }
      
      // Remove the container if it exists
      const container = this.containers.get(id);
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
        this.containers.delete(id);
      }
      
      // Clean up shadow root reference
      this.shadowContainers.delete(id);
      
      console.log(`Component "${id}" removed successfully`);
    } catch (error) {
      console.error(`Error removing component "${id}":`, error);
    }
  }

  /**
   * Remove all injected components
   */
  public removeAll(): void {
    // Get all component IDs
    const ids = [...this.roots.keys()];
    
    // Remove each component
    ids.forEach(id => this.remove(id));
    
    console.log('All components removed successfully');
  }

  /**
   * Get access to the shadow root for a component
   * @param id - The component ID
   * @returns The shadow root or null if not found
   */
  public getShadowRoot(id: string): ShadowRoot | null {
    return this.shadowContainers.get(id) || null;
  }

  /**
   * Add CSS to a specific shadow DOM
   * @param id - The component ID
   * @param css - The CSS content
   */
  public addStyleToShadow(id: string, css: string): void {
    const shadowRoot = this.shadowContainers.get(id);
    if (!shadowRoot) {
      console.error(`Shadow root for "${id}" not found`);
      return;
    }
    
    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    
    // Add to shadow root
    shadowRoot.appendChild(styleElement);
    
    // Store reference
    this.styleElements.set(`${id}-style`, styleElement);
  }
  
  /**
   * Manually update the theme for all shadow hosts
   * Useful for when the theme changes programmatically
   */
  public updateAllThemes(): void {
    // Get all containers
    const containers = Array.from(this.containers.values());
    
    // Update theme for each container
    containers.forEach(container => {
      this.syncThemeWithHost(container);
    });
  }
}

// Export a singleton instance
export const componentInjector = new ComponentInjector();

// For hook usage
/**
 * Improved hook to access the shadow root from React components
 * This version uses multiple strategies to find the shadow root
 */
export function useShadowRoot(): ShadowRoot | null {
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null);
  
  React.useEffect(() => {
    // Try multiple strategies to find the shadow root
    const findShadowRoot = (): ShadowRoot | null => {
      // Strategy 1: Check for jaydai-root element
      const mainRoot = document.getElementById('jaydai-root');
      if (mainRoot?.shadowRoot) {
        return mainRoot.shadowRoot;
      }
      
      // Strategy 2: Try alternate element IDs we might be using
      const alternateIds = ['jaydai-main-component', 'jaydai-shadow-container'];
      for (const id of alternateIds) {
        const el = document.getElementById(id);
        if (el?.shadowRoot) {
          return el.shadowRoot;
        }
      }
      
      // Strategy 3: Check if we're already inside a shadow root
      if (document.head?.getRootNode() instanceof ShadowRoot) {
        return document.head.getRootNode() as ShadowRoot;
      }
      
      // Strategy 4: Search through componentInjector's internal map
      // This leverages our singleton componentInjector instance
      const shadowRoots = Array.from(componentInjector['shadowContainers'].values());
      if (shadowRoots.length > 0) {
        return shadowRoots[0];
      }
      
      // Strategy 5: Last resort - search ALL elements for a shadow root
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        if (el.shadowRoot) {
          return el.shadowRoot;
        }
      }
      
      return null;
    };
    
    // Try to find the shadow root
    const root = findShadowRoot();
    if (root) {
      setShadowRoot(root);
    } else {
      // Set up a retry mechanism
      const retryTimeout = setTimeout(() => {
        const retryRoot = findShadowRoot();
        if (retryRoot) {
          setShadowRoot(retryRoot);
        } else {
          console.error('Shadow root not found after retry, dialogs may not work correctly');
        }
      }, 500);
      
      return () => clearTimeout(retryTimeout);
    }
  }, []);
  
  return shadowRoot;
}

/**
 * Synchronous utility to find the shadow root
 * For non-React contexts where hooks can't be used
 */
export function findShadowRootSync(): ShadowRoot | null {
  // Check for jaydai-root element
  const mainRoot = document.getElementById('jaydai-root');
  if (mainRoot?.shadowRoot) {
    return mainRoot.shadowRoot;
  }
  
  // Try alternate IDs
  const alternateIds = ['jaydai-main-component', 'jaydai-shadow-container'];
  for (const id of alternateIds) {
    const el = document.getElementById(id);
    if (el?.shadowRoot) {
      return el.shadowRoot;
    }
  }
  
  // Check componentInjector's internal map
  const shadowRoots = Array.from(componentInjector['shadowContainers'].values());
  if (shadowRoots.length > 0) {
    return shadowRoots[0];
  }
  
  // Last resort - search all elements
  const allElements = document.querySelectorAll('*');
  for (const el of allElements) {
    if (el.shadowRoot) {
      return el.shadowRoot;
    }
  }
  
  return null;
}

export default componentInjector;