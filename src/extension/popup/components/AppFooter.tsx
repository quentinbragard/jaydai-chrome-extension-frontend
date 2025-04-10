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
    <CardFooter className="jd-p-3 jd-border-t jd-border-muted jd-flex jd-flex-col jd-items-center">
      <div className="jd-w-full jd-flex jd-justify-between jd-items-center">
        <div className="jd-flex jd-items-center jd-gap-2">
          <TooltipProvider>
            {onSettingsClick && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="jd-h-8 jd-w-8 jd-rounded-full jd-bg-transparent hover:jd-bg-muted"
                    onClick={onSettingsClick}
                  >
                    <Settings className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
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
                  className="jd-h-8 jd-w-8 jd-rounded-full jd-bg-transparent hover:jd-bg-muted"
                  onClick={handleHelpClick}
                >
                  <HelpCircle className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getMessage('help', undefined, 'Help')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="jd-flex jd-items-center jd-gap-1">
          <span className="jd-text-xs jd-text-muted-foreground jd-mr-1">
            Archimind v{version}
          </span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="jd-h-8 jd-w-8 jd-rounded-full jd-bg-transparent hover:jd-bg-muted"
                  onClick={handleLinkedInClick}
                >
                  <Linkedin className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
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
                  className="jd-h-8 jd-w-8 jd-rounded-full jd-bg-transparent hover:jd-bg-muted"
                  onClick={handleWebsiteClick}
                >
                  <ExternalLink className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getMessage('website', undefined, 'Website')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="jd-text-[10px] jd-text-center jd-text-muted-foreground/60 jd-mt-1 jd-px-4">
        {getMessage('aiCompanion', undefined, 'Your AI companion for effective tool usage')}
      </div>
    </CardFooter>
  );
};