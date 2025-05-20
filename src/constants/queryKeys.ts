// src/constants/queryKeys.ts
/**
 * Centralized query keys for React Query
 */

export const QUERY_KEYS = {
  // User data
  USER_PROFILE: 'userProfile',
  USER_METADATA: 'userMetadata',
  USER_STATS: 'userStats',
  
  // Notifications
  NOTIFICATIONS: 'notifications',
  UNREAD_COUNT: 'unreadCount',
  
  // Template folder keys
  USER_FOLDERS: 'userFolders',
  OFFICIAL_FOLDERS: 'officialFolders',
  ORGANIZATION_FOLDERS: 'organizationFolders',
  COMPANY_FOLDERS: 'companyFolders',
  PINNED_FOLDERS: 'pinnedFolders',
  ALL_FOLDERS: 'allFolders',
  
  // Template keys
  USER_TEMPLATES: 'userTemplates',
  OFFICIAL_TEMPLATES: 'officialTemplates',
  ORGANIZATION_TEMPLATES: 'organizationTemplates',
  COMPANY_TEMPLATES: 'companyTemplates',
  UNORGANIZED_TEMPLATES: 'unorganizedTemplates',
  TEMPLATE_BY_ID: 'templateById',
  
  // Block keys
  BLOCKS: 'blocks',
  BLOCK_TYPES: 'blockTypes',
  BLOCK_BY_ID: 'blockById',
  
  // Chat related
  CHAT_HISTORY: 'chatHistory',
  CONVERSATION_HISTORY: 'conversationHistory',
  CONVERSATION_BY_ID: 'conversationById',
  ACTIVE_CONVERSATION: 'activeConversation',
};

export default QUERY_KEYS;