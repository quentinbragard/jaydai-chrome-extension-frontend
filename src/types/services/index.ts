/**
 * Barrel file for service-related types
 * Centralizes all service interface exports
 */

// Import and re-export all service types
export * from './auth';
export * from './message';
export * from './conversation';

// Service interfaces
export interface BaseServiceInterface {
  initialize(): Promise<void>;
  cleanup(): void;
  isInitialized(): boolean;
}

// API Service interfaces
export interface RequestOptions extends RequestInit {
  allowAnonymous?: boolean;
}

// Chat service interfaces
export interface ConversationManagerInterface {
  getCurrentConversationId(): string | null;
  setCurrentConversationId(conversationId: string): void;
  getConversation(conversationId: string): import('./conversation').Conversation | undefined;
  getCurrentConversation(): import('./conversation').Conversation | undefined;
  getConversations(): import('./conversation').Conversation[];
}

export interface MessageManagerInterface {
  addMessage(message: import('./message').Message): void;
  getConversationMessages(conversationId: string): import('./message').Message[];
  getMessage(conversationId: string, messageId: string): import('./message').Message | null;
}

export interface MessageQueueInterface {
  queueMessage(message: import('./message').Message): void;
}

export interface PendingMessageTrackerInterface {
  processPendingMessages(conversationId: string): void;
  addPendingMessage(message: import('./message').Message): void;
}

// Notification service interfaces
export interface NotificationServiceInterface {
  getNotifications(): import('../notifications').NotificationResponse[];
  getUnreadNotifications(): import('../notifications').NotificationResponse[];
  getUnreadCount(): number;
  markAsRead(id: string | number): Promise<boolean>;
  markAllAsRead(): Promise<boolean>;
  deleteNotification(id: string | number): Promise<boolean>;
  loadNotifications(forceRefresh?: boolean): Promise<import('../notifications').NotificationResponse[]>;
  onNotificationsUpdate(callback: (notifications: import('../notifications').NotificationResponse[]) => void): () => void;
}

// Auth service interfaces
export interface AuthServiceInterface {
  isAuthenticated(): boolean;
  getAuthState(): import('./auth').AuthState;
  subscribe(callback: (state: import('./auth').AuthState) => void): () => void;
  handleSessionExpired(): void;
  signInWithEmail(email: string, password: string): Promise<boolean>;
  signUp(email: string, password: string, name?: string): Promise<boolean>;
  signOut(): Promise<void>;
  clearError(): void;
}

export interface TokenServiceInterface {
  getAuthToken(): Promise<import('./auth').TokenResponse>;
  refreshToken(): Promise<boolean>;
  storeAuthSession(session: import('./auth').AuthToken): Promise<void>;
  clearAuthData(callback?: () => void): Promise<void>;
}

// Stats service interfaces
export interface StatsServiceInterface {
  getStats(): import('../stats').Stats;
  refreshStats(): Promise<void>;
  onUpdate(callback: (stats: import('../stats').Stats) => void): () => void;
}