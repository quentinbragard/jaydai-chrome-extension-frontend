/**
 * Types for the panel navigation system
 */

// Panel type definitions
export type MenuPanelType = 'menu';
export type TemplatesPanelType = 'templates' | 'browse-organization' | 'browse-company';
export type NotificationsPanelType = 'notifications';
export type StatsPanelType = 'stats';

// Union type for all panel types
export type PanelType = 
  | MenuPanelType 
  | TemplatesPanelType 
  | NotificationsPanelType
  | StatsPanelType;

// Metadata for panels
export interface PanelState {
  type: PanelType;
  meta?: Record<string, any>; // Optional metadata for the panel
}

// Panel navigation context
export interface PanelNavigationContext {
  currentPanel: PanelState;
  panelStack: PanelState[];
  pushPanel: (panel: PanelState) => void;
  popPanel: () => void;
  replacePanel: (panel: PanelState) => void;
  resetNavigation: () => void;
}