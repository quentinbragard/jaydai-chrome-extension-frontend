
import React, { useState, useEffect } from 'react';
import { BarChart2, Zap, MessageCircle, Award, Activity, ExternalLink, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stats } from '@/services/analytics/StatsService';
import { useUserStats } from '@/hooks/stats/queries';
import StatsCard from './StatsCard';
import StatsDetailRow from './StatsDetailRow';
import BasePanel from '../BasePanel';
import ErrorBoundary from '../../common/ErrorBoundary';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { TooltipProvider } from "@/components/ui/tooltip";
import { userApi } from '@/services/api';
import { useQueryClient } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { toast } from 'sonner';
import { useUserMetadata } from '@/hooks/prompts/queries/user';
import { getMessage } from '@/core/utils/i18n';

interface StatsPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
  maxHeight?: string;
}

/**
 * Panel that displays AI usage statistics with visualizations
 */
const StatsPanel: React.FC<StatsPanelProps> = ({ 
  showBackButton,
  onBack,
  onClose, 
  className, 
  maxHeight = '75vh'
}) => {
  const {
    data: userMetadata,
    isLoading: userLoading,
  } = useUserMetadata();
  const dataCollectionEnabled = userMetadata?.data_collection !== false;

  const { data: statsData, isLoading: statsLoading, refetch } = useUserStats(dataCollectionEnabled);
  
  // Initialize stats state with defaults
  const [stats, setStats] = useState<Stats>({
    totalChats: 0,
    recentChats: 0,
    totalMessages: 0,
    avgMessagesPerChat: 0,
    messagesPerDay: {},
    chatsPerDay: {},
    tokenUsage: {
      recent: 0,
      recentInput: 0,
      recentOutput: 0,
      total: 0,
      totalInput: 0,
      totalOutput: 0
    },
    energyUsage: {
      recentWh: 0,
      totalWh: 0,
      perMessageWh: 0,
      equivalent: ""
    },
    thinkingTime: {
      total: 0,
      average: 0
    },
    efficiency: 0
  });
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();


  const enableDataCollection = async () => {
    try {
      const response = await userApi.updateDataCollection(true);
      if (response.success) {
        toast.success(getMessage('data_collection_enabled', undefined, 'Data collection enabled'));
        queryClient.setQueryData([QUERY_KEYS.USER_METADATA], (old: { data_collection?: boolean } | undefined) => ({
          ...(old || {}),
          data_collection: true,
        }));
        setLoading(false);
      } else {
        throw new Error(response.message || 'Failed to update preference');
      }
    } catch (error) {
      console.error('Error enabling data collection:', error);
      toast.error(getMessage('error_updating_preference', undefined, 'Failed to update preference'));
    }
  };

  useEffect(() => {
    setLoading(userLoading || statsLoading);
  }, [userLoading, statsLoading]);

  useEffect(() => {
    if (statsData) {
      setStats(statsData);
    }
  }, [statsData]);


  // Format helpers
  const formatEnergy = (value: number) => value.toFixed(3);
  const formatEfficiency = (value: number) => Math.round(value);

  // Get color based on efficiency score
  const getEfficiencyColor = (value: number) => {
    // Ensure value is between 0-100
    const validValue = Math.min(100, Math.max(0, value));
    
    if (validValue >= 80) return "text-green-500";
    if (validValue >= 60) return "text-amber-500";
    return "text-red-500";
  };
  
  const efficiencyValue = Math.min(100, Math.max(0, stats.efficiency || 0));
  const efficiencyColor = getEfficiencyColor(efficiencyValue);

  // Handle opening enhanced stats dialog using the dialog context
  const { openEnhancedStats } = useDialogActions();

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <BasePanel
          title={getMessage('aiStats', undefined, "AI Stats")}
          icon={BarChart2}
          showBackButton={showBackButton}
          onBack={onBack}
          onClose={onClose}
          className={`jd-stats-panel jd-w-80 ${className || ''}`} // Panel width is w-80 (320px)
          maxHeight={maxHeight}
        >
          {loading ? (
            <div className="jd-flex jd-flex-col jd-items-center jd-justify-center jd-p-8 jd-text-center">
              <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full jd-mb-3"></div>
              <p className="jd-text-muted-foreground jd-font-medium">{getMessage('loading', undefined, 'Loading...')}</p>
            </div>
          ) : !dataCollectionEnabled ? (
            <div className="jd-flex jd-flex-col jd-items-center jd-justify-center jd-p-8 jd-text-center">
              <BarChart2 className="jd-h-10 jd-w-10 jd-text-muted-foreground jd-mb-3 jd-opacity-30" />
              <p className="jd-text-muted-foreground jd-font-medium">{getMessage('dataCollectionRequired', undefined, 'Data Collection Required')}</p>
              <p className="jd-text-xs jd-text-muted-foreground jd-mt-1 jd-mb-4">
                {getMessage('enableDataCollectionForStats', undefined, 'Enable data collection to view your AI usage statistics and insights')}
              </p>
              <Button 
                onClick={enableDataCollection}
                className="jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/90"
              >
                <Settings className="jd-h-4 jd-w-4 jd-mr-2" />
                {getMessage('enableDataCollection', undefined, 'Enable Data Collection')}
              </Button>
            </div>
          ) : stats.totalChats === 0 && stats.totalMessages === 0 ? (
            <div className="jd-flex jd-flex-col jd-items-center jd-justify-center jd-p-8 jd-text-center">
              <BarChart2 className="jd-h-10 jd-w-10 jd-text-muted-foreground jd-mb-3 jd-opacity-30" />
              <p className="jd-text-muted-foreground jd-font-medium">{getMessage('noStatsAvailable', undefined, 'No stats available yet')}</p>
              <p className="jd-text-xs jd-text-muted-foreground jd-mt-1">
                {getMessage('noStatsAvailable', undefined, 'Start a conversation to see your usage analytics')}
              </p>
            </div>
          ) : (
            <>
              {/* Top cards - Reduced padding and gap, centered justification */}
              <div className="jd-flex jd-items-center jd-justify-center jd-mb-4 jd-px-4 jd-gap-2 jd-w-full"> 
                <StatsCard 
                  icon={<MessageCircle className="jd-h-4 jd-w-4" />} 
                  value={stats.totalChats > 20 ? "20+" : stats.totalChats} 
                  color="jd-text-blue-500"
                  title="Conversations"
                />
                {stats.efficiency !== undefined && (
                  <StatsCard 
                    icon={<Award className="jd-h-4 jd-w-4" />} 
                    value={formatEfficiency(efficiencyValue)} 
                    unit="%" 
                    color={efficiencyColor}
                    title="Efficiency"
                  />
                )}
                <StatsCard 
                  icon={<Zap className="jd-h-4 jd-w-4" />} 
                  value={formatEnergy(stats.energyUsage?.totalWh ?? 0)}
                  unit="Wh" 
                  color="jd-text-amber-500"
                  title="Energy"
                />
              </div>

              {/* Stats detail rows */}
              <div className="jd-px-2 jd-py-3 jd-border-t jd-mt-2 jd-animate-in jd-fade-in jd-slide-in-from-top-2 jd-duration-300">
                <StatsDetailRow 
                  label={getMessage('recentActivity', undefined, 'Recent Activity')}
                  value={`${stats.recentChats} chats`} 
                  icon={<Activity className="jd-h-4 jd-w-4 jd-text-chart-2" />} 
                  progress={stats.totalChats ? stats.recentChats / (stats.totalChats * 0.2) * 100 : 0}
                  progressColor="jd-text-3b82f6" // Note: This should likely be a Tailwind class like text-blue-500
                  tooltip="Conversations in the last 7 days"
                />
                
                {/* Energy Equivalent Display - Uncomment if needed
                {stats.energyUsage?.equivalent && (
                  // ... equivalent display code ...
                )}
                */}
                
                <StatsDetailRow 
                  label={getMessage('messagingEfficiency', undefined, 'Messages Per Conversation')} 
                  value={stats.avgMessagesPerChat.toFixed(1)} 
                  icon={<MessageCircle className="jd-h-4 jd-w-4 jd-text-chart-3" />} 
                  progress={Math.min(100, stats.avgMessagesPerChat * 10)}
                  progressColor="text-blue-500" // Example: Use Tailwind class
                  tooltip="Average number of messages exchanged per conversation"
                />
                
                <StatsDetailRow 
                  label={getMessage('thinkingTime', undefined, 'Average Response Time')} 
                  value={`${stats.thinkingTime.average.toFixed(1)}s`} 
                  icon={<Award className="jd-h-4 jd-w-4 jd-text-chart-4" />} 
                  progress={Math.min(100, 100 - (stats.thinkingTime.average * 5))}
                  progressColor="text-green-500" // Example: Use Tailwind class
                  tooltip="Average time it takes to get a response"
                />
                
                <StatsDetailRow 
                  label={getMessage('tokenUsage', undefined, 'Token Usage')} 
                  value={`${(stats.tokenUsage.recentInput + stats.tokenUsage.recentOutput).toLocaleString()}`} 
                  icon={<BarChart2 className="jd-h-4 jd-w-4 jd-text-chart-5" />} 
                  progress={stats.tokenUsage.total ? Math.min(100, (stats.tokenUsage.recentInput + stats.tokenUsage.recentOutput) / (stats.tokenUsage.total * 0.1) * 100) : 0}
                  progressColor="text-indigo-500" // Example: Use Tailwind class
                  tooltip="Tokens used in the last 7 days"
                />
                
                <div className="jd-flex jd-justify-between jd-items-center jd-mt-4 jd-pt-1 jd-border-t jd-text-xs jd-text-muted-foreground">
                  <span className="jd-flex jd-items-center">
                    <span className="jd-inline-block jd-h-1 jd-w-1 jd-rounded-full jd-bg-green-500 jd-mr-1 jd-animate-pulse"></span>
                    <span className="jd-text-[10px]">
                      {getMessage('updated', undefined, 'Updated')} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </span>
                  
                  <Button
                    className="jd-text-[10px] jd-text-blue-500 jd-px-1 hover:jd-underline jd-p-0 jd-h-auto jd-bg-transparent jd-flex jd-items-center jd-gap-1"
                    variant="ghost"
                    onClick={openEnhancedStats}
                  >
                    {getMessage('viewEnhancedStats', undefined, 'View Enhanced Analytics')}
                    <ExternalLink className="jd-h-3 jd-w-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </BasePanel>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default StatsPanel;