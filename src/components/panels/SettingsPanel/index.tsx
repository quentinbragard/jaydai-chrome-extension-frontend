// src/components/panels/SettingsPanel/index.tsx - Refined for narrow panel
import React, { useState, useEffect, useRef } from 'react';
import { Settings, ExternalLink, Shield, Eye, EyeOff, Crown, AlertTriangle, Gift, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import BasePanel from '../BasePanel';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { userApi } from '@/services/api/UserApi';
import { useSubscriptionStatus } from '@/hooks/subscription/useSubscriptionStatus';

interface SettingsPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  maxHeight?: string;
}

/**
 * Settings panel that displays user preferences and account options
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  showBackButton,
  onBack,
  onClose, 
  maxHeight = '75vh' 
}) => {
  const { openDialog } = useDialogManager();
  const {
    subscription,
    loading: subscriptionLoading,
    refreshStatus,
  } = useSubscriptionStatus();

  console.log('subscription --->', subscription);
  
  const [dataCollection, setDataCollection] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Use ref to track if we've already refreshed to avoid infinite loops
  const hasRefreshedRef = useRef(false);

  // Load user preferences on mount
  useEffect(() => {
    trackEvent(EVENTS.SETTINGS_PANEL_OPENED);
    loadUserPreferences();
    
    // Only refresh subscription once when panel opens
    if (!hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshStatus();
    }
    
    // Reset ref when component unmounts
    return () => {
      hasRefreshedRef.current = false;
    };
  }, []); // Empty dependency array to avoid infinite loops

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUserMetadata();
      
      if (response.success && response.data) {
        setDataCollection(response.data.data_collection !== false);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      toast.error(getMessage('error_loading_preferences', undefined, 'Failed to load preferences'));
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const updateDataCollection = async (enabled: boolean) => {
    try {
      setLoading(true);
      
      const response = await userApi.updateDataCollection(enabled);
      
      if (response.success) {
        setDataCollection(enabled);
        toast.success(
          enabled 
            ? getMessage('data_collection_enabled', undefined, 'Data collection enabled')
            : getMessage('data_collection_disabled', undefined, 'Data collection disabled')
        );
        
        trackEvent(EVENTS.DATA_COLLECTION_TOGGLED, {
          enabled,
          source: 'settings_panel'
        });
      } else {
        throw new Error(response.message || 'Failed to update preference');
      }
    } catch (error) {
      console.error('Error updating data collection:', error);
      toast.error(getMessage('error_updating_preference', undefined, 'Failed to update preference'));
    } finally {
      setLoading(false);
    }
  };

  const handleDataCollectionToggle = (enabled: boolean) => {
    if (enabled) {
      updateDataCollection(true);
    } else {
      openDialog(DIALOG_TYPES.CONFIRMATION, {
        title: getMessage('disable_data_collection', undefined, 'Disable Data Collection'),
        description: getMessage('disable_data_collection_warning', undefined, 'Warning: Without data collection, you won\'t be able to see your AI statistics and usage analytics. Are you sure you want to continue?'),
        confirmText: getMessage('disable', undefined, 'Disable'),
        cancelText: getMessage('cancel', undefined, 'Cancel'),
        onConfirm: () => updateDataCollection(false),
        onCancel: () => setDataCollection(true)
      });
    }
  };

  const handleManageSubscription = () => {
    trackEvent(EVENTS.MANAGE_SUBSCRIPTION_CLICKED, {
      source: 'settings_panel',
      subscription_status: subscription?.status,
      subscription_plan: subscription?.planName
    });
    openDialog(DIALOG_TYPES.MANAGE_SUBSCRIPTION);
  };

  const handleExternalLink = (url: string, type: string) => {
    trackEvent(EVENTS.EXTERNAL_LINK_CLICKED, {
      url,
      type,
      source: 'settings_panel'
    });
    window.open(url, '_blank');
  };

  const handleShare = () => {
    trackEvent(EVENTS.SHARE_DIALOG_OPENED, { source: 'settings_panel' });
    openDialog(DIALOG_TYPES.SHARE);
  };

  const getSubscriptionButtonText = () => {
    if (subscriptionLoading || subscription === null) return getMessage('loading', undefined, 'Loading...');
    
    if (subscription?.status === 'active' || subscription?.status === 'trialing') {
      return getMessage('manage', undefined, 'Manage');
    }
    
    if (subscription?.status === 'past_due') {
      return getMessage('update_payment', undefined, 'Update Payment');
    }
    
    if (subscription?.status === 'cancelled') {
      return getMessage('reactivate', undefined, 'Reactivate');
    }
    
    return getMessage('startTrial', undefined, 'Start Trial');
  };

  const getSubscriptionDescription = () => {
    if (subscription?.status === 'active') {
      return getMessage('manage_subscription_desc', undefined, 'Manage your active subscription');
    }
    
    if (subscription?.status === 'trialing') {
      return getMessage('trial_subscription_desc', undefined, 'You are in your trial period');
    }
    
    if (subscription?.status === 'past_due') {
      return getMessage('past_due_subscription_desc', undefined, 'Payment is overdue - update payment method');
    }
    
    if (subscription?.status === 'cancelled') {
      return getMessage('cancelled_subscription_desc', undefined, 'Reactivate your cancelled subscription');
    }
    
    return getMessage('try_premium_free', undefined, '3-day free trial • No commitment');
  };

  const getSubscriptionTitle = () => {
    if (subscription?.status === 'active' || subscription?.status === 'trialing') {
      return getMessage('manage_subscription', undefined, 'Manage Subscription');
    }
    
    return getMessage('upgradeToPremium', undefined, 'Upgrade to Premium');
  };

  const getSubscriptionStatus = () => {
    if (subscription?.status === 'active') {
      return { label: getMessage('active', undefined, 'Active'), color: 'jd-bg-green-100 jd-text-green-800' };
    }
    
    if (subscription?.status === 'trialing') {
      return { label: getMessage('trial', undefined, 'Trial'), color: 'jd-bg-blue-100 jd-text-blue-800' };
    }
    
    if (subscription?.status === 'past_due') {
      return { label: getMessage('past_due', undefined, 'Past Due'), color: 'jd-bg-red-100 jd-text-red-800' };
    }
    
    if (subscription?.status === 'cancelled') {
      return { label: getMessage('cancelled', undefined, 'Cancelled'), color: 'jd-bg-yellow-100 jd-text-yellow-800' };
    }
    
    return { label: getMessage('free', undefined, 'Free'), color: 'jd-bg-gray-100 jd-text-gray-600' };
  };

  const subscriptionStatus = getSubscriptionStatus();
  const isNonSubscriber = subscription?.status !== 'active' && subscription?.status !== 'trialing';

  const subscriptionItem = {
    id: 'subscription',
    icon: subscription?.status === 'active' || subscription?.status === 'trialing'
      ? <Crown className="jd-h-5 jd-w-5 jd-text-blue-500" />
      : <Gift className="jd-h-5 jd-w-5 jd-text-green-500" />,
    title: getSubscriptionTitle(),
    description: isNonSubscriber ? undefined : getSubscriptionDescription(),
    action: handleManageSubscription,
    type: 'button' as const,
    highlight: isNonSubscriber,
    badge: subscription?.status === 'active' || subscription?.status === 'trialing' ? (
      <Badge className={`jd-text-xs ${subscriptionStatus.color}`}>
        {subscriptionStatus.label}
      </Badge>
    ) : (
      <div className="jd-flex jd-items-center jd-space-x-1 jd-animate-bounce jd-mt-1">
        <Badge className="jd-bg-green-500 jd-text-white !jd-text-xs !jd-font-medium">
          {getMessage('freeTrial', undefined, 'Free Trial')}
        </Badge>
      </div>
    ),
    badgeAsSubtitle: isNonSubscriber,
    warning: subscription?.status === 'past_due' || subscription?.status === 'cancelled'
  };

  const settingsItems = [
    subscriptionItem,
    {
      id: 'share',
      icon: <Share2 className="jd-h-5 jd-w-5 jd-text-blue-500" />,
      title: getMessage('shareJaydai', undefined, 'Share Jaydai'),
      description: getMessage('shareDescription', undefined, 'Help your friends and colleagues boost their productivity with AI'),
      action: handleShare,
      type: 'button' as const,
      buttonText: getMessage('share', undefined, 'Share')
    },
    {
      id: 'linkedin',
      icon: <ExternalLink className="jd-h-5 jd-w-5 jd-text-blue-600" />,
      title: getMessage('linkedin', undefined, 'LinkedIn'),
      description: getMessage('linkedin_desc', undefined, 'Follow us on LinkedIn for updates'),
      action: () => handleExternalLink('https://www.linkedin.com/company/jaydai/', 'linkedin'),
      type: 'button' as const,
      buttonText: getMessage('follow', undefined, 'Follow')
    },
    {
      id: 'privacy',
      icon: <Shield className="jd-h-5 jd-w-5 jd-text-green-500" />,
      title: getMessage('privacy_policy', undefined, 'Privacy Policy'),
      description: getMessage('privacy_desc', undefined, 'Read our privacy policy'),
      action: () => handleExternalLink('https://www.jayd.ai/fr/privacy', 'privacy'),
      type: 'button' as const,
      buttonText: getMessage('read', undefined, 'Read')
    },
    {
      id: 'dataCollection',
      icon: dataCollection ? <Eye className="jd-h-5 jd-w-5 jd-text-purple-500" /> : <EyeOff className="jd-h-5 jd-w-5 jd-text-gray-500" />,
      title: getMessage('data_collection', undefined, 'Data Collection'),
      description: getMessage('data_collection_desc', undefined, 'Allow collection of usage data for statistics'),
      type: 'toggle' as const,
      value: dataCollection,
      onToggle: handleDataCollectionToggle
    }
  ];

  return (
    <BasePanel
      title={getMessage('settings', undefined, 'Settings')}
      icon={Settings}
      showBackButton={showBackButton}
      onBack={onBack}
      onClose={onClose}
      className="jd-w-80"
      maxHeight={maxHeight}
    >
      <div>
        {settingsItems.map((item) => (
          <Card
            key={item.id}
            className={`jd-p-3 jd-bg-card !jd-shadow-none jd-mb-2 jd-transition-all jd-duration-200 ${
              item.highlight ? 'jd-border jd-border-green-500/50 jd-bg-gradient-to-r jd-from-green-500/5 jd-to-emerald-500/5' : ''
            } ${
              item.warning ? 'jd-border jd-border-red-500' : ''
            }`}
          >
            <div className="jd-flex jd-items-center jd-justify-between">
              <div className="jd-flex jd-items-start jd-space-x-3 jd-flex-1 jd-min-w-0">
                <div className="jd-flex-shrink-0 jd-mt-0.5">
                  {item.icon}
                </div>
                <div className="jd-flex-1 jd-min-w-0">
                  <div className="jd-flex jd-items-center jd-gap-2 jd-mb-1">
                    <h3 className="jd-font-medium jd-text-foreground jd-text-sm jd-truncate">
                      {item.title}
                    </h3>
                    {!item.badgeAsSubtitle && item.badge}
                    {item.warning && (
                      <AlertTriangle className="jd-w-4 jd-h-4 jd-text-red-500 jd-flex-shrink-0" />
                    )}
                  </div>
                  {item.badgeAsSubtitle && (
                    <div className="jd-mb-1">
                      {item.badge}
                    </div>
                  )}
                  {item.description && (
                    <p className="jd-text-xs jd-text-muted-foreground jd-leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="jd-flex-shrink-0 jd-ml-3">
                {item.type === 'button' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={item.action}
                    disabled={loading || (item.id === 'subscription' && (subscriptionLoading || subscription === null))}
                    className={`jd-text-xs jd-h-8 jd-px-3 ${
                      item.highlight ? 'jd-border-green-500 jd-text-green-600 jd-bg-green-500/10 hover:jd-bg-green-500/20' : ''
                    } ${
                      item.warning ? 'jd-border-red-500 jd-text-red-600' : ''
                    }`}
                  >
                    {item.id === 'subscription' ? getSubscriptionButtonText() : item.buttonText}
                  </Button>
                ) : (
                  <Switch
                    checked={item.value}
                    onCheckedChange={item.onToggle}
                    disabled={loading || initialLoad}
                  />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </BasePanel>
  );
};

export default SettingsPanel;