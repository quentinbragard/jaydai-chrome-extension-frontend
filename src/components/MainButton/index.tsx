import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Clock, Settings } from "lucide-react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";

interface MainButtonProps {
  onSettingsClick?: () => void;
  onSaveClick?: () => void;
}

export const MainButton: React.FC<MainButtonProps> = ({ 
  onSettingsClick,
  onSaveClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSaveClick = () => {
    if (onSaveClick) onSaveClick();
    setIsOpen(false);
  };
  
  const handleSettingsClick = () => {
    if (onSettingsClick) onSettingsClick();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            className="h-12 w-12 rounded-full shadow-lg"
            variant="primary"
          >
            <PlusCircle className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="w-60 p-2 sm:right-20 sm:bottom-16 sm:absolute sm:top-auto sm:left-auto">
          <div className="flex flex-col gap-2 py-2">
            <Button 
              onClick={handleSaveClick}
              className="justify-start"
              variant="ghost"
            >
              <FileText className="mr-2 h-5 w-5" />
              Save Conversation
            </Button>
            
            <Button 
              className="justify-start"
              variant="ghost"
            >
              <Clock className="mr-2 h-5 w-5" />
              View History
            </Button>
            
            <Button 
              onClick={handleSettingsClick}
              className="justify-start"
              variant="ghost"
            >
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};