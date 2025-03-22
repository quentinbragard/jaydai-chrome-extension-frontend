// src/components/dialogs/SettingsDialog.tsx

import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useDialog } from '@/core/hooks/useDialog';

interface Settings {
  autoSave: boolean;
  autoSaveInterval: number;
  syncEnabled: boolean;
  statsVisible: boolean;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [settings, setSettings] = useState<Settings>({
    autoSave: true,
    autoSaveInterval: 60,
    syncEnabled: true,
    statsVisible: true
  });

  const [loading, setLoading] = useState(true);

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Get settings from chrome storage
      chrome.storage.sync.get(['archimindSettings'], (result) => {
        if (result.archimindSettings) {
          setSettings(result.archimindSettings);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      // Save settings to chrome storage
      chrome.storage.sync.set({ archimindSettings: settings }, () => {
        toast.success(chrome.i18n.getMessage('saveChanges') || 'Settings saved');
        
        // Notify content script to apply changes
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: 'applySettings', 
              settings 
            });
          }
        });
        
        // Close the dialog
        onOpenChange(false);
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(chrome.i18n.getMessage('saveFailed') || 'Failed to save settings');
    }
  };

  const handleChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{chrome.i18n.getMessage('archimindSettings') || 'Settings'}</DialogTitle>
          <DialogDescription>
            {chrome.i18n.getMessage('configureArchimind') || 'Configure Archimind settings'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="auto-save">
                    {chrome.i18n.getMessage('autoSaveConversations') || 'Auto-save conversations'}
                  </label>
                  <input
                    id="auto-save"
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleChange('autoSave', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                
                {settings.autoSave && (
                  <div className="flex items-center justify-between pl-4">
                    <label className="text-sm font-medium" htmlFor="auto-save-interval">
                      {chrome.i18n.getMessage('autoSaveInterval') || 'Auto-save interval (seconds)'}
                    </label>
                    <Input
                      id="auto-save-interval"
                      type="number"
                      min={10}
                      max={300}
                      value={settings.autoSaveInterval}
                      onChange={(e) => handleChange('autoSaveInterval', parseInt(e.target.value, 10))}
                      className="w-20"
                    />
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="sync-enabled">
                    {chrome.i18n.getMessage('enableSync') || 'Enable synchronization'}
                  </label>
                  <input
                    id="sync-enabled"
                    type="checkbox"
                    checked={settings.syncEnabled}
                    onChange={(e) => handleChange('syncEnabled', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="stats-visible">
                    {chrome.i18n.getMessage('showStatsPanel') || 'Show stats panel'}
                  </label>
                  <input
                    id="stats-visible"
                    type="checkbox"
                    checked={settings.statsVisible}
                    onChange={(e) => handleChange('statsVisible', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {chrome.i18n.getMessage('cancel') || 'Cancel'}
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            {chrome.i18n.getMessage('saveChanges') || 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// This exports both the dialog component and a standalone component that can be used
// with the DialogManager system
export default SettingsDialog;

// For use with DialogManager - this can be called anywhere in the app
export const StandaloneSettingsDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog('settings');
  
  return (
    <SettingsDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
    />
  );
};