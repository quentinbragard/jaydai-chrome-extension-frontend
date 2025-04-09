import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { getMessage } from '@/core/utils/i18n';

export function PinButton({ isPinned, onClick, className }: { isPinned: boolean, onClick: () => void, className: string }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`jd-h-6 jd-w-6 jd-p-0 ${isPinned ? 'jd-text-yellow-500' : 'jd-text-muted-foreground jd-opacity-70 jd-hover:jd-opacity-100'} ${className}`}
        onClick={onClick}
        title={isPinned ? getMessage('unpin_folder', undefined, 'Unpin folder') : getMessage('pin_folder', undefined, 'Pin folder')}
      >
        <Star className={`jd-h-4 jd-w-4 ${isPinned ? 'jd-fill-yellow-500' : ''}`} />
      </Button>
    );
  }