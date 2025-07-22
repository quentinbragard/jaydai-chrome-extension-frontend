// src/components/dialogs/share/ReferralShareDialog.tsx
import React, { useState } from 'react';
import { BaseDialog } from '../BaseDialog';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/state/AuthContext';
import { Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { shareApi } from '@/services/api/ShareApi';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';

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
          <div className="jd-p-2 jd-bg-blue-100 jd-dark:jd-bg-blue-900/30 jd-rounded-full">
            <AlertTriangle className="jd-w-5 jd-h-5 jd-text-blue-600 jd-dark:jd-text-blue-400" />
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
            <p className="jd-font-medium jd-text-blue-600 jd-dark:jd-text-blue-400">{friendEmail}</p>
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
            className="jd-px-4 jd-bg-blue-600 hover:jd-bg-blue-700"
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

export const ReferralShareDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.REFERRAL_SHARE);
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const senderName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Someone';

  const handleInviteClick = () => {
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
      const response = await shareApi.inviteFriend({ friendEmail: email.trim() });
      if (response.success) {
        setEmailSent(true);
        setEmail('');
        setShowConfirmation(false);
        toast.success(
          getMessage('inviteEmailSent', undefined, 'Invitation sent successfully! 🎉')
        );
        window.dispatchEvent(new CustomEvent('invite-sent'));
        // Emit specific event so we can show the promo code only for invites
        // coming from this dialog
        window.dispatchEvent(new CustomEvent('referral-invite-sent'));
        trackEvent(EVENTS.SHARE_FRIEND_INVITED, { friend_email: email.trim() });
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

  if (!isOpen) return null;

  return (
    <>
      <BaseDialog
        open={isOpen}
        onOpenChange={dialogProps.onOpenChange}
        title={getMessage('shareJaydai', undefined, 'Share Jaydai')}
        className="jd-max-w-md"
      >
        <div className="jd-space-y-6">
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
                  {getMessage('invitationSentDescription', undefined, 'Your friend will receive an invitation email shortly')} 💌
                </p>
              </div>
            </div>
          ) : (
            <div className="jd-space-y-4">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="jd-pl-10 jd-pr-4 jd-py-3 jd-border-2 jd-border-gray-200 jd-dark:jd-border-gray-700 jd-rounded-xl jd-transition-all jd-duration-200 focus:jd-border-blue-400 focus:jd-ring-2 focus:jd-ring-blue-100 jd-dark:focus:jd-ring-blue-900"
                disabled={isLoading}
              />
              <Button
                onClick={handleInviteClick}
                disabled={isLoading || !email.trim()}
                className="jd-w-full jd-bg-blue-600 hover:jd-bg-blue-700 jd-text-white jd-py-3 jd-rounded-xl"
              >
                <Send className="jd-w-4 jd-h-4 jd-mr-2" />
                {getMessage('sendInvitation', undefined, 'Send Invitation')}
              </Button>
            </div>
          )}
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

export default ReferralShareDialog;
