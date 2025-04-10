// src/core/utils/componentInjector.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

interface InjectionOptions {
  id: string;
  position?: {
    type: 'fixed' | 'absolute' | 'relative';
    zIndex?: string;
  };
  shadowDOM?: boolean; // New option to enable Shadow DOM
}

// Global reference to shadow root for portal targeting
let shadowRootRef: ShadowRoot | null = null;

// Function to get the shadow root for portals
export const getShadowRootRef = (): ShadowRoot | null => shadowRootRef;

export const componentInjector = {
  inject: (Component: React.ComponentType<any>, props: any = {}, options: InjectionOptions) => {
    const { id, position, shadowDOM = true } = options;
    
    // Create container element
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      document.body.appendChild(container);
    }
    
    // Apply positioning if specified
    if (position) {
      container.style.position = position.type;
      if (position.zIndex) {
        container.style.zIndex = position.zIndex;
      }
    }
    
    if (shadowDOM) {
      // Create shadow root if it doesn't exist
      if (!container.shadowRoot) {
        shadowRootRef = container.attachShadow({ mode: 'open' });
        
        // Create a root div inside shadow DOM
        const shadowContainer = document.createElement('div');
        shadowContainer.id = 'jaydai-shadow-container';
        shadowRootRef.appendChild(shadowContainer);
        
        // Inject styles into shadow DOM
        const styleElement = document.createElement('style');
        styleElement.textContent = '/* Shadow DOM styles will be injected here */';
        shadowRootRef.prepend(styleElement);
        
        // Dynamically load the CSS
        fetch(chrome.runtime.getURL('assets/content.css'))
          .then(response => response.text())
          .then(css => {
            styleElement.textContent = css;
          })
          .catch(error => console.error('Failed to load CSS:', error));
        
        // Create React root
        const root = ReactDOM.createRoot(shadowContainer);
        
        // Wrap component in a provider that will make shadow root available for portals
        root.render(
          <ShadowDOMProvider shadowRoot={shadowRootRef}>
            <Component {...props} />
          </ShadowDOMProvider>
        );
      }
    } else {
      // Fall back to standard injection without shadow DOM
      const root = ReactDOM.createRoot(container);
      root.render(<Component {...props} />);
    }
  },
  
  removeAll: () => {
    // Clean up code...
    shadowRootRef = null;
  }
};

// Context to provide the shadow root reference
const ShadowRootContext = React.createContext<ShadowRoot | null>(null);

export const useShadowRoot = () => React.useContext(ShadowRootContext);

// Provider component
const ShadowDOMProvider: React.FC<{
  children: React.ReactNode;
  shadowRoot: ShadowRoot;
}> = ({ children, shadowRoot }) => {
  return (
    <ShadowRootContext.Provider value={shadowRoot}>
      {children}
    </ShadowRootContext.Provider>
  );
};