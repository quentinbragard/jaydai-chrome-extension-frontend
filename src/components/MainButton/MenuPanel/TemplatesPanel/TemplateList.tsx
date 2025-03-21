// src/features/templates/TemplateList.tsx

import React from 'react';
import { BookTemplate, FileText, Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TemplateItem } from './TemplateItem';
import { useTemplates } from '../../hooks/useTemplates';
import { EmptyState } from '@/components/ui/empty-state'

interface TemplateListProps {
  onClose?: () => void;
  maxHeight?: string;
}

export const TemplateList: React.FC<TemplateListProps> = ({ 
  onClose, 
  maxHeight = '400px' 
}) => {
  const {
    officialTemplates,
    userTemplates,
    loading,
    handleUseTemplate,
    handleEditTemplate,
    handleDeleteTemplate,
    handleCreateTemplate
  } = useTemplates();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base font-medium">Templates</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCreateTemplate}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          New
        </Button>
      </CardHeader>
      
      <CardContent paddingless>
        <div 
          className="overflow-y-auto py-1" 
          style={{ maxHeight }}
        >
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading templates...</p>
            </div>
          ) : (
            <div>
              {/* Official Templates Section */}
              {officialTemplates.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                    <BookTemplate className="mr-2 h-4 w-4" />
                    Official Templates
                  </div>
                  {officialTemplates.map(template => (
                    <TemplateItem
                      key={`official-${template.id}`}
                      template={template}
                      onUse={handleUseTemplate}
                      onEdit={handleEditTemplate}
                      onDelete={handleDeleteTemplate}
                    />
                  ))}
                </div>
              )}

              {/* User Templates Section */}
              {userTemplates.length > 0 && (
                <div className="p-2 border-t">
                  <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                    <Folder className="mr-2 h-4 w-4" />
                    My Templates
                  </div>
                  {userTemplates.map(template => (
                    <TemplateItem
                      key={`user-${template.id}`}
                      template={template}
                      onUse={handleUseTemplate}
                      onEdit={handleEditTemplate}
                      onDelete={handleDeleteTemplate}
                    />
                  ))}
                </div>
              )}
              
              {/* Empty state */}
              {officialTemplates.length === 0 && userTemplates.length === 0 && (
                <EmptyState
                  icon={<FileText className="h-12 w-12 text-muted-foreground/40" />}
                  title="No templates found"
                  description="Create your first template to get started"
                  action={
                    <Button 
                      onClick={handleCreateTemplate}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Create Template
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};