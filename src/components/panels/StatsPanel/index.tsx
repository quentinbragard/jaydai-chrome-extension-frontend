// src/components/panels/StatsPanel/index.tsx

import React, { useState, useEffect } from 'react';
import { BarChart2, Zap, MessageCircle, Award, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useService } from '@/core/hooks/useService';
import { Stats, StatsService } from '@/services/analytics/StatsService';
import StatsCard from './StatsCard';
import StatsDetailRow from './StatsDetailRow';
import BasePanel from '../BasePanel';
import ErrorBoundary from '../../common/ErrorBoundary';

interface StatsPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
  compact?: boolean;
  maxHeight?: string;
}

/**
 * Panel displaying AI usage statistics
 */
const StatsPanel: React.FC<StatsPanelProps> = ({ 
  showBackButton,
  onBack,
  onClose, 
  className, 
  compact = false,
  maxHeight = '400px'
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const statsService = useService<StatsService>('stats');
  const [stats, setStats] = useState<Stats>({
    totalChats: 0,
    totalMessages: 0,
    avgMessagesPerChat: 0,
    messagesPerDay: {},
    tokenUsage: {
      total: 0,
      lastMonth: 0
    },
    energy: {
      total: 0,
      perMessage: 0
    },
    thinkingTime: {
      total: 0,
      average: 0
    },
    efficiency: 0
  });

  useEffect(() => {
    if (statsService) {
      // Initial load
      setStats(statsService.getStats());
      
      // Subscribe to updates
      const unsubscribe = statsService.onUpdate((newStats) => {
        setStats(newStats);
      });
      
      return unsubscribe;
    }
  }, [statsService]);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const refreshStats = async () => {
    if (!statsService) return;
    
    setIsRefreshing(true);
    
    try {
      await statsService.refreshStats();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Format values
  const formatEnergy = (value: number) => value.toFixed(1);
  const formatEfficiency = (value: number) => Math.round(value);

  // Get appropriate colors based on efficiency value
  const getEfficiencyColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const efficiencyColor = getEfficiencyColor(stats.efficiency || 0);

  return (
    <ErrorBoundary>
      <BasePanel
        title={chrome.i18n.getMessage('aiStats') || "AI Stats"}
        icon={BarChart2}
        showBackButton={showBackButton}
        onBack={onBack}
        onClose={onClose}
        className={`stats-panel w-80 ${className || ''}`}
        maxHeight={maxHeight}
      >
        {/* Stats Cards Row */}
        <div className="flex items-center justify-between mb-4">
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
            value={formatEnergy(stats.energy.total)} 
            unit="kWh" 
            color="text-amber-500"
            title="Energy"
          />
          
          <Button 
            onClick={refreshStats}
            className="p-1 rounded-full hover:bg-accent/80 transition-colors"
            aria-label="Refresh stats"
            disabled={isRefreshing}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={`h-3 w-3 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            onClick={toggleExpand}
            className="p-1 rounded-full hover:bg-accent/80 transition-colors ml-1"
            variant="ghost"
            size="sm"
          >
            {isExpanded ? 
              <span className="text-xs">▲</span> : 
              <span className="text-xs">▼</span>
            }
          </Button>
        </div>
        
        {/* Expanded details section */}
        {isExpanded && (
          <div className="px-2 py-3 border-t mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <StatsDetailRow 
              label={chrome.i18n.getMessage('energyInsights') || 'Energy Usage'}
              value={`${stats.energy.lastMonth} kWh`} 
              icon={<Zap className="h-3.5 w-3.5" />} 
              progress={stats.energy.lastMonth / (stats.energy.total * 0.2) * 100}
              progressColor="#fbbf24"
              tooltip="Energy consumption in the last 30 days"
            />
            
            <StatsDetailRow 
              label={chrome.i18n.getMessage('messagingEfficiency') || 'Messages Per Conversation'} 
              value={stats.avgMessagesPerChat.toFixed(1)} 
              icon={<MessageCircle className="h-3.5 w-3.5" />} 
              progress={Math.min(100, stats.avgMessagesPerChat * 5)}
              progressColor="#3b82f6"
              tooltip="Average number of messages exchanged per conversation"
            />
            
            <StatsDetailRow 
              label={chrome.i18n.getMessage('thinkingTime') || 'Average Response Time'} 
              value={`${stats.thinkingTime.average.toFixed(1)}s`} 
              icon={<Award className="h-3.5 w-3.5" />} 
              progress={Math.min(100, 100 - (stats.thinkingTime.average * 5))}
              progressColor="#10b981"
              tooltip="Average time it takes to get a response"
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
                View Analytics →
              </Button>
            </div>
          </div>
        )}
      </BasePanel>
    </ErrorBoundary>
  );
};

export default StatsPanel;