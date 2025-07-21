// src/components/dialogs/share/ShareDialog.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { BaseDialog } from '../BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { useAuth } from '@/state/AuthContext';

const ShareDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.SHARE);
  const { user } = useAuth();
  const [email, setEmail] = useState('');

  const handleInviteFriend = () => {
    console.log('Invite friend email:', email);
    setEmail('');
    dialogProps.onOpenChange(false);
  };

  const handleInviteTeam = () => {
    console.log('Invite team members:', user?.email);
    dialogProps.onOpenChange(false);
  };

  const handleJoinReferral = () => {
    console.log('Join referral program:', user?.email);
    dialogProps.onOpenChange(false);
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={getMessage('shareJaydai', undefined, 'Share Jaydai')}
      className="jd-max-w-sm"
    >
      <div className="jd-space-y-4 jd-mt-4">
        <div>
          <label className="jd-text-sm jd-font-medium">
            {getMessage('inviteAFriend', undefined, 'Invite a friend')}
          </label>
          <div className="jd-flex jd-items-center jd-space-x-2 jd-mt-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={getMessage('emailAddress', undefined, 'Email address')}
              className="jd-flex-1"
            />
            <Button size="sm" disabled={!email.trim()} onClick={handleInviteFriend}>
              {getMessage('send', undefined, 'Send')}
            </Button>
          </div>
        </div>
        <Separator />
        <div className="jd-flex jd-flex-col jd-space-y-2">
          <Button variant="outline" onClick={handleInviteTeam}>
            {getMessage('inviteMyTeamMembers', undefined, 'Invite my team members')}
          </Button>
          <Button variant="ghost" onClick={handleJoinReferral}>
            {getMessage('joinReferralProgram', undefined, 'Join the Jaydai referral program')}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};

export default ShareDialog;
