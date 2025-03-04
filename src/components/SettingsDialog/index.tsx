import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Settings {
  autoSave: boolean;
  autoSaveInterval: number;
  syncEnabled: boolean;
  statsVisible: boolean;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
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
        toast.success('Settings saved successfully');
        
        // Notify content script to apply changes
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: 'applySettings', 
              settings 
            });
          }
        });
        
        onOpenChange(false);
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Archimind Settings</DialogTitle>
          <DialogDescription>
            Configure how Archimind works with ChatGPT
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
                    Auto-save conversations
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
                      Auto-save interval (seconds)
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
                    Enable synchronization
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
                    Show stats panel
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
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};