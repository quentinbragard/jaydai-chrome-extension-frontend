// src/components/common/DeleteButton.tsx
import React, { useState, memo } from 'react';
import { Trash, MoreVertical, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/core/utils/classNames';
import { getMessage } from '@/core/utils/i18n';
interface DeleteButtonProps {
  onDelete: () => Promise<void | boolean> | void;
  itemType: 'folder' | 'template' | string;
  itemName?: string;
  showIcon?: boolean;
  stopPropagation?: boolean;
  className?: string;
  disabled?: boolean;
  confirmationMessage?: string;
}

/**
 * Reusable delete button component with confirmation dialog
 */
export const DeleteButton = memo(function DeleteButton({
  onDelete,
  itemType,
  itemName,
  showIcon = false,
  stopPropagation = false,
  className = '',
  disabled = false,
  confirmationMessage
}: DeleteButtonProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Format item type for display using i18n when available
  const displayType = getMessage(
    itemType,
    undefined,
    itemType.charAt(0).toUpperCase() + itemType.slice(1)
  );
  const displayTypeLower = getMessage(itemType, undefined, itemType).toLowerCase();

  // Handle opening delete dialog
  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    setIsDeleteDialogOpen(true);
  };

  // Handle actual delete operation
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Generate confirmation message
  const getConfirmationMessage = () => {
    if (confirmationMessage) return confirmationMessage;

    const baseMessage = itemName
      ? getMessage(
          'deleteConfirmMessage',
          [displayTypeLower, itemName],
          `This will permanently delete ${displayTypeLower} "${itemName}".`
        )
      : getMessage(
          'deleteConfirmMessageNoName',
          [displayTypeLower],
          `This will permanently delete this ${displayTypeLower}.`
        );

    const additionalInfo =
      itemType === 'folder'
        ? ` ${getMessage(
            'deleteFolderWarning',
            undefined,
            'All templates inside this folder will also be deleted.'
          )}`
        : '';

    const actionWarning = ` ${getMessage(
      'deleteActionWarning',
      undefined,
      'This action cannot be undone.'
    )}`;

    return `${baseMessage}${additionalInfo}${actionWarning}`;
  };

  return (
    <>
      {/* Use dropdown for delete when not showing direct icon */}
      {!showIcon ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => stopPropagation && e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              className={cn(
                'jd-h-6 jd-w-6 jd-p-0 jd-flex-shrink-0 jd-text-muted-foreground jd-opacity-70 hover:jd-opacity-100',
                className
              )}
            >
              <MoreVertical className="jd-h-4 jd-w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleOpenDeleteDialog}
              className="jd-text-destructive jd-cursor-pointer"
            >
              <Trash className="jd-h-4 jd-w-4 jd-mr-2" />
              {getMessage('deleteItem', [displayType], `Delete ${displayType}`)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Show direct delete button if showIcon is true
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn('jd-h-6 jd-w-6 jd-p-0 jd-text-destructive', className)}
          onClick={handleOpenDeleteDialog}
          disabled={disabled}
        >
          <Trash className="jd-h-4 jd-w-4" />
        </Button>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="jd-flex jd-items-center">
              <AlertTriangle className="jd-h-5 jd-w-5 jd-mr-2 jd-text-destructive" />
              {getMessage('deleteConfirmTitle', [displayType], `Delete ${displayType}`)}
            </DialogTitle>
            <DialogDescription>
              {getConfirmationMessage()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {getMessage('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? getMessage('deleting', undefined, 'Deleting...')
                : getMessage('delete', undefined, 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default DeleteButton;