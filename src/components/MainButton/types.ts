import { ReactNode } from 'react';

export interface MainButtonProps {
  onSettingsClick?: () => void;
  onSaveClick?: () => void;
}

export type ActivePanel = 'none' | 'notifications' | 'templates' | 'menu' | 'browseOfficialFolders' | 'browseOrganizationFolders';

export interface NotificationService {
  getUnreadCount: () => number;
  onNotificationsUpdate: (callback: () => void) => () => void;
} 