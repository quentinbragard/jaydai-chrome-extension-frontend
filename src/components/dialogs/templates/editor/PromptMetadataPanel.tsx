// src/components/dialogs/templates/editor/PromptMetadataPanel.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  X, 
  Settings, 
  ChevronDown,
  Info
} from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { 
  MetadataField, 
  MetadataType, 
  METADATA_CONFIGS, 
  DEFAULT_METADATA_FIELDS,
  PromptMetadata 
} from '@/components/templates/metadata/types';

interface PromptMetadataPanelProps {
  metadata: PromptMetadata;
  onUpdateMetadata: (metadata: PromptMetadata) => void;
  className?: string;
}

export const PromptMetadataPanel: React.FC<PromptMetadataPanelProps> = ({
  metadata,
  onUpdateMetadata,
  className
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Group metadata configs by category
  const categorizedConfigs = Object.entries(METADATA_CONFIGS).reduce((acc, [type, config]) => {
    const category = config.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ type: type as MetadataType, config });
    return acc;
  }, {} as Record<string, Array<{ type: MetadataType; config: typeof METADATA_CONFIGS[MetadataType] }>>);

  const handleUpdateField = (fieldId: string, value: string) => {
    const updatedFields = metadata.fields.map(field =>
      field.id === fieldId ? { ...field, value } : field
    );
    onUpdateMetadata({ fields: updatedFields });
  };

  const handleAddField = (type: MetadataType) => {
    const config = METADATA_CONFIGS[type];
    const newField: MetadataField = {
      id: `${type}_${Date.now()}`,
      type,
      label: config.label,
      value: '',
      placeholder: config.placeholder,
      description: config.description,
      inputType: config.inputType,
      options: config.options
    };

    onUpdateMetadata({
      fields: [...metadata.fields, newField]
    });
    setShowAddMenu(false);
  };

  const handleRemoveField = (fieldId: string) => {
    const updatedFields = metadata.fields.filter(field => field.id !== fieldId);
    onUpdateMetadata({ fields: updatedFields });
  };

  const canRemoveField = (field: MetadataField) => {
    // Can't remove required fields or if it would leave us with no fields of that type
    return !field.required;
  };

  const getAvailableMetadataTypes = () => {
    const usedTypes = new Set(metadata.fields.map(field => field.type));
    return Object.keys(METADATA_CONFIGS).filter(type => 
      !usedTypes.has(type as MetadataType)
    ) as MetadataType[];
  };

  const renderField = (field: MetadataField) => {
    const config = METADATA_CONFIGS[field.type];
    
    return (
      <Card key={field.id} className="jd-group jd-transition-all hover:jd-shadow-sm">
        <CardContent className="jd-p-4">
          <div className="jd-flex jd-items-start jd-justify-between jd-gap-3">
            <div className="jd-flex-1 jd-space-y-2">
              <div className="jd-flex jd-items-center jd-gap-2">
                <span className="jd-text-lg">{config.icon}</span>
                <Label className="jd-text-sm jd-font-medium">
                  {field.label}
                  {field.required && <span className="jd-text-red-500 jd-ml-1">*</span>}
                </Label>
                {field.description && (
                  <div className="jd-group/tooltip jd-relative">
                    <Info className="jd-h-3 jd-w-3 jd-text-muted-foreground jd-cursor-help" />
                    <div className="jd-absolute jd-bottom-full jd-left-1/2 jd-transform jd--translate-x-1/2 jd-mb-2 jd-px-2 jd-py-1 jd-bg-gray-900 jd-text-white jd-text-xs jd-rounded jd-opacity-0 jd-pointer-events-none group-hover/tooltip:jd-opacity-100 jd-transition-opacity jd-whitespace-nowrap jd-z-10">
                      {field.description}
                    </div>
                  </div>
                )}
              </div>

              {field.inputType === 'select' && field.options ? (
                <Select value={field.value} onValueChange={(value) => handleUpdateField(field.id, value)}>
                  <SelectTrigger className="jd-w-full">
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.inputType === 'textarea' ? (
                <Textarea
                  value={field.value}
                  onChange={(e) => handleUpdateField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={2}
                  className="jd-text-sm"
                />
              ) : (
                <Input
                  type={field.inputType === 'number' ? 'number' : 'text'}
                  value={field.value}
                  onChange={(e) => handleUpdateField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="jd-text-sm"
                />
              )}

              {field.value && field.type !== 'language' && (
                <div className="jd-text-xs jd-text-muted-foreground jd-italic">
                  This will be added to your prompt automatically
                </div>
              )}
            </div>

            {canRemoveField(field) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveField(field.id)}
                className="jd-h-6 jd-w-6 jd-p-0 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-text-red-500 hover:jd-text-red-700"
              >
                <X className="jd-h-3 jd-w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const availableTypes = getAvailableMetadataTypes();

  return (
    <div className={cn("jd-space-y-4", className)}>
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between">
        <div className="jd-flex jd-items-center jd-gap-2">
          <Settings className="jd-h-5 jd-w-5" />
          <h3 className="jd-font-semibold jd-text-lg">Prompt Metadata</h3>
        </div>
        
        {availableTypes.length > 0 && (
          <div className="jd-relative">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="jd-flex jd-items-center jd-gap-1"
            >
              <Plus className="jd-h-4 jd-w-4" />
              Add Property
              <ChevronDown className="jd-h-3 jd-w-3" />
            </Button>

            {showAddMenu && (
              <Card className="jd-absolute jd-top-full jd-right-0 jd-mt-2 jd-w-80 jd-z-10 jd-shadow-lg">
                <CardContent className="jd-p-3">
                  <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
                    <h4 className="jd-font-medium jd-text-sm">Add Metadata Property</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddMenu(false)}
                      className="jd-h-6 jd-w-6 jd-p-0"
                    >
                      <X className="jd-h-3 jd-w-3" />
                    </Button>
                  </div>
                  
                  <div className="jd-space-y-3">
                    {Object.entries(categorizedConfigs).map(([category, items]) => (
                      <div key={category}>
                        <h5 className="jd-text-xs jd-font-medium jd-text-muted-foreground jd-uppercase jd-tracking-wider jd-mb-2">
                          {category.replace('_', ' ')}
                        </h5>
                        <div className="jd-space-y-1">
                          {items
                            .filter(({ type }) => availableTypes.includes(type))
                            .map(({ type, config }) => (
                              <div
                                key={type}
                                className="jd-flex jd-items-center jd-gap-3 jd-p-2 jd-rounded jd-cursor-pointer hover:jd-bg-accent jd-transition-colors"
                                onClick={() => handleAddField(type)}
                              >
                                <span className="jd-text-lg">{config.icon}</span>
                                <div className="jd-flex-1">
                                  <div className="jd-font-medium jd-text-sm">{config.label}</div>
                                  <div className="jd-text-xs jd-text-muted-foreground">{config.description}</div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="jd-text-sm jd-text-muted-foreground">
        Set metadata properties that will be automatically included in your prompt to guide the AI's response.
      </p>

      {/* Metadata Fields */}
      <div className="jd-space-y-3">
        {metadata.fields.map(renderField)}
      </div>

      {/* Preview */}
      {metadata.fields.some(field => field.value.trim()) && (
        <Card className="jd-border-dashed jd-border-primary/20 jd-bg-primary/5">
          <CardHeader className="jd-pb-2">
            <CardTitle className="jd-text-sm jd-text-primary">Generated Metadata Instructions</CardTitle>
          </CardHeader>
          <CardContent className="jd-pt-0">
            <div className="jd-text-sm jd-font-mono jd-bg-background jd-p-3 jd-rounded jd-border">
              {metadata.fields
                .filter(field => field.value.trim())
                .map(field => {
                  const config = METADATA_CONFIGS[field.type];
                  return `${config.label}: ${field.value}`;
                })
                .join('\n')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};