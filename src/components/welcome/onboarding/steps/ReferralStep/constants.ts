import { getMessage } from '@/core/utils/i18n';

export const REFERRAL_SOURCES = [
  {
    value: 'search',
    label: getMessage('referralSourceSearch', undefined, 'Search Engine (Google, Bing, etc.)'),
  },
  { value: 'social_media', label: getMessage('referralSourceSocialMedia', undefined, 'Social Media') },
  { value: 'friend', label: getMessage('referralSourceFriend', undefined, 'Friend or Colleague') },
  { value: 'blog', label: getMessage('referralSourceBlog', undefined, 'Blog or Article') },
  { value: 'youtube', label: getMessage('referralSourceYouTube', undefined, 'YouTube') },
  { value: 'podcast', label: getMessage('referralSourcePodcast', undefined, 'Podcast') },
  { value: 'ad', label: getMessage('referralSourceAd', undefined, 'Advertisement') },
  { value: 'store', label: getMessage('referralSourceStore', undefined, 'Chrome Web Store') },
  { value: 'other', label: getMessage('referralSourceOther', undefined, 'Other') },
];
