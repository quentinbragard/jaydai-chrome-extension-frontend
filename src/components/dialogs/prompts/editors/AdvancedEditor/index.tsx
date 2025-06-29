// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx - Simplified Version
import React from 'react';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { MetadataSection } from './MetadataSection';
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import TemplatePreview from '@/components/prompts/TemplatePreview';
import { getMessage } from '@/core/utils/i18n';

interface AdvancedEditorProps {
  mode?: 'create' | 'customize';
  isProcessing?: boolean;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  mode = 'customize',
  isProcessing = false
}) => {
  const {
    metadata,
    content,
    availableMetadataBlocks,
    blockContentCache
  } = useTemplateEditor();
  
  const isDarkMode = useThemeDetector();

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
        <span className="jd-ml-3 jd-text-gray-600">Loading template...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'jd-h-full jd-flex jd-flex-col jd-relative jd-overflow-hidden jd-space-y-6',
        isDarkMode
          ? 'jd-bg-gradient-to-br jd-from-gray-900 jd-via-gray-800 jd-to-gray-900'
          : 'jd-bg-gradient-to-br jd-from-slate-50 jd-via-white jd-to-slate-100'
      )}
    >
      <div className="jd-relative jd-z-10 jd-flex-1 jd-flex jd-flex-col jd-space-y-6 jd-p-6 jd-overflow-y-auto">
        
        {/* 1. PRIMARY METADATA SECTION */}
        <div className="jd-flex-shrink-0">
          <MetadataSection
            availableMetadataBlocks={availableMetadataBlocks}
            showPrimary={true}
            showSecondary={false}
          />
        </div>

        {/* 2. PREVIEW SECTION - Read Only */}
        <div className="jd-flex-shrink-0">
          <div className="jd-space-y-3">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-600 jd-rounded-full"></span>
              {getMessage('completePreview', undefined, 'Complete Preview')}
            </h3>
            
            <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-blue-500/10 jd-to-purple-500/10 jd-border-blue-200 jd-dark:jd-border-blue-700">
              <TemplatePreview
                metadata={metadata}
                content={content}
                blockContentCache={blockContentCache}
                isDarkMode={isDarkMode}
                className="jd-max-h-[500px] jd-overflow-auto"
              />
            </div>
          </div>
        </div>

        {/* 3. SECONDARY METADATA SECTION */}
        <div className="jd-flex-shrink-0">
          <MetadataSection
            availableMetadataBlocks={availableMetadataBlocks}
            showPrimary={false}
            showSecondary={true}
          />
        </div>
      </div>
    </div>
  );
};