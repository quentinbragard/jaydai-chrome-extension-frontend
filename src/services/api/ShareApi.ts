// src/services/api/ShareApi.ts
import { apiClient } from './ApiClient';

export interface InviteFriendRequest {
  friendEmail: string;
  // Removed inviterEmail and inviterName - backend will get these from user_id
}

export interface InviteTeamRequest {
  // Removed userEmail and userName - backend will get these from user_id
}

export interface JoinReferralRequest {
  // Removed userEmail and userName - backend will get these from user_id
}

export interface ShareResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export class ShareApi {
  /**
   * Send friend invitation email
   */
  async inviteFriend(request: InviteFriendRequest): Promise<ShareResponse> {
    try {
      const response = await apiClient.request('/share/invite-friend', {
        method: 'POST',
        body: JSON.stringify(request)
      });

      return response;
    } catch (error) {
      console.error('❌ Error sending friend invitation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send invitation'
      };
    }
  }

  /**
   * Request team members invitation
   */
  async inviteTeamMembers(): Promise<ShareResponse> {
    try {
      const response = await apiClient.request('/share/invite-team', {
        method: 'POST',
        body: JSON.stringify({}) // Empty body - backend gets info from user_id
      });

      return response;
    } catch (error) {
      console.error('❌ Error requesting team invitation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send team invitation request'
      };
    }
  }

  /**
   * Join referral program request
   */
  async joinReferralProgram(): Promise<ShareResponse> {
    try {
      const response = await apiClient.request('/share/join-referral', {
        method: 'POST',
        body: JSON.stringify({}) // Empty body - backend gets info from user_id
      });

      return response;
    } catch (error) {
      console.error('❌ Error joining referral program:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to join referral program'
      };
    }
  }

  /**
   * Get sharing statistics for the user
   */
  async getShareStats(): Promise<ShareResponse> {
    try {
      const response = await apiClient.request('/share/stats', {
        method: 'GET'
      });

      return response;
    } catch (error) {
      console.error('❌ Error getting share stats:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get sharing statistics'
      };
    }
  }
}

// Export singleton instance
export const shareApi = new ShareApi();