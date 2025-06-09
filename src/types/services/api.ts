// src/types/api.ts

/**
 * Types for API requests and responses
 */
/**
 * Types for API client and API responses
 */

// Base API response interface
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    code?: string;
  }
  
  // Network request interception data
  export interface NetworkRequestData {
    type?: string;
    url?: string;
    method?: string;
    requestHeaders?: Record<string, string>;
    requestBody?: any;
    responseBody?: any;
    responseHeaders?: Record<string, string>;
    statusCode?: number;
    timestamp?: number;
    duration?: number;
  }
  
  // Network interception event detail
  export interface NetworkInterceptEventDetail {
    type: string;
    data: NetworkRequestData;
  }
  
  // Custom event types
  export interface ArchimindCustomEvent extends CustomEvent {
    detail: {
      type?: string;
      message?: any;
      data?: any;
      messageId?: string;
      conversationId?: string;
      content?: string;
      role?: string;
      model?: string;
      isComplete?: boolean;
      thinkingTime?: number;
      parentMessageId?: string;
      createTime?: number;
      conversation?: any;
      messages?: any[];
      conversations?: any[];
      notification?: any;
      notificationId?: string | number;
      unreadCount?: number;
      error?: any;
      errorCode?: string;
      statistics?: any;
      count?: number;
      email?: string;
      name?: string;
    };
  }


  
  // Template API types
  export interface TemplateCreate {
    title: string;
    content: string;
    description?: string;
    folder_id?: number | null;
    locale?: string;
    metadata?: Record<string, number | number[]>;
    type?: string;
  }
  
  export interface TemplateUpdate {
    title?: string;
    content?: string;
    description?: string;
    folder_id?: number | null;
    metadata?: Record<string, number | number[]>;
  }
  
  export interface TemplateResponse {
    success: boolean;
    data?: {
      id: number;
      title: string;
      content: string;
      description?: string;
      folder_id?: number;
      metadata?: Record<string, number | number[]>;
      created_at: string;
      [key: string]: any;
    };
    message?: string;
  }
  
  export interface TemplateUsageResponse {
    success: boolean;
    usage_count: number;
  }
  
  // Folder API types
  export interface FolderCreate {
    name: string;
    path: string;
    description?: string;
  }
  
  export interface FolderUpdate {
    name?: string;
    path?: string;
    description?: string;
  }
  
  export interface FolderResponse {
    success: boolean;
    data?: {
      id: number;
      name: string;
      path: string;
      description?: string;
      created_at: string;
      [key: string]: any;
    };
    message?: string;
  }
  
  export interface FoldersResponse {
    success: boolean;
    data: Array<{
      id: number;
      name: string;
      path: string;
      description?: string;
      templates?: any[];
      Folders?: any[];
      is_pinned?: boolean;
      created_at: string;
      [key: string]: any;
    }>;
    message?: string;
  }
  
  export interface FolderPinResponse {
    success: boolean;
    pinned_folders: number[];
  }
  
  // User metadata API types
  export interface UserMetadataRequest {
    email: string;
    name?: string;
    picture?: string | null;
    phone_number?: string | null;
    org_name?: string | null;
  }
  
  export interface UserMetadataResponse {
    success: boolean;
    data?: {
      name: string | null;
      additional_email: string | null;
      phone_number: string | null;
      additional_organization: string | null;
      pinned_official_folder_ids: number[] | null;
      pinned_organization_folder_ids: number[] | null;
      [key: string]: any;
    };
    message?: string;
  }
  
  // Stats API types
  export interface UserStatsResponse {
    total_chats: number;
    recent_chats: number; 
    total_messages: number;
    avg_messages_per_chat: number;
    messages_per_day: Record<string, number>;
    efficiency?: number;
    token_usage: {
      recent: number;
      recentInput: number;
      recentOutput: number;
      total: number;
      totalInput: number;
      totalOutput: number;
    };
    energy_usage: {
      recent: number;
      total: number;
      per_message: number;
    };
    thinking_time: {
      total: number;
      average: number;
    };
    model_usage?: Record<string, {
      count: number;
      input_tokens: number;
      output_tokens: number;
    }>;
  }
  
  export interface WeeklyConversationsResponse {
    weekly_conversations: number[];
    total: number;
  }
  
  export interface MessageDistributionResponse {
    user_messages: number;
    ai_messages: number;
    total: number;
    user_percentage: number;
    ai_percentage: number;
  }
  
  // Auth API types
  export interface SignInRequest {
    email: string;
    password: string;
  }
  
  export interface SignUpRequest {
    email: string;
    password: string;
    name?: string;
  }
  
  export interface RefreshTokenRequest {
    refresh_token: string;
  }
  
  export interface AuthResponse {
    success: boolean;
    user?: any;
    session?: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
    message?: string;
  }