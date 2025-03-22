// src/core/contexts/PanelNavigationContext.tsx

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define panel types for the application
export type PanelType = 
  | 'menu'
  | 'templates'
  | 'templatesBrowse'
  | 'officialTemplates'
  | 'organizationTemplates'
  | 'notifications'
  | 'stats'
  | 'settings';

// Define the panel data structure
export interface PanelData {
  type: PanelType;
  props?: Record<string, any>; // Additional props specific to each panel
}

// Define the context interface
interface PanelNavigationContextType {
  currentPanel: PanelData;
  panelStack: PanelData[];
  pushPanel: (panel: PanelData) => void;
  replacePanel: (panel: PanelData) => void;
  popPanel: () => void;
  resetToPanel: (panelType: PanelType, props?: Record<string, any>) => void;
  resetToRoot: () => void;
}

// Create the context with default values
const PanelNavigationContext = createContext<PanelNavigationContextType>({
  currentPanel: { type: 'menu' },
  panelStack: [{ type: 'menu' }],
  pushPanel: () => {},
  replacePanel: () => {},
  popPanel: () => {},
  resetToPanel: () => {},
  resetToRoot: () => {},
});

// Create the provider component
interface PanelNavigationProviderProps {
  children: ReactNode;
  initialPanel?: PanelData;
}

export const PanelNavigationProvider: React.FC<PanelNavigationProviderProps> = ({
  children,
  initialPanel = { type: 'menu' },
}) => {
  const [panelStack, setPanelStack] = useState<PanelData[]>([initialPanel]);

  // Get the current panel (top of the stack)
  const currentPanel = panelStack[panelStack.length - 1];

  // Push a new panel onto the stack
  const pushPanel = (panel: PanelData) => {
    setPanelStack(prev => [...prev, panel]);
  };

  // Replace the current panel
  const replacePanel = (panel: PanelData) => {
    setPanelStack(prev => [...prev.slice(0, -1), panel]);
  };

  // Pop the current panel off the stack (go back)
  const popPanel = () => {
    if (panelStack.length > 1) {
      setPanelStack(prev => prev.slice(0, -1));
    }
  };

  // Reset to a specific panel type (clear stack and set that panel)
  const resetToPanel = (panelType: PanelType, props?: Record<string, any>) => {
    setPanelStack([{ type: panelType, props }]);
  };

  // Reset to the root panel
  const resetToRoot = () => {
    setPanelStack([initialPanel]);
  };

  return (
    <PanelNavigationContext.Provider
      value={{
        currentPanel,
        panelStack,
        pushPanel,
        replacePanel,
        popPanel,
        resetToPanel,
        resetToRoot,
      }}
    >
      {children}
    </PanelNavigationContext.Provider>
  );
};

// Create a custom hook to use the panel navigation context
export const usePanelNavigation = () => useContext(PanelNavigationContext);