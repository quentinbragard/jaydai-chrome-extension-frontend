import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AddBlockButtonProps {
  onClick?: () => void;
  className?: string;
}

export const AddBlockButton: React.FC<AddBlockButtonProps> = ({ onClick, className }) => {
  return (
    <div className={`jd-relative jd-my-2 jd-flex jd-justify-center jd-items-center ${className || ''}`.trim()}>
      <div className="jd-absolute jd-inset-x-0 jd-border-t jd-border-dashed" />
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        className="jd-relative jd-bg-background"
      >
        <Plus className="jd-h-4 jd-w-4" />
      </Button>
    </div>
  );
};

export default AddBlockButton;
