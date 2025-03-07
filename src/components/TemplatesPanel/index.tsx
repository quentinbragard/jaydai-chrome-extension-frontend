import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, X, BookTemplate, Folder } from "lucide-react";
import { useTemplates } from './useTemplates';
import { TemplatesPanelProps } from './types';
import TemplateItem from './TemplateItem';
import FolderTree from './FolderTree';
import TemplateDialog from './TemplateDialog';

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ 
  onClose, 
  maxHeight = '400px' 
}) => {
  const {
    templateCollection,
    loading,
    expandedFolders,
    editDialogOpen,
    setEditDialogOpen,
    currentTemplate,
    templateFormData,
    setTemplateFormData,
    toggleFolder,
    handleUseTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    captureCurrentPromptAsTemplate
  } = useTemplates();

  console.log("templateCollection============", templateCollection);

  // Safely get templates with fallback
  const officialTemplates = templateCollection?.officialTemplates?.templates || [];
  const officialFolders = templateCollection?.officialTemplates?.folders || [];
  const userTemplates = templateCollection?.userTemplates?.templates || [];
  const userFolders = templateCollection?.userTemplates?.folders || [];

  // Function to call handleUseTemplate with onClose callback
  const onTemplateClick = (template) => {
    handleUseTemplate(template, onClose);
  };

  return (
    <>
      <Card className="w-96 shadow-lg">
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Prompt Templates
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={captureCurrentPromptAsTemplate}
              className="h-7 px-2 text-xs"
              title="Create from current prompt"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
            {onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-0">
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
                    {/* Root-level official templates */}
                    {officialTemplates
                      .filter(t => !t.folder)
                      .map(template => (
                        <TemplateItem
                          key={template.id}
                          template={{
                            ...template,
                            title: template.title || template.name
                          }}
                          onUseTemplate={onTemplateClick}
                          onEditTemplate={openEditDialog}
                          onDeleteTemplate={handleDeleteTemplate}
                        />
                      ))}
                    
                    {/* Official Template Folders */}
                    {officialFolders.map(folder => (
                      <FolderTree
                        key={folder.path}
                        folder={{
                          ...folder,
                          templates: folder.templates.map(t => ({
                            ...t,
                            title: t.title || t.name
                          }))
                        }}
                        expandedFolders={expandedFolders}
                        onToggleFolder={toggleFolder}
                        onUseTemplate={onTemplateClick}
                        onEditTemplate={openEditDialog}
                        onDeleteTemplate={handleDeleteTemplate}
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
                    {/* Root-level user templates */}
                    {userTemplates
                      .filter(t => !t.folder)
                      .map(template => (
                        <TemplateItem
                          key={template.id}
                          template={{
                            ...template,
                            title: template.title || template.name
                          }}
                          onUseTemplate={onTemplateClick}
                          onEditTemplate={openEditDialog}
                          onDeleteTemplate={handleDeleteTemplate}
                        />
                      ))}
                    
                    {/* User Template Folders */}
                    {userFolders.map(folder => (
                      <FolderTree
                        key={folder.path}
                        folder={{
                          ...folder,
                          templates: folder.templates.map(t => ({
                            ...t,
                            title: t.title || t.name
                          }))
                        }}
                        expandedFolders={expandedFolders}
                        onToggleFolder={toggleFolder}
                        onUseTemplate={onTemplateClick}
                        onEditTemplate={openEditDialog}
                        onDeleteTemplate={handleDeleteTemplate}
                      />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {officialTemplates.length === 0 && 
                 userTemplates.length === 0 && (
                  <div className="py-8 px-4 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No templates found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(null)}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create your first template
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <TemplateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentTemplate={currentTemplate}
        formData={templateFormData}
        onFormChange={setTemplateFormData}
        onSaveTemplate={handleSaveTemplate}
      />
    </>
  );
};

export default TemplatesPanel;