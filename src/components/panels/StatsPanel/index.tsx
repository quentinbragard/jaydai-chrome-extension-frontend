// src/components/panels/StatsPanel/index.tsx

import React, { useState, useEffect } from 'react';
import { BarChart2, Zap, MessageCircle, Award, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useService } from '@/core/hooks/useService';
import { Stats, StatsService } from '@/services/analytics/StatsService';
import StatsCard from './StatsCard';
import StatsDetailRow from './StatsDetailRow';
import BasePanel from '../BasePanel';
import ErrorBoundary from '../../common/ErrorBoundary';
import { getMessage } from '@/core/utils/i18n';

interface StatsPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
  maxHeight?: string;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ 
  showBackButton,
  onBack,
  onClose, 
  className, 
  maxHeight = '400px'
}) => {
  const statsService = useService<StatsService>('stats');
  const [stats, setStats] = useState<Stats>({
    totalChats: 0,
    recentChats: 0,
    totalMessages: 0,
    avgMessagesPerChat: 0,
    messagesPerDay: {},
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

  useEffect(() => {
    if (statsService) {
      setStats(statsService.getStats());
      const unsubscribe = statsService.onUpdate((newStats) => {
        setStats(newStats);
      });
      return unsubscribe;
    }
  }, [statsService]);
  console.log('stats', stats);

  const formatEnergy = (value: number) => value.toFixed(3);
  const formatEfficiency = (value: number) => Math.round(value);

  const getEfficiencyColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const efficiencyColor = getEfficiencyColor(stats.efficiency || 0);

  return (
    <ErrorBoundary>
      <BasePanel
        title={getMessage('aiStats', undefined, "AI Stats")}
        icon={BarChart2}
        showBackButton={showBackButton}
        onBack={onBack}
        onClose={onClose}
        className={`stats-panel w-80 ${className || ''}`}
        maxHeight={maxHeight}
      >
        <div className="flex items-center justify-between mb-4 px-8 gap-4 w-full">
          <StatsCard 
            icon={<MessageCircle className="h-3.5 w-3.5" />} 
            value={stats.totalChats} 
            color="text-blue-500"
            title="Conversations"
          />
          {stats.efficiency !== undefined && (
            <StatsCard 
              icon={<Award className="h-3.5 w-3.5" />} 
              value={formatEfficiency(stats.efficiency)} 
              unit="%" 
              color={efficiencyColor}
              title="Efficiency"
            />
          )}
          <StatsCard 
            icon={<Zap className="h-3.5 w-3.5" />} 
            value={formatEnergy(stats.energyUsage?.totalWh ?? 0)}
            unit="Wh" 
            color="text-amber-500"
            title="Energy"
          />
        </div>

        <div className="px-2 py-3 border-t mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <StatsDetailRow 
            label={getMessage('recentActivity', undefined, 'Recent Activity')}
            value={`${stats.recentChats} chats`} 
            icon={<Activity className="h-3.5 w-3.5" />} 
            progress={stats.totalChats ? stats.recentChats / (stats.totalChats * 0.2) * 100 : 0}
            progressColor="#3b82f6"
            tooltip="Conversations in the last 7 days"
          />
          {/*   <StatsDetailRow 
             label={getMessage('energyInsights', undefined, 'Energy Usage')}
             value={`${(stats.energyUsage?.recentWh ?? 0).toFixed(1)} Wh`} 
             icon={<Zap className="h-3.5 w-3.5" />} 
             progress={stats.energyUsage.totalWh ? stats.energyUsage.recentWh / (stats.energyUsage.totalWh * 0.2) * 100 : 0}
             progressColor="#fbbf24"
             tooltip="Energy consumption in the last 7 days"
            />*/}
          {stats.energyUsage?.equivalent && (
            <StatsDetailRow
              label="Équivalent énergétique"
              value={stats.energyUsage.equivalent}
              icon={<Zap className="h-3.5 w-3.5" />}
              progress={0}
              progressColor="#fbbf24"
              tooltip="Comparaison concrète de votre consommation"
            />
          )}
          <StatsDetailRow 
            label={getMessage('messagingEfficiency', undefined, 'Messages Per Conversation')} 
            value={stats.avgMessagesPerChat.toFixed(1)} 
            icon={<MessageCircle className="h-3.5 w-3.5" />} 
            progress={Math.min(100, stats.avgMessagesPerChat * 10)}
            progressColor="#3b82f6"
            tooltip="Average number of messages exchanged per conversation"
          />
          <StatsDetailRow 
            label={getMessage('thinkingTime', undefined, 'Average Response Time')} 
            value={`${stats.thinkingTime.average.toFixed(1)}s`} 
            icon={<Award className="h-3.5 w-3.5" />} 
            progress={Math.min(100, 100 - (stats.thinkingTime.average * 5))}
            progressColor="#10b981"
            tooltip="Average time it takes to get a response"
          />
          <StatsDetailRow 
            label={getMessage('tokenUsage', undefined, 'Token Usage')} 
            value={`${(stats.tokenUsage.recentInput + stats.tokenUsage.recentOutput).toLocaleString()}`} 
            icon={<BarChart2 className="h-3.5 w-3.5" />} 
            progress={stats.tokenUsage.total ? Math.min(100, (stats.tokenUsage.recentInput + stats.tokenUsage.recentOutput) / (stats.tokenUsage.total * 0.1) * 100) : 0}
            progressColor="#6366f1"
            tooltip="Tokens used in the last 7 days"
          />
          <div className="flex justify-between items-center mt-2 pt-1 border-t text-xs text-muted-foreground">
            <span className="flex items-center">
              <span className="inline-block h-1 w-1 rounded-full bg-green-500 mr-1 animate-pulse"></span>
              <span className="text-[10px]">Updated {new Date().toLocaleTimeString()}</span>
            </span>
            <Button 
              className="text-[10px] text-blue-500 hover:underline p-0 h-auto bg-transparent"
              variant="ghost"
              onClick={() => window.open('https://chat.openai.com/stats', '_blank')}
            >
              Full Analytics →
            </Button>
          </div>
        </div>
      </BasePanel>
    </ErrorBoundary>
  );
};

export default StatsPanel;
