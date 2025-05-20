import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';

export interface AddBlockControlsProps {
  blocks: Record<string, any[]>;
  onAdd: (type: string, id: string) => void;
  onCancel: () => void;
  className?: string;
}

export const AddBlockControls: React.FC<AddBlockControlsProps> = ({
  blocks,
  onAdd,
  onCancel,
  className = ''
}) => {
  const [selectedType, setSelectedType] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const blockTypes = Object.keys(blocks || {});

  return (
    <div className={`jd-flex jd-items-center jd-gap-2 jd-my-2 ${className}`.trim()}>
      <Select value={selectedType} onValueChange={setSelectedType}>
        <SelectTrigger className="jd-w-[180px]">
          <SelectValue placeholder={getMessage('selectBlockType', undefined, 'Select type')} />
        </SelectTrigger>
        <SelectContent>
          {blockTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedType && (
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="jd-flex-1">
            <SelectValue placeholder={getMessage('selectBlock', undefined, 'Select block')} />
          </SelectTrigger>
          <SelectContent>
            {blocks[selectedType]?.map((block: any) => (
              <SelectItem key={block.id} value={block.id.toString()}>
                {block.title || block.name || `Block ${block.id}`}
              </SelectItem>
            ))}
            <SelectItem value="custom">{getMessage('customBlock', undefined, 'Custom')}</SelectItem>
            <SelectItem value="0">{getMessage('addContent', undefined, 'Content')}</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Button
        size="sm"
        onClick={() => {
          onAdd(selectedType, selectedId);
          setSelectedType('');
          setSelectedId('');
        }}
        disabled={!selectedType || !selectedId}
      >
        <Plus className="jd-h-4 jd-w-4 jd-mr-1" />
        {getMessage('addBlock', undefined, 'Add Block')}
      </Button>

      <Button variant="ghost" size="icon" onClick={onCancel}>
        <X className="jd-h-4 jd-w-4" />
      </Button>
    </div>
  );
};

export default AddBlockControls;
