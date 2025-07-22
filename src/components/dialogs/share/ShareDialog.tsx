// src/components/dialogs/share/ShareDialog.tsx
import React, { useState } from 'react';
import { BaseDialog } from '../BaseDialog';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { cn } from '@/core/utils/classNames';
import { useAuth } from '@/state/AuthContext';
import { 
  Share2, 
  Mail, 
  Users, 
  Gift, 
  Send, 
  Sparkles, 
  Heart, 
  Zap, 
  CheckCircle2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { shareApi } from '@/services/api/ShareApi';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { WhatsAppIcon, FacebookIcon, LinkedInIcon, EmailIcon } from '@/components/common/ShareButtonSection/ShareIcons';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  friendEmail: string;
  senderName: string;
  isLoading: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  friendEmail,
  senderName,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="jd-fixed jd-inset-0 jd-bg-black/50 jd-flex jd-items-center jd-justify-center jd-z-[10050]">
      <div className="jd-bg-white jd-dark:jd-bg-gray-800 jd-rounded-xl jd-p-6 jd-max-w-md jd-mx-4 jd-shadow-lg">
        <div className="jd-flex jd-items-center jd-gap-3 jd-mb-4">
          <div className="jd-p-2 jd-bg-primary/20 jd-rounded-full">
            <AlertTriangle className="jd-w-5 jd-h-5 jd-text-primary" />
          </div>
          <h3 className="jd-text-lg jd-font-semibold">
            {getMessage('confirmInvitation', undefined, 'Confirm Invitation')}
          </h3>
        </div>
        
        <div className="jd-space-y-3 jd-mb-6">
          <p className="jd-text-sm jd-text-muted-foreground">
            {getMessage('confirmInvitationMessage', undefined, 'Are you sure you want to send an invitation to:')}
          </p>
          <div className="jd-p-3 jd-bg-gray-50 jd-dark:jd-bg-gray-700 jd-rounded-lg">
            <p className="jd-font-medium jd-text-primary">{friendEmail}</p>
          </div>
          <p className="jd-text-xs jd-text-muted-foreground">
            {getMessage('invitationWillBeSent', undefined, `The invitation will be sent from ${senderName} introducing them to Jaydai.`)}
          </p>
        </div>

        <div className="jd-flex jd-gap-3 jd-justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="jd-px-4"
          >
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="jd-px-4 jd-bg-primary hover:jd-bg-primary/90"
          >
            {isLoading ? (
              <div className="jd-w-4 jd-h-4 jd-border-2 jd-border-white/30 jd-border-t-white jd-rounded-full jd-animate-spin" />
            ) : (
              <>
                <Send className="jd-w-4 jd-h-4 jd-mr-2" />
                {getMessage('sendInvitation', undefined, 'Send Invitation')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ShareDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.SHARE);
  const { user } = useAuth();
  const isDarkMode = useThemeDetector();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  
  const senderName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Someone';
  const shareUrl = 'https://jayd.ai';
  
  const shareMessages = {
    linkedin: getMessage('shareMessageLinkedin', undefined, '🚀 I\'ve been using Jaydai to boost my productivity with AI! It\'s an amazing tool that helps streamline workflows and get things done faster. Check it out:'),
    facebook: getMessage('shareMessageFacebook', undefined, 'Just discovered Jaydai - an incredible AI productivity tool! 🤖✨ It\'s been a game-changer for my workflow. Highly recommend checking it out!'),
    whatsapp: getMessage('shareMessageWhatsapp', undefined, 'Hey! 👋 I\'ve been using this amazing AI productivity tool called Jaydai and thought you might find it useful too!'),
    email: {
      subject: getMessage('shareMessageEmailSubject', undefined, 'Check out Jaydai - AI Productivity Tool'),
      body: getMessage('shareMessageEmailBody', undefined, 'Hi there!\n\nI wanted to share this amazing AI productivity tool I\'ve been using called Jaydai. It has really helped me streamline my workflow and get things done more efficiently.\n\nI think you\'d find it useful too! You can check it out here:')
    }
  };

  const handleFriendInviteClick = () => {
    if (!email.trim()) {
      toast.error(getMessage('emailRequired', undefined, 'Please enter an email address'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error(getMessage('invalidEmail', undefined, 'Please enter a valid email address'));
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmedInvite = async () => {
    setIsLoading(true);
    try {
      const response = await shareApi.inviteFriend({
        friendEmail: email.trim(),
      });

      if (response.success) {
        setEmailSent(true);
        setEmail('');
        setShowConfirmation(false);
        toast.success(getMessage('inviteEmailSent', undefined, 'Invitation sent successfully! 🎉'));
        window.dispatchEvent(new CustomEvent('invite-sent'));
        
        trackEvent(EVENTS.SHARE_FRIEND_INVITED, {
          friend_email: email.trim(),
        });
        
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
      setShowConfirmation(false);
    }
  };

  const handleInviteTeam = async () => {
    setIsLoading(true);
    try {
      const response = await shareApi.inviteTeamMembers();

      if (response.success) {
        toast.success(getMessage('teamInviteRequested', undefined, 'Team invitation request sent! We\'ll be in touch soon. 📧'));
        
        trackEvent(EVENTS.SHARE_TEAM_INVITE_REQUESTED, {
          user_email: user?.email,
        });
        
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
      const response = await shareApi.joinReferralProgram();

      if (response.success) {
        toast.success(getMessage('referralJoinRequested', undefined, 'Referral program request sent! We\'ll get back to you soon. 🚀'));
        
        trackEvent(EVENTS.SHARE_REFERRAL_JOIN_REQUESTED, {
          user_email: user?.email,
        });
        
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

  const handleSocialShare = (platform: string) => {
    let url = '';
    
    switch(platform) {
      case 'linkedin':
        url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareMessages.linkedin)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessages.facebook)}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessages.whatsapp)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(shareMessages.email.subject)}&body=${encodeURIComponent(shareMessages.email.body)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
    
    trackEvent('SHARE_SOCIAL_PLATFORM', {
      platform,
      user_email: user?.email,
    });
  };

  const copyMessageToClipboard = (message: string, platform: string) => {
    navigator.clipboard.writeText(message).then(() => {
      setCopiedMessage(platform);
      toast.success(getMessage('messageCopied', undefined, 'Message copied to clipboard!'));
      
      setTimeout(() => {
        setCopiedMessage(null);
      }, 2000);
      
      trackEvent('SHARE_MESSAGE_COPIED', {
        platform,
        user_email: user?.email,
      });
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <BaseDialog
        open={isOpen}
        onOpenChange={dialogProps.onOpenChange}
        title=""
        className="jd-max-w-lg jd-overflow-hidden"
      >
        <div className="jd-relative">
          <div
            className={cn(
              'jd-absolute jd-inset-0 jd-bg-gradient-to-br jd-opacity-50',
              isDarkMode
                ? 'jd-from-primary/20 jd-via-background/20 jd-to-secondary/20'
                : 'jd-from-primary/10 jd-via-background jd-to-secondary/10'
            )}
          />
          
          <div className="jd-absolute jd-top-2 jd-right-4 jd-w-2 jd-h-2 jd-bg-primary jd-rounded-full jd-animate-pulse" />
          <div className="jd-absolute jd-top-8 jd-left-8 jd-w-1 jd-h-1 jd-bg-secondary jd-rounded-full jd-animate-bounce" />
          <div className="jd-absolute jd-bottom-16 jd-right-8 jd-w-1.5 jd-h-1.5 jd-bg-primary/70 jd-rounded-full jd-animate-pulse jd-delay-75" />

          <div className="jd-relative jd-space-y-6 jd-p-2">
            <div className="jd-text-center jd-space-y-2">
              <div className="jd-flex jd-justify-center jd-mb-3">
                <div className="jd-relative jd-p-3 jd-bg-gradient-to-br jd-from-primary jd-to-secondary jd-rounded-full jd-shadow-lg">
                  <Share2 className="jd-w-6 jd-h-6 jd-text-primary" />
                  <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-transparent jd-via-white/20 jd-to-transparent jd-rounded-full jd-animate-pulse" />
                </div>
              </div>
              <h2 className="jd-text-2xl jd-font-bold jd-bg-gradient-to-r jd-from-primary jd-to-secondary jd-bg-clip-text jd-text-transparent">
                {getMessage('shareJaydai', undefined, 'Share Jaydai')}
              </h2>
              <p className="jd-text-sm jd-text-muted-foreground jd-max-w-sm jd-mx-auto">
                {getMessage('shareDescription', undefined, 'Help your friends and colleagues boost their productivity with AI')} ✨
              </p>
            </div>

            {emailSent ? (
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
                <div className="jd-space-y-4">
                  <div className="jd-text-center">
                  <div className="jd-inline-flex jd-items-center jd-gap-2 jd-px-3 jd-py-1 jd-bg-primary/20 jd-rounded-full jd-text-sm jd-font-medium jd-text-primary jd-mb-3">
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
                        className="jd-pl-10 jd-pr-4 jd-py-3 jd-border-2 jd-border-gray-200 jd-dark:jd-border-gray-700 jd-rounded-xl jd-transition-all jd-duration-200 focus:jd-border-primary focus:jd-ring-2 focus:jd-ring-primary/20"
                        disabled={isLoading}
                      />
                      <Mail className="jd-absolute jd-left-3 jd-top-1/2 jd-transform -jd-translate-y-1/2 jd-w-4 jd-h-4 jd-text-gray-400" />
                    </div>
                    
                    <Button
                      onClick={handleFriendInviteClick}
                      disabled={isLoading || !email.trim()}
                      className="jd-w-full jd-relative jd-overflow-hidden jd-bg-gradient-to-r jd-from-primary jd-to-secondary hover:jd-from-primary/80 hover:jd-to-secondary/80 jd-text-forground hover:jd-text-primary-foreground jd-border-none jd-py-3 jd-rounded-xl jd-transition-all jd-duration-300 jd-transform hover:jd-scale-[1.02] jd-shadow-lg hover:jd-shadow-xl jd-group"
                    >
                      <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-white/0 jd-via-white/20 jd-to-white/0 jd-translate-x-[-100%] group-hover:jd-translate-x-[100%] jd-transition-transform jd-duration-700" />
                      <div className="jd-relative jd-flex jd-items-center jd-justify-center jd-gap-2">
                        <Send className="jd-w-4 jd-h-4 jd-transition-transform group-hover:jd-translate-x-1" />
                        {getMessage('sendInvitation', undefined, 'Send Invitation')}
                        <Sparkles className="jd-w-4 jd-h-4 jd-opacity-80" />
                      </div>
                    </Button>
                  </div>
                </div>

                <Separator className="jd-my-6" />

                <div className="jd-space-y-4">
                  <div className="jd-text-center">
                    <div className="jd-inline-flex jd-items-center jd-gap-2 jd-px-3 jd-py-1 jd-bg-green-100 jd-dark:jd-bg-green-900/30 jd-rounded-full jd-text-sm jd-font-medium jd-text-green-700 jd-dark:jd-text-green-400 jd-mb-3">
                      <Share2 className="jd-w-4 jd-h-4" />
                      {getMessage('shareOnSocial', undefined, 'Share on social media')}
                    </div>
                  </div>
                  
                  <div className="jd-grid jd-grid-cols-2 jd-gap-3">
                    <div className="jd-space-y-2">
                      <Button
                        onClick={() => handleSocialShare('linkedin')}
                        className="jd-w-full jd-bg-blue-700 hover:jd-bg-blue-800 jd-text-white jd-py-2 jd-rounded-lg jd-flex jd-items-center jd-justify-center jd-gap-2"
                      >
                        <LinkedInIcon size={16} />
                        LinkedIn
                        <ExternalLink className="jd-w-3 jd-h-3" />
                      </Button>
                    </div>

                    <div className="jd-space-y-2">
                      <Button
                        onClick={() => handleSocialShare('facebook')}
                        className="jd-w-full jd-bg-blue-600 hover:jd-bg-blue-700 jd-text-white jd-py-2 jd-rounded-lg jd-flex jd-items-center jd-justify-center jd-gap-2"
                      >
                        <FacebookIcon size={16} />
                        Facebook
                        <ExternalLink className="jd-w-3 jd-h-3" />
                      </Button>
                    </div>

                    <div className="jd-space-y-2">
                      <Button
                        onClick={() => handleSocialShare('whatsapp')}
                        className="jd-w-full jd-bg-green-600 hover:jd-bg-green-700 jd-text-white jd-py-2 jd-rounded-lg jd-flex jd-items-center jd-justify-center jd-gap-2"
                      >
                        <WhatsAppIcon size={16} />
                        WhatsApp
                        <ExternalLink className="jd-w-3 jd-h-3" />
                      </Button>
                    </div>

                    <div className="jd-space-y-2">
                      <Button
                        onClick={() => handleSocialShare('email')}
                        className="jd-w-full jd-bg-amber-600 hover:jd-bg-amber-700 jd-text-white jd-py-2 jd-rounded-lg jd-flex jd-items-center jd-justify-center jd-gap-2"
                      >
                        <EmailIcon size={16} />
                        Email
                        <ExternalLink className="jd-w-3 jd-h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="jd-my-6" />

                <div className="jd-space-y-3">
                  <div className="jd-text-center jd-mb-4">
                    <div className="jd-inline-flex jd-items-center jd-gap-2 jd-px-3 jd-py-1 jd-bg-secondary/20 jd-rounded-full jd-text-sm jd-font-medium jd-text-secondary-foreground">
                      <Users className="jd-w-4 jd-h-4" />
                      {getMessage('growTogether', undefined, 'Grow together')}
                    </div>
                  </div>

                  <Button
                    className="jd-w-full jd-group jd-relative jd-overflow-hidden jd-bg-white jd-dark:jd-bg-gray-800 jd-border-2 jd-border-gray-200 jd-dark:jd-border-gray-700 hover:jd-border-secondary/50 jd-dark:hover:jd-border-secondary/60 jd-text-gray-700 jd-dark:jd-text-gray-200 hover:jd-text-secondary jd-dark:hover:jd-text-secondary-foreground jd-py-3 jd-rounded-xl jd-transition-all jd-duration-300 hover:jd-shadow-lg"
                    variant="outline"
                    onClick={handleInviteTeam}
                    disabled={isLoading}
                  >
                    <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-green-50 jd-to-emerald-50 jd-dark:jd-from-green-950/20 jd-dark:jd-to-emerald-950/20 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-duration-300" />
                    <div className="jd-relative jd-flex jd-items-center jd-justify-center jd-gap-2">
                      <Users className="jd-w-4 jd-h-4 jd-transition-transform group-hover:jd-scale-110 group-hover:jd-rotate-12" />
                      {getMessage('inviteMyTeam', undefined, 'Invite my team members')}
                      <Heart className="jd-w-4 jd-h-4 jd-opacity-70 jd-transition-all group-hover:jd-opacity-100 group-hover:jd-text-yellow-500" />
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

      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmedInvite}
        friendEmail={email}
        senderName={senderName}
        isLoading={isLoading}
      />
    </>
  );
};

export default ShareDialog;