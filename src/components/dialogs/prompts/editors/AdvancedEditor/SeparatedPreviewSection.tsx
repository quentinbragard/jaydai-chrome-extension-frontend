import React from 'react';
import { Eye } from 'lucide-react';

interface SeparatedPreviewSectionProps {
  beforeHtml: string;
  contentHtml: string;
  afterHtml: string;
}

export const SeparatedPreviewSection: React.FC<SeparatedPreviewSectionProps> = ({
  beforeHtml,
  contentHtml,
  afterHtml
}) => {
  return (
    <div className="jd-space-y-3 jd-flex-shrink-0">
      <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
        <Eye className="jd-h-5 jd-w-5" />
        Preview
      </h3>
      <div className="jd-border jd-rounded-lg jd-bg-background jd-text-sm jd-leading-relaxed jd-p-4 jd-space-y-4">
        {beforeHtml && (
          <div className="jd-border jd-border-dashed jd-rounded jd-p-3" dangerouslySetInnerHTML={{ __html: beforeHtml }} />
        )}
        {contentHtml && (
          <div className="jd-border jd-border-dashed jd-rounded jd-p-3" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        )}
        {afterHtml && (
          <div className="jd-border jd-border-dashed jd-rounded jd-p-3" dangerouslySetInnerHTML={{ __html: afterHtml }} />
        )}
      </div>
    </div>
  );
};
