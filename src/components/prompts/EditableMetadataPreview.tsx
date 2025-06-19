import React from 'react';
import EditablePreviewContent from './EditablePreviewContent';
import { PromptMetadata, SingleMetadataType, MultipleMetadataType, MetadataItem } from '@/types/prompts/metadata';
import { getBlockTypeLabel, getBlockTextColors } from '@/utils/prompts/blockUtils';
import { resolveMetadataValues } from '@/utils/templates/promptPreviewUtils';
import { useTemplateEditor } from '@/components/dialogs/prompts/TemplateEditorDialog/TemplateEditorContext';
import { cloneMetadata } from '@/utils/prompts/metadataUtils';

interface EditableMetadataPreviewProps {
  metadata: PromptMetadata;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
}

const SINGLE_ORDER: SingleMetadataType[] = [
  'role',
  'context',
  'goal',
  'audience',
  'output_format',
  'tone_style'
];

const MULTI_KEY_MAP: Record<MultipleMetadataType, 'constraints' | 'examples'> = {
  constraint: 'constraints',
  example: 'examples'
};

export const EditableMetadataPreview: React.FC<EditableMetadataPreviewProps> = ({
  metadata,
  blockContentCache,
  isDarkMode
}) => {
  const { setMetadata } = useTemplateEditor();

  const resolved = React.useMemo(
    () => resolveMetadataValues(metadata, blockContentCache || {}),
    [metadata, blockContentCache]
  );

  const handleSingleChange = React.useCallback(
    (type: SingleMetadataType, value: string) => {
      setMetadata(prev => {
        const updated = cloneMetadata(prev);
        if (!updated.values) updated.values = {} as any;
        updated.values[type] = value;
        return updated;
      });
    },
    [setMetadata]
  );

  const handleMultiChange = React.useCallback(
    (type: MultipleMetadataType, id: string, value: string) => {
      setMetadata(prev => {
        const updated = cloneMetadata(prev);
        const key = MULTI_KEY_MAP[type];
        const arr: MetadataItem[] = (updated as any)[key] || [];
        (updated as any)[key] = arr.map(item =>
          item.id === id ? { ...item, value } : item
        );
        return updated;
      });
    },
    [setMetadata]
  );

  const items: React.ReactNode[] = [];

  SINGLE_ORDER.forEach(type => {
    const hasField =
      Object.prototype.hasOwnProperty.call(metadata, type) ||
      (metadata.values && Object.prototype.hasOwnProperty.call(metadata.values, type));
    if (!hasField) return;
    const value = resolved.values?.[type] || '';
    const color = getBlockTextColors(type as any, isDarkMode);
    const label = getBlockTypeLabel(type as any);
    items.push(
      <div key={type} className="jd-space-y-1">
        <div className={`jd-text-sm jd-font-semibold ${color}`}>{label}</div>
        <EditablePreviewContent
          content={value}
          onChange={val => handleSingleChange(type, val)}
          isDark={isDarkMode}
          showColors
          enableAdvancedEditing
        />
      </div>
    );
  });

  (['constraint', 'example'] as MultipleMetadataType[]).forEach(type => {
    const key = MULTI_KEY_MAP[type];
    const arr: MetadataItem[] = (metadata as any)[key] || [];
    arr.forEach(item => {
      const resolvedItem = (resolved as any)[key]?.find((it: MetadataItem) => it.id === item.id) || item;
      const value = resolvedItem.value || '';
      const color = getBlockTextColors(type as any, isDarkMode);
      const label = getBlockTypeLabel(type as any);
      items.push(
        <div key={item.id} className="jd-space-y-1">
          <div className={`jd-text-sm jd-font-semibold ${color}`}>{label}</div>
          <EditablePreviewContent
            content={value}
            onChange={val => handleMultiChange(type, item.id, val)}
            isDark={isDarkMode}
            showColors
            enableAdvancedEditing
          />
        </div>
      );
    });
  });

  if (items.length === 0) {
    return null;
  }

  return <div className="jd-space-y-4">{items}</div>;
};

export default EditableMetadataPreview;
