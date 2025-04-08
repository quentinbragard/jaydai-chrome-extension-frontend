// src/extension/popup/components/AppFooter.tsx
import React from 'react';
import { Settings, HelpCircle, Linkedin, ExternalLink } from 'lucide-react';
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getMessage } from '@/core/utils/i18n';

interface AppFooterProps {
  version?: string;
  onSettingsClick?: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ 
  version = "1.0.0",
  onSettingsClick
}) => {
  const handleLinkedInClick = () => {
    chrome.tabs.create({ url: 'https://www.linkedin.com/company/jaydai' });
  };

  const handleWebsiteClick = () => {
    chrome.tabs.create({ url: 'https://jayd.ai' });
  };
  
  const handleHelpClick = () => {
    chrome.tabs.create({ url: 'https://www.jayd.ai/' });
  };

  return (
    <CardFooter className="p-3 border-t border-muted flex flex-col items-center">
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            {onSettingsClick && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-transparent hover:bg-muted"
                    onClick={onSettingsClick}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getMessage('settings', undefined, 'Settings')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-transparent hover:bg-muted"
                  onClick={handleHelpClick}
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getMessage('help', undefined, 'Help')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">
            Archimind v{version}
          </span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-transparent hover:bg-muted"
                  onClick={handleLinkedInClick}
                >
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getMessage('linkedin', undefined, 'LinkedIn')}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-transparent hover:bg-muted"
                  onClick={handleWebsiteClick}
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getMessage('website', undefined, 'Website')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="text-[10px] text-center text-muted-foreground/60 mt-1 px-4">
        {getMessage('aiCompanion', undefined, 'Your AI companion for effective tool usage')}
      </div>
    </CardFooter>
  );
};