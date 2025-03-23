import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export function PinButton({ isPinned, onClick, className }: { isPinned: boolean, onClick: () => void, className: string }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 w-6 p-0 ${isPinned ? 'text-yellow-500' : 'text-muted-foreground opacity-70 hover:opacity-100'} ${className}`}
        onClick={onClick}
        title={isPinned ? 'Unpin folder' : 'Pin folder'}
      >
        <Star className={`h-4 w-4 ${isPinned ? 'fill-yellow-500' : ''}`} />
      </Button>
    );
  }