// src/extension/popup/components/ToolGrid.tsx
import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { getMessage } from '@/core/utils/i18n';
import { ToolCard } from './ToolCard';
import { AI_TOOLS } from '../constants/ai-tools';

interface ToolGridProps {
  onLogout: () => Promise<void>;
  onOpenChatGPT: () => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ 
  onLogout,
  onOpenChatGPT
}) => {
  const openTool = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <>
      <CardContent className="jd-p-4 jd-space-y-3 jd-mt-2">
        {AI_TOOLS.map((tool) => (
          <ToolCard
            key={tool.name}
            tool={tool}
            onClick={() => !tool.disabled && openTool(tool.url)}
          />
        ))}
      </CardContent>
      
      <CardFooter className="jd-border-t jd-border-muted jd-pt-3 jd-pb-3 jd-flex jd-justify-center">
        <div className="jd-w-full jd-px-2">
          <Button 
            variant="ghost" 
            className="jd-w-full jd-text-red-500 hover:jd-text-red-600 hover:jd-bg-red-50 jd-dark:hover:jd-bg-red-950/30 jd-gap-2 jd-transition-all jd-duration-300 jd-py-5 jd-rounded-lg jd-group jd-border-none"
            onClick={onLogout}
          >
            <LogOut className="jd-h-4 jd-w-4 group-hover:jd-rotate-12 jd-transition-transform jd-duration-300" />
            <span className="jd-font-medium">{getMessage('signOut', undefined, 'Sign Out')}</span>
          </Button>
          <div className="jd-text-xs jd-text-center jd-text-muted-foreground jd-mt-2">
            Archimind v{chrome.runtime.getManifest().version}
          </div>
        </div>
      </CardFooter>
    </>
  );
};