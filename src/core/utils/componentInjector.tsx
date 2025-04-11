// src/core/utils/componentInjector.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

interface InjectionOptions {
  id: string;
  position?: {
    type: 'fixed' | 'absolute' | 'relative';
    zIndex?: string;
  };
  shadowDOM?: boolean; // Option to enable Shadow DOM
}

// Global reference to shadow root for portal targeting
let shadowRootRef: ShadowRoot | null = null;

// Function to get the shadow root for portals
export const useShadowRoot = (): ShadowRoot | null => {
  return React.useContext(ShadowRootContext);
};

// Context to provide the shadow root reference
const ShadowRootContext = React.createContext<ShadowRoot | null>(null);

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
    // Clean up all added elements
    const shadowContainers = document.querySelectorAll('[id^="jaydai-"]');
    shadowContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
    shadowRootRef = null;
  }
};

// Provider component that also handles theme syncing
const ShadowDOMProvider: React.FC<{
  children: React.ReactNode;
  shadowRoot: ShadowRoot;
}> = ({ children, shadowRoot }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Initial theme detection
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    // Apply the theme class to the shadow container
    const container = shadowRoot.getElementById('jaydai-shadow-container');
    if (container) {
      if (theme === 'dark') {
        container.classList.add('dark');
      } else {
        container.classList.remove('dark');
      }
    }

    // Set up a mutation observer to watch for theme changes in the parent document
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          const isDark = document.documentElement.classList.contains('dark');
          setTheme(isDark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, [shadowRoot, theme]);

  return (
    <ShadowRootContext.Provider value={shadowRoot}>
      {children}
    </ShadowRootContext.Provider>
  );
};