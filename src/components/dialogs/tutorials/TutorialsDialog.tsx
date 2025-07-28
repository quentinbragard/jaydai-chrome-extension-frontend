import React, { useState, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Play,
  ExternalLink,
  Sparkles,
  Compass,
  LayoutTemplate,
  Blocks,
  Folder,
  AppWindow,
  BarChart2,
} from 'lucide-react';

import { BaseDialog } from '../BaseDialog';
import { useDialog, useDialogManager } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/analytics';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';

interface VideoInfo {
  id: string;
  title: string;
  url: string;
  duration: string;
  description: string;
  icon: LucideIcon;
}

const featuredTutorials = [
  {
    title: getMessage('insertBlocks', undefined, 'Insert Blocks'),
    subtitle: getMessage('insertBlocks', undefined, 'Quickly add blocks using shortcuts'),
    url: 'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//shortchut_demo.gif',
  },
  {
    title: getMessage('promptBuilder', undefined, 'Prompt Builder'),
    subtitle: getMessage('promptBuilder', undefined, 'Build prompts with ease'),
    url: 'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//blocs_demo.gif',
  },
  {
    title: getMessage('createTemplate', undefined, 'Create Template'),
    subtitle: getMessage('createTemplate', undefined, 'Save and reuse your prompts'),
    url: 'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//templates_demo.gif',
  },
  {
    title: getMessage('useFirstTemplate', undefined, 'Use your first template'),
    subtitle: getMessage('useFirstTemplate', undefined, 'Use your first template'),
    url: 'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//use_template_demo.gif',
  },
];

const videos: VideoInfo[] = [
  {
    id: 'tour',
    title: getMessage('fullTour', undefined, 'Full Tour'),
    url: 'https://www.loom.com/embed/c910c2ceeea042d99b977b12bd8dba3e',
    duration: '4:09',
    description: getMessage('fullTour', undefined, 'Complete walkthrough of the extension.'),
    icon: Compass,
  },
  {
    id: 'templates',
    title: getMessage('templates', undefined, 'Templates'),
    url: 'https://www.loom.com/embed/af9a0a363d194ac29d6aee3d18b9cdbb',
    duration: '3:51',
    description: getMessage('templates', undefined, 'How to use templates.'),
    icon: LayoutTemplate,
  },
  {
    id: 'blocks',
    title: getMessage('blocks', undefined, 'Blocks'),
    url: 'https://www.loom.com/embed/93ac2850b69d4307ba07f1d519a5ed67',
    duration: '2:21',
    description: getMessage('blocks', undefined, 'Overview of the blocks feature.'),
    icon: Blocks,
  },
  {
    id: 'folders',
    title: getMessage('folders', undefined, 'Folders & Organization'),
    url: 'https://www.loom.com/embed/63928ee9359345d9baa89a7ddab7979f',
    duration: '2:18',
    description: getMessage('folders', undefined, 'Organizing folders in JayDai.'),
    icon: Folder,
  },
  {
    id: 'popup',
    title: getMessage('extensionPopup', undefined, 'Extension Popup'),
    url: 'https://www.loom.com/embed/0113fa04ad104011810d9283df046fb2?sid=b65ccd47-3c41-4eff-9608-b809a1fc83ec',
    duration: '0:59',
    description: getMessage('extensionPopup', undefined, 'Using the extension popup.'),
    icon: AppWindow,
  },
  {
    id: 'stats',
    title: getMessage('stats', undefined, 'Stats'),
    url: 'https://www.loom.com/embed/c517179557a94a5ba2491a6c7a76f2b0',
    duration: '1:51',
    description: getMessage('stats', undefined, 'Exploring the stats view.'),
    icon: BarChart2,
  },
];

