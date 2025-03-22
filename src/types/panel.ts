/**
 * Panel type identifiers
 */
export type PanelType = 
  | 'menu' 
  | 'templates' 
  | 'templatesBrowse'
  | 'notifications'
  | 'stats';

/**
 * Panel state with optional metadata
 */
export interface PanelState {
  type: PanelType;
  title?: string;
  meta?: Record<string, any>;
}

/**
 * Panel navigation context
 */
export interface PanelNavigationContext {
  currentPanel: PanelState;
  panelStack: PanelState[];
  pushPanel: (panel: PanelState) => void;
  popPanel: () => void;
  replacePanel: (panel: PanelState) => void;
  resetNavigation: () => void;
}