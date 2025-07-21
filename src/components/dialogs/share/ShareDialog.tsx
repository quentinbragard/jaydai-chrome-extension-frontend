import React, { useState } from 'react';
import { BaseDialog } from '../BaseDialog';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/state/AuthContext';

export const ShareDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.SHARE);
  const { user } = useAuth();
  const [email, setEmail] = useState('');

  const handleInviteFriend = () => {
    console.log('Invite friend:', email);
    setEmail('');
  };

  const handleInviteTeam = () => {
    console.log('Invite team members:', user?.email);
  };

  const handleJoinReferral = () => {
    console.log('Join referral program:', user?.email);
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title="Share Jaydai"
      className="jd-max-w-sm"
    >
      <div className="jd-space-y-4">
        <div>
          <h3 className="jd-font-medium">Invite a friend</h3>
          <div className="jd-flex jd-gap-2 jd-mt-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="jd-flex-1"
            />
            <Button onClick={handleInviteFriend}>Send</Button>
          </div>
        </div>
        <Separator />
        <div className="jd-space-y-2">
          <Button className="jd-w-full" variant="outline" onClick={handleInviteTeam}>
            Invite my team members
          </Button>
          <Button className="jd-w-full" variant="outline" onClick={handleJoinReferral}>
            Join the Jaydai referral program
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};

export default ShareDialog;
