import React, { useState } from 'react';
import { Video, Play, ExternalLink, Sparkles } from 'lucide-react';
import { BaseDialog } from '../BaseDialog';
import { useDialog, useDialogManager } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';

const GIF_URL =
  'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//shortchut_demo.gif';

const videos = [
  { id: 'v1', title: 'Getting Started with AI Tools', videoId: 'dQw4w9WgXcQ', duration: '3:45', description: 'Learn the basics of our AI-powered features' },
  { id: 'v2', title: 'Advanced Workflow Automation', videoId: 'oHg5SJYRHA0', duration: '5:20', description: 'Streamline your workflow with smart automation' },
  { id: 'v3', title: 'Keyboard Shortcuts Masterclass', videoId: 'dQw4w9WgXcQ', duration: '2:15', description: 'Boost productivity with essential shortcuts' },
  { id: 'v4', title: 'Integration Best Practices', videoId: 'oHg5SJYRHA0', duration: '7:30', description: 'Connect with your favorite tools seamlessly' },
  { id: 'v5', title: 'Tips & Tricks from Power Users', videoId: 'dQw4w9WgXcQ', duration: '4:55', description: 'Pro tips to maximize your efficiency' },
  { id: 'v6', title: 'Troubleshooting Common Issues', videoId: 'oHg5SJYRHA0', duration: '6:10', description: 'Quick solutions to frequent problems' },
];

const featuredTutorials = [
  { title: 'Quick Start Guide', subtitle: 'Get up and running in minutes' },
  { title: 'Pro Features', subtitle: 'Unlock advanced capabilities' },
  { title: 'Best Practices', subtitle: 'Learn from the experts' },
];

export const TutorialsDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.TUTORIALS_LIST);
  const { openDialog } = useDialogManager();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const openVideo = (videoId: string, title: string) => {
    openDialog(DIALOG_TYPES.TUTORIAL_VIDEO, { videoId, title });
  };

  const openSubstack = () => {
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
        <span>Stay updated with the latest features</span>
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
      onOpenChange={dialogProps.onOpenChange}
      title={getMessage('tutorials', undefined, 'Tutorials')}
      className="jd-max-w-6xl"
      footer={footer}
    >
      <div className="jd-flex jd-flex-col jd-space-y-8">
        {/* Featured Tutorials Section */}
        <div className="jd-space-y-4">
          <div className="jd-flex jd-items-center jd-gap-3">
            <div className="jd-w-1 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-500 jd-rounded-full"></div>
            <h3 className="jd-text-lg jd-font-semibold jd-text-foreground">Featured Tutorials</h3>
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
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ minWidth: 0 }}
                >
                  {/* Background Image */}
                  <div className="jd-absolute jd-inset-0">
                    <img
                      src={GIF_URL}
                      alt={`Tutorial: ${tutorial.title}`}
                      className={`jd-w-full jd-h-full jd-object-cover jd-transition-all jd-duration-500 ${
                        isHovered ? 'jd-scale-110' : 'jd-scale-105'
                      }`}
                      draggable={false}
                    />
                    {/* Overlay Gradient */}
                    <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-t jd-from-black/80 jd-via-black/20 jd-to-transparent"></div>
                  </div>

                  {/* Content Overlay */}
                  <div className="jd-absolute jd-inset-0 jd-flex jd-flex-col jd-justify-end jd-p-4 md:jd-p-6">
                    <div className={`jd-transition-all jd-duration-300 ${isHovered ? 'jd-translate-y-0 jd-opacity-100' : 'jd-translate-y-2 jd-opacity-90'}`}>
                      <h4 className="jd-text-white jd-font-semibold jd-text-base md:jd-text-lg jd-mb-1">
                        {tutorial.title}
                      </h4>
                      <p className="jd-text-white/80 jd-text-sm jd-leading-relaxed">
                        {tutorial.subtitle}
                      </p>
                    </div>
                    
                    {/* Play Button */}
                    <div className={`jd-absolute jd-top-1/2 jd-left-1/2 jd-transform -jd-translate-x-1/2 -jd-translate-y-1/2 jd-transition-all jd-duration-300 ${
                      isHovered ? 'jd-scale-100 jd-opacity-100' : 'jd-scale-75 jd-opacity-0'
                    }`}>
                      <div className="jd-w-16 jd-h-16 jd-bg-white/20 jd-backdrop-blur-sm jd-rounded-full jd-flex jd-items-center jd-justify-center jd-shadow-2xl">
                        <Play className="jd-w-6 jd-h-6 jd-text-white jd-ml-1" fill="currentColor" />
                      </div>
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
            <h3 className="jd-text-lg jd-font-semibold jd-text-foreground">Video Library</h3>
            <span className="jd-text-sm jd-text-muted-foreground jd-bg-muted jd-px-2 jd-py-1 jd-rounded-full">
              {videos.length} tutorials
            </span>
          </div>

          <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-3">
            {videos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => openVideo(video.videoId, video.title)}
                className="jd-group jd-flex jd-items-start jd-gap-4 jd-p-4 jd-rounded-xl jd-border jd-border-border/50 jd-bg-card hover:jd-bg-muted/50 jd-transition-all jd-duration-300 hover:jd-shadow-lg hover:jd-scale-[1.02] focus:jd-outline-none focus:jd-ring-2 focus:jd-ring-ring focus:jd-ring-offset-2 jd-text-left"
              >
                {/* Video Icon Container */}
                <div className="jd-flex-shrink-0 jd-w-12 jd-h-12 jd-bg-gradient-to-br jd-from-blue-500 jd-to-purple-600 jd-rounded-lg jd-flex jd-items-center jd-justify-center jd-shadow-lg group-hover:jd-shadow-xl jd-transition-all jd-duration-300 group-hover:jd-scale-110">
                  <Video className="jd-w-5 jd-h-5 jd-text-white" />
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
            ))}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};