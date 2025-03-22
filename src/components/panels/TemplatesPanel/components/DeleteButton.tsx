// src/components/panels/TemplatesPanel/components/DeleteButton.tsx

import React, { useState } from 'react';
import { Trash, MoreVertical, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DeleteButtonProps {
  onDelete: () => Promise<void | boolean> | void;
  itemType: 'folder' | 'template';
  showIcon?: boolean;
  stopPropagation?: boolean;
  className?: string;
}

/**
 * Reusable delete button component with confirmation dialog
 */
const DeleteButton: React.FC<DeleteButtonProps> = ({
  onDelete,
  itemType,
  showIcon = false,
  stopPropagation = false,
  className = ''
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <>
      {/* Use dropdown for delete when not showing direct icon */}
      {!showIcon ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => stopPropagation && e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 flex-shrink-0 text-muted-foreground opacity-70 hover:opacity-100 ${className}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={handleOpenDeleteDialog} 
              className="text-destructive cursor-pointer"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete {itemType === 'folder' ? 'Folder' : 'Template'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Show direct delete button if showIcon is true
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-6 w-6 p-0 text-destructive ${className}`}
          onClick={handleOpenDeleteDialog}
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Delete {itemType === 'folder' ? 'Folder' : 'Template'}
            </DialogTitle>
            <DialogDescription>
              {itemType === 'folder' 
                ? 'This will permanently delete the folder and all templates inside it.' 
                : 'This will permanently delete this template.'} 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteButton;