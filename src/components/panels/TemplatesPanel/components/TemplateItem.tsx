// src/components/panels/TemplatesPanel/components/TemplateItem.tsx

import React from 'react';
import { FileText, Edit, Trash, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Template } from '@/types/templates';

interface TemplateItemProps {
  template: Template;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
}

/**
 * Component for rendering a single template item with improved usage stats
 */
export const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate
}) => {
  // Ensure we have a display name, falling back through various options
  const displayName = template.title || 'Untitled Template';
  
  // Safely handle usage count
  const usageCount = typeof template.usage_count === 'number' ? template.usage_count : 0;
  
  // Format last used date if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      // Check if it's today
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return 'today';
      }
      
      // Check if it's yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'yesterday';
      }
      
      // Otherwise return formatted date
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return null;
    }
  };
  
  const lastUsedText = formatDate(template.last_used_at);
  
  // Render usage indicator based on frequency
  const renderUsageIndicator = () => {
    if (usageCount === 0) {
      return null;
    }
    
    if (usageCount >= 5) {
      // Popular template
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-xs text-primary">
                <Activity className="h-3 w-3 mr-1 text-primary" />
                <span>Popular</span>
                <Badge variant="outline" className="ml-1 h-4 px-1 py-0 text-xs">
                  {usageCount}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Used {usageCount} times</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (lastUsedText) {
      // Recently used template
      return (
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          <span>Last used {lastUsedText}</span>
        </div>
      );
    }
    
    // Default usage count
    return (
      <div className="text-xs text-muted-foreground">
        Used {usageCount} {usageCount === 1 ? 'time' : 'times'}
      </div>
    );
  };
  
  return (
    <div 
      className="flex items-center p-2 hover:bg-accent/60 rounded-sm cursor-pointer group"
      onClick={() => onUseTemplate(template)}
    >
      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{displayName}</div>
        {template.description && (
          <div className="text-xs text-muted-foreground truncate">{template.description}</div>
        )}
        {/* Improved usage display */}
        {renderUsageIndicator()}
      </div>
      {/* Only show edit/delete for user templates */}
      {template.type === "user" && (
        <div className="ml-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEditTemplate(template);
            }}
            title="Edit template"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTemplate(template, e);
            }}
            title="Delete template"
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};