// src/components/dialogs/prompts/UnifiedTemplateDialog/TemplateDialogContent.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';
import { BasicEditor } from '../editors/BasicEditor';
import { AdvancedEditor } from '../editors/AdvancedEditor';

export const TemplateDialogContent: React.FC = () => {
  const { state, actions } = useTemplateEditor();

  if (state.dialog.isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-64">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
        <span className="jd-ml-3 jd-text-gray-600">Loading template...</span>
      </div>
    );
  }

  return (
    <div className="jd-flex-1 jd-flex jd-flex-col jd-gap-4">
      <Tabs
        value={state.content.activeTab}
        onValueChange={(tab) => actions.updateActiveTab(tab as 'basic' | 'advanced')}
        className="jd-flex-1 jd-flex jd-flex-col"
      >
        <TabsList className="jd-grid jd-w-full jd-grid-cols-2 jd-mb-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="jd-flex-1 jd-overflow-y-auto">
          <BasicEditor />
        </TabsContent>

        <TabsContent value="advanced" className="jd-flex-1 jd-overflow-y-auto">
          <AdvancedEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};