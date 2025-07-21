// src/components/dialogs/share/ShareDialog.tsx
import React, { useState } from 'react';
import { BaseDialog } from '../BaseDialog';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/state/AuthContext';
import { Share2, Mail, Users, Gift, Send, Sparkles, Heart, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { shareApi } from '@/services/api/ShareApi';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';

export const ShareDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.SHARE);
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleInviteFriend = async () => {
    if (!email.trim()) {
      toast.error(getMessage('emailRequired', undefined, 'Please enter an email address'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error(getMessage('invalidEmail', undefined, 'Please enter a valid email address'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await shareApi.inviteFriend({
        inviterEmail: user?.email || 'quentin@jayd.ai',
        inviterName: user?.user_metadata?.name || user?.email || 'Someone',
        friendEmail: email.trim(),
      });

      if (response.success) {
        setEmailSent(true);
        setEmail('');
        toast.success(getMessage('inviteEmailSent', undefined, 'Invitation sent successfully! 🎉'));
        
        trackEvent(EVENTS.SHARE_FRIEND_INVITED, {
          inviter_email: user?.email,
          friend_email: email.trim(),
        });
        
        // Auto-close dialog after 2 seconds
        setTimeout(() => {
          dialogProps.onOpenChange(false);
          setEmailSent(false);
        }, 2000);
      } else {
        toast.error(response.message || getMessage('inviteEmailFailed', undefined, 'Failed to send invitation'));
      }
    } catch (error) {
      console.error('Error sending friend invitation:', error);
      toast.error(getMessage('inviteEmailError', undefined, 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteTeam = async () => {
    setIsLoading(true);
    try {
      const response = await shareApi.inviteTeamMembers({
        userEmail: user?.email || '',
        userName: user?.user_metadata?.name || user?.email || 'Someone',
      });

      if (response.success) {
        toast.success(getMessage('teamInviteRequested', undefined, 'Team invitation request sent! We\'ll be in touch soon. 📧'));
        
        trackEvent(EVENTS.SHARE_TEAM_INVITE_REQUESTED, {
          user_email: user?.email,
        });
        
        // Auto-close dialog after 2 seconds
        setTimeout(() => {
          dialogProps.onOpenChange(false);
        }, 1500);
      } else {
        toast.error(response.message || getMessage('teamInviteFailed', undefined, 'Failed to send team invitation request'));
      }
    } catch (error) {
      console.error('Error requesting team invitation:', error);
      toast.error(getMessage('teamInviteError', undefined, 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinReferral = async () => {
    setIsLoading(true);
    try {
      const response = await shareApi.joinReferralProgram({
        userEmail: user?.email || '',
        userName: user?.user_metadata?.name || user?.email || 'Someone',
      });

      if (response.success) {
        toast.success(getMessage('referralJoinRequested', undefined, 'Referral program request sent! We\'ll get back to you soon. 🚀'));
        
        trackEvent(EVENTS.SHARE_REFERRAL_JOIN_REQUESTED, {
          user_email: user?.email,
        });
        
        // Auto-close dialog after 2 seconds
        setTimeout(() => {
          dialogProps.onOpenChange(false);
        }, 1500);
      } else {
        toast.error(response.message || getMessage('referralJoinFailed', undefined, 'Failed to join referral program'));
      }
    } catch (error) {
      console.error('Error joining referral program:', error);
      toast.error(getMessage('referralJoinError', undefined, 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title=""
      className="jd-max-w-md jd-overflow-hidden"
    >
      <div className="jd-relative">
        {/* Animated background gradient */}
        <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-br jd-from-blue-50 jd-via-purple-50 jd-to-pink-50 jd-dark:jd-from-blue-950/30 jd-dark:jd-via-purple-950/30 jd-dark:jd-to-pink-950/30 jd-opacity-50" />
        
        <div className="jd-relative jd-space-y-6 jd-p-2">
          {/* Header Section */}
          <div className="jd-text-center jd-space-y-2">
            <div className="jd-flex jd-justify-center jd-mb-3">
              <div className="jd-relative jd-p-3 jd-bg-gradient-to-br jd-from-blue-500 jd-to-purple-600 jd-rounded-full jd-shadow-lg">
                <Share2 className="jd-w-6 jd-h-6 jd-text-primary" />
                <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-transparent jd-via-white/20 jd-to-transparent jd-rounded-full jd-animate-pulse" />
              </div>
            </div>
            <h2 className="jd-text-2xl jd-font-bold jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 jd-bg-clip-text jd-text-transparent">
              {getMessage('shareJaydai', undefined, 'Share Jaydai')}
            </h2>
            <p className="jd-text-sm jd-text-muted-foreground jd-max-w-sm jd-mx-auto">
              {getMessage('shareDescription', undefined, 'Help your friends and colleagues boost their productivity with AI')} ✨
            </p>
          </div>

          {emailSent ? (
            // Success state for friend invitation
            <div className="jd-text-center jd-space-y-4 jd-py-8">
              <div className="jd-flex jd-justify-center">
                <div className="jd-p-3 jd-bg-green-100 jd-dark:jd-bg-green-900/30 jd-rounded-full">
                  <CheckCircle2 className="jd-w-8 jd-h-8 jd-text-green-600 jd-dark:jd-text-green-400" />
                </div>
              </div>
              <div className="jd-space-y-2">
                <h3 className="jd-text-lg jd-font-semibold jd-text-green-700 jd-dark:jd-text-green-400">
                  {getMessage('invitationSent', undefined, 'Invitation Sent!')}
                </h3>
                <p className="jd-text-sm jd-text-muted-foreground">
                  {getMessage('invitationSentDescription', undefined, 'Your friend will receive a beautiful invitation email shortly')} 💌
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Friend Invitation Section */}
              <div className="jd-space-y-4">
                <div className="jd-text-center">
                  <div className="jd-inline-flex jd-items-center jd-gap-2 jd-px-3 jd-py-1 jd-bg-blue-100 jd-dark:jd-bg-blue-900/30 jd-rounded-full jd-text-sm jd-font-medium jd-text-blue-700 jd-dark:jd-text-blue-400 jd-mb-3">
                    <Mail className="jd-w-4 jd-h-4" />
                    {getMessage('inviteAFriend', undefined, 'Invite a friend')}
                  </div>
                </div>
                
                <div className="jd-space-y-3">
                  <div className="jd-relative">
                    <Input
                      type="email"
                      placeholder="friend@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="jd-pl-10 jd-pr-4 jd-py-3 jd-border-2 jd-border-gray-200 jd-dark:jd-border-gray-700 jd-rounded-xl jd-transition-all jd-duration-200 focus:jd-border-blue-400 focus:jd-ring-2 focus:jd-ring-blue-100 jd-dark:focus:jd-ring-blue-900"
                      disabled={isLoading}
                    />
                    <Mail className="jd-absolute jd-left-3 jd-top-1/2 jd-transform -jd-translate-y-1/2 jd-w-4 jd-h-4 jd-text-gray-400" />
                  </div>
                  
                  <Button 
                    onClick={handleInviteFriend}
                    disabled={isLoading || !email.trim()}
                    className="jd-w-full jd-relative jd-overflow-hidden jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 hover:jd-from-blue-700 hover:jd-to-purple-700 jd-text-white jd-border-none jd-py-3 jd-rounded-xl jd-transition-all jd-duration-300 jd-transform hover:jd-scale-[1.02] jd-shadow-lg hover:jd-shadow-xl jd-group"
                  >
                    <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-white/0 jd-via-white/20 jd-to-white/0 jd-translate-x-[-100%] group-hover:jd-translate-x-[100%] jd-transition-transform jd-duration-700" />
                    <div className="jd-relative jd-flex jd-items-center jd-justify-center jd-gap-2">
                      {isLoading ? (
                        <div className="jd-w-4 jd-h-4 jd-border-2 jd-border-white/30 jd-border-t-white jd-rounded-full jd-animate-spin" />
                      ) : (
                        <>
                          <Send className="jd-w-4 jd-h-4 jd-transition-transform group-hover:jd-translate-x-1" />
                          {getMessage('sendInvitation', undefined, 'Send Invitation')}
                          <Sparkles className="jd-w-4 jd-h-4 jd-opacity-80" />
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </div>

              <Separator className="jd-my-6" />

              {/* Team & Referral Section */}
              <div className="jd-space-y-3">
                <div className="jd-text-center jd-mb-4">
                  <div className="jd-inline-flex jd-items-center jd-gap-2 jd-px-3 jd-py-1 jd-bg-purple-100 jd-dark:jd-bg-purple-900/30 jd-rounded-full jd-text-sm jd-font-medium jd-text-purple-700 jd-dark:jd-text-purple-400">
                    <Users className="jd-w-4 jd-h-4" />
                    {getMessage('growTogether', undefined, 'Grow together')}
                  </div>
                </div>

                <Button 
                  className="jd-w-full jd-group jd-relative jd-overflow-hidden jd-bg-white jd-dark:jd-bg-gray-800 jd-border-2 jd-border-gray-200 jd-dark:jd-border-gray-700 hover:jd-border-purple-300 jd-dark:hover:jd-border-purple-600 jd-text-gray-700 jd-dark:jd-text-gray-200 hover:jd-text-purple-700 jd-dark:hover:jd-text-purple-400 jd-py-3 jd-rounded-xl jd-transition-all jd-duration-300 hover:jd-shadow-lg"
                  variant="outline" 
                  onClick={handleInviteTeam}
                  disabled={isLoading}
                >
                  <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-purple-50 jd-to-blue-50 jd-dark:jd-from-purple-950/20 jd-dark:jd-to-blue-950/20 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-duration-300" />
                  <div className="jd-relative jd-flex jd-items-center jd-justify-center jd-gap-2">
                    <Users className="jd-w-4 jd-h-4 jd-transition-transform group-hover:jd-scale-110" />
                    {getMessage('inviteMyTeam', undefined, 'Invite my team members')}
                    <Heart className="jd-w-4 jd-h-4 jd-opacity-70 jd-transition-all group-hover:jd-opacity-100 group-hover:jd-text-red-500" />
                  </div>
                </Button>
                
                <Button 
                  className="jd-w-full jd-group jd-relative jd-overflow-hidden jd-bg-white jd-dark:jd-bg-gray-800 jd-border-2 jd-border-gray-200 jd-dark:jd-border-gray-700 hover:jd-border-green-300 jd-dark:hover:jd-border-green-600 jd-text-gray-700 jd-dark:jd-text-gray-200 hover:jd-text-green-700 jd-dark:hover:jd-text-green-400 jd-py-3 jd-rounded-xl jd-transition-all jd-duration-300 hover:jd-shadow-lg"
                  variant="outline" 
                  onClick={handleJoinReferral}
                  disabled={isLoading}
                >
                  <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-green-50 jd-to-emerald-50 jd-dark:jd-from-green-950/20 jd-dark:jd-to-emerald-950/20 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-duration-300" />
                  <div className="jd-relative jd-flex jd-items-center jd-justify-center jd-gap-2">
                    <Gift className="jd-w-4 jd-h-4 jd-transition-transform group-hover:jd-scale-110 group-hover:jd-rotate-12" />
                    {getMessage('joinReferralProgram', undefined, 'Join Jaydai referral program')}
                    <Zap className="jd-w-4 jd-h-4 jd-opacity-70 jd-transition-all group-hover:jd-opacity-100 group-hover:jd-text-yellow-500" />
                  </div>
                </Button>
              </div>

              {/* Footer note */}
              <div className="jd-text-center jd-pt-4 jd-border-t jd-border-gray-100 jd-dark:jd-border-gray-800">
                <p className="jd-text-xs jd-text-muted-foreground jd-flex jd-items-center jd-justify-center jd-gap-1">
                  <span>💡</span>
                  {getMessage('shareFooterNote', undefined, 'Share the AI productivity revolution')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </BaseDialog>
  );
};

export default ShareDialog;