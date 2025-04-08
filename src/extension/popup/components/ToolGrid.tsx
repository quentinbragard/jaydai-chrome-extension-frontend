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
      <CardContent className="p-4 space-y-3 mt-2">
        {AI_TOOLS.map((tool) => (
          <ToolCard
            key={tool.name}
            tool={tool}
            onClick={() => !tool.disabled && openTool(tool.url)}
          />
        ))}
      </CardContent>
      
      <CardFooter className="border-t border-muted pt-3 pb-3 flex justify-center">
        <div className="w-full px-2">
          <Button 
            variant="ghost" 
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2 transition-all duration-300 py-5 rounded-lg group border-none"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-medium">{getMessage('signOut', undefined, 'Sign Out')}</span>
          </Button>
          <div className="text-xs text-center text-muted-foreground mt-2">
            Archimind v1.0.0
          </div>
        </div>
      </CardFooter>
    </>
  );
};