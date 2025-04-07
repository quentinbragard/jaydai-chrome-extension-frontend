import { getMessage } from '@/core/utils/i18n';
import { Button } from '@/components/ui/button';
import { ToolCard } from './ToolCard';
import { AI_TOOLS } from '../constants/ai-tools';

interface ToolGridProps {
  onSignOut: () => void;
}

export function ToolGrid({ onSignOut }: ToolGridProps) {
  const handleToolClick = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {AI_TOOLS.map((tool) => (
          <ToolCard
            key={tool.name}
            tool={tool}
            onClick={() => !tool.disabled && handleToolClick(tool.url)}
          />
        ))}
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={onSignOut}
      >
        {getMessage('signOut')}
      </Button>
    </div>
  );
}