export const TutorialsDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.TUTORIALS_LIST);
  const { openDialog } = useDialogManager();
  const { openCreateTemplate, openInsertBlock, openInformation } = useDialogActions();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const openQuickSelector = useCallback(() => {
    try {
      const service: any = (window as any).slashCommandService || {};
      const target = service.inputEl as HTMLElement | null;
      if (target && service.quickSelector) {
        const position = { x: 100, y: 100 };
        const cursorPos = 0;
        service.quickSelector.open(position, target, cursorPos, 0);
      }
    } catch (error) {
      console.error('Failed to open quick selector', error);
    }
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      dialogProps.onOpenChange(open);
    },
    [dialogProps]
  );

  const handleGifClick = (index: number) => {
    trackEvent(EVENTS.TUTORIAL_GIF_CLICKED, {
      tutorial_title: featuredTutorials[index].title,
    });
    if (index === 0) {
      openQuickSelector();
    } else if (index === 1) {
      openInsertBlock();
    } else if (index === 2) {
      openCreateTemplate();
    } else if (index === 3) {
      openInformation({
        title: getMessage('useFirstTemplate', undefined, 'Use your first template'),
        description: getMessage('useFirstTemplateInfo', undefined, 'Select a template from one of your pinned folders below.'),
        gifUrl: 'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//use_template_demo.gif',
        actionText: getMessage('close', undefined, 'Close'),
      });
    }
    // Close the tutorials dialog after performing the action
    handleOpenChange(false);
  };

  const openVideo = (url: string, title: string) => {
    openDialog(DIALOG_TYPES.TUTORIAL_VIDEO, { url, title });
  };

  const openSubstack = () => {
    trackEvent(EVENTS.SUBSTACK_CLICKED, {
      source: 'tutorials',
    });
    window.open(
      'https://thetunnel.substack.com/?utm_source=jaydai-extension',
      '_blank'
    );
  };

  if (!isOpen) return null;

  const footer = (
    <div className="jd-flex jd-items-center jd-justify-between jd-pt-4 jd-border-t jd-border-border/20">
      <div className="jd-flex jd-items-center jd-gap-2 jd-text-sm jd-text-muted-foreground">
        <Sparkles className="jd-w-4 jd-h-4" />
        <span>{getMessage('stayUpdated', undefined, 'Stay updated with the latest features')}</span>
      </div>
      <Button 
        onClick={openSubstack}
        className="jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 hover:jd-from-blue-700 hover:jd-to-purple-700 jd-text-white jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300"
      >
        <ExternalLink className="jd-w-4 jd-h-4 jd-mr-2" />
        {getMessage('aiNews', undefined, 'AI News')}
      </Button>
    </div>
  );

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={getMessage('tutorials', undefined, 'Tutorials')}
      className="jd-max-w-6xl"
      footer={footer}
    >
      <div className="jd-flex jd-flex-col jd-space-y-8">
        {/* Featured Tutorials Section */}
        <div className="jd-space-y-4">
          <div className="jd-flex jd-items-center jd-gap-3">
            <div className="jd-w-1 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-500 jd-rounded-full"></div>
          </div>
          
          <div className="jd-flex jd-gap-4">
            {featuredTutorials.map((tutorial, i) => {
              const isHovered = hoveredIndex === i;
              const isOther = hoveredIndex !== null && hoveredIndex !== i;
              return (
                <div
                  key={i}
                  className={`jd-relative jd-overflow-hidden jd-rounded-xl jd-bg-gradient-to-br jd-from-slate-50 jd-to-slate-100 dark:jd-from-slate-800 dark:jd-to-slate-900 jd-border jd-border-border/50 jd-cursor-pointer jd-group jd-transition-all jd-duration-500 jd-ease-out ${
                    isHovered
                      ? 'jd-flex-[3] jd-h-64 md:jd-h-80 jd-z-10 jd-shadow-2xl jd-scale-[1.02]'
                      : isOther
                      ? 'jd-flex-[1] jd-h-40 md:jd-h-48 jd-opacity-70 jd-scale-[0.98]'
                      : 'jd-flex-1 jd-h-48 md:jd-h-56 jd-shadow-lg hover:jd-shadow-xl'
                  }`}
                  onMouseEnter={() => {
                    setHoveredIndex(i);
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleGifClick(i)}
                  style={{ minWidth: 0 }}
                >
                  {/* Background Image */}
                  <div className="jd-absolute jd-inset-0">
                    <img
                      src={tutorial.url}
                      alt={`Tutorial: ${tutorial.title}`}
                      className={`jd-w-full jd-h-full jd-object-contain jd-transition-all jd-duration-500 ${
                        isHovered ? 'jd-scale-105' : 'jd-scale-100'
                      }`}
                      draggable={false}
                    />
                    {/* Overlay Gradient */}
                    <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-t jd-from-black/80 jd-via-black/20 jd-to-transparent"></div>
                  </div>

                  {/* Content Overlay */}
                  <div className="jd-absolute jd-inset-0 jd-flex jd-flex-col jd-justify-end jd-p-4 md:jd-p-6">
                    <div className={`jd-transition-all jd-duration-300 ${isHovered ? 'jd-translate-y-0 jd-opacity-100' : 'jd-translate-y-2 jd-opacity-90'}`}>
                      <h4 className="jd-text-primary jd-font-bold jd-text-base md:jd-text-lg jd-mb-1">
                        {tutorial.title}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Video Library Section */}
        <div className="jd-space-y-4">
          <div className="jd-flex jd-items-center jd-gap-3">
            <div className="jd-w-1 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-blue-500 jd-rounded-full"></div>
            <h3 className="jd-text-lg jd-font-semibold jd-text-foreground">{getMessage('videoLibrary', undefined, 'Video Library')}</h3>
            <span className="jd-text-sm jd-text-muted-foreground jd-bg-muted jd-px-2 jd-py-1 jd-rounded-full">
              {videos.length} {getMessage('tutorials', undefined, 'tutorials')}
            </span>
          </div>

          <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-3">
            {videos.map((video, index) => {
              // Extract the icon component to render it properly
              const IconComponent = video.icon;
              
              
              return (
                <button
                  key={video.id}
                  onClick={() => openVideo(video.url, video.title)}
                  className="jd-group jd-flex jd-items-start jd-gap-4 jd-p-4 jd-rounded-xl jd-border jd-border-border/50 jd-bg-card hover:jd-bg-muted/50 jd-transition-all jd-duration-300 hover:jd-shadow-lg hover:jd-scale-[1.02] focus:jd-outline-none focus:jd-ring-2 focus:jd-ring-ring focus:jd-ring-offset-2 jd-text-left"
                >
                  {/* Video Icon Container */}
                  <div className="jd-flex-shrink-0 jd-w-12 jd-h-12 jd-bg-gradient-to-br jd-from-blue-500 jd-to-purple-600 jd-rounded-lg jd-flex jd-items-center jd-justify-center jd-shadow-lg group-hover:jd-shadow-xl jd-transition-all jd-duration-300 group-hover:jd-scale-110">
                    <IconComponent className="jd-w-5 jd-h-5 jd-text-primary" />
                  </div>

                  {/* Video Info */}
                  <div className="jd-flex-1 jd-min-w-0">
                    <div className="jd-flex jd-items-start jd-justify-between jd-gap-2 jd-mb-1">
                      <h4 className="jd-font-medium jd-text-foreground group-hover:jd-text-primary jd-transition-colors jd-duration-200 jd-truncate">
                        {video.title}
                      </h4>
                      <span className="jd-text-xs jd-text-muted-foreground jd-bg-muted jd-px-2 jd-py-1 jd-rounded jd-flex-shrink-0">
                        {video.duration}
                      </span>
                    </div>
                    <p className="jd-text-sm jd-text-muted-foreground jd-line-clamp-2 group-hover:jd-text-foreground/80 jd-transition-colors jd-duration-200">
                      {video.description}
                    </p>
                  </div>

                  {/* Arrow Icon */}
                  <div className="jd-flex-shrink-0 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-all jd-duration-300 jd-transform group-hover:jd-translate-x-1">
                    <Play className="jd-w-4 jd-h-4 jd-text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};