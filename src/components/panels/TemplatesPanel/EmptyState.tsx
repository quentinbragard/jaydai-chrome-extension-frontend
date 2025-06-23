// src/components/panels/TemplatesPanel/components/EmptyState.tsx

import React from 'react';
import { FileText, PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMessage } from '@/core/utils/i18n';

interface EmptyStateProps {
  onCreateTemplate: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

/**
 * Reusable empty state component for when no templates are available
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  onCreateTemplate,
  onRefresh,
  refreshing = false
}) => {
  return (
    <div className="jd-py-8 jd-px-4 jd-text-center">
      <FileText className="jd-h-8 jd-w-8 jd-text-muted-foreground jd-mx-auto jd-mb-2 jd-opacity-40" />
      <p className="jd-text-sm jd-text-muted-foreground">
        {getMessage('noTemplates', undefined, "No templates available")}
      </p>
      <div className="jd-flex jd-flex-col jd-items-center jd-justify-center jd-gap-2 jd-mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCreateTemplate}
          className="jd-flex jd-items-center jd-w-full"
        >
          <PlusCircle className="jd-h-4 jd-w-4 jd-mr-1" />
          {getMessage('createFirstTemplate', undefined, 'Create Your First Template')}
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;