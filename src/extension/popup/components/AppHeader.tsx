// src/extension/popup/components/AppHeader.tsx
import { getMessage } from '@/core/utils/i18n';
import { Badge } from '@/components/ui/badge';

interface AppHeaderProps {
  userEmail: string;
}

export function AppHeader({ userEmail }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        <h1 className="text-lg font-semibold">
          {getMessage('aiToolLauncher')}
        </h1>
        <Badge variant="secondary" className="text-xs">
          {getMessage('online')}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        {getMessage('signedInAs')} {userEmail}
      </div>
    </div>
  );
}