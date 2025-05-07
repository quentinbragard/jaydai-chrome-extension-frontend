// Handle navigation to ChatGPT
import { trackEvent, EVENTS } from '@/utils/amplitude';

export const openAiTool = (url: string) => {
    trackEvent(EVENTS.ONBOARDING_GOTO_CHATGPT);
    chrome.tabs.create({ url: url });
  };