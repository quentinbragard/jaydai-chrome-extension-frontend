import { userApi } from '@/services/api/UserApi';

// Service to manage data collection preference
class DataCollectionService {
  private enabled: boolean = true;
  private initialized = false;
  private readonly storageKey = 'data_collection_enabled';

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([this.storageKey]);
        if (typeof result[this.storageKey] === 'boolean') {
          this.enabled = result[this.storageKey];
          return;
        }
      }
      const response = await userApi.getUserMetadata();
      if (response.success && response.data) {
        this.enabled = response.data.data_collection !== false;
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ [this.storageKey]: this.enabled });
        }
      }
    } catch (error) {
      console.error('Error loading data collection preference:', error);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [this.storageKey]: enabled });
    }
  }
}

export const dataCollectionService = new DataCollectionService();
