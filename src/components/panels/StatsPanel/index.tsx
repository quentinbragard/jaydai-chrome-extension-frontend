import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart2, Zap, MessageCircle, Award, RefreshCw } from "lucide-react";
import { useService } from '@/core/hooks/useService';
import { Stats, StatsService } from '@/services/analytics/StatsService';
import { BasePanel, BasePanelProps } from '../BasePanel';
import StatCard from './StatCard';
import DetailRow from './DetailRow';

interface StatsPanelProps extends BasePanelProps {
  compact?: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ onClose, className, compact = false }) => {
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
    }
  });

  // Use effect to load stats from service
  React.useEffect(() => {
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
  
  const refreshStats = () => {
    if (!statsService) return;
    
    setIsRefreshing(true);
    
    statsService.refreshStats().finally(() => {
      setIsRefreshing(false);
    });
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
    <BasePanel onClose={onClose} className={`stats-panel ${className || ''}`}>
      {/* Compact header row with stats */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BarChart2 className="h-3.5 w-3.5 text-blue-500 mr-1" />
          <span className="text-sm font-medium">
            {chrome.i18n.getMessage('aiStats') || 'AI Stats'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <StatCard 
            icon={<MessageCircle className="h-3.5 w-3.5" />} 
            value={stats.totalChats} 
            color="text-blue-500"
          />
          
          {stats.efficiency !== undefined && (
            <StatCard 
              icon={<Award className="h-3.5 w-3.5" />} 
              value={formatEfficiency(stats.efficiency)} 
              unit="%" 
              color={efficiencyColor}
            />
          )}
          
          <StatCard 
            icon={<Zap className="h-3.5 w-3.5" />} 
            value={formatEnergy(stats.energy.total)} 
            unit="kWh" 
            color="text-amber-500"
          />
          
          <div className="flex gap-1">
            <button 
              onClick={refreshStats}
              className="p-1 rounded-full hover:bg-accent/80 transition-colors"
              aria-label="Refresh stats"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={toggleExpand}
              className="p-1 rounded-full hover:bg-accent/80 transition-colors"
              aria-label={isExpanded ? "Collapse stats" : "Expand stats"}
            >
              {isExpanded ? 
                <ChevronUp className="h-3 w-3 text-muted-foreground" /> : 
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              }
            </button>
            {!compact && onClose && (
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-accent/80 transition-colors"
                aria-label="Close stats panel"
              >
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded details section */}
      {isExpanded && (
        <div className="px-4 py-3 border-t animate-in fade-in slide-in-from-top-2 duration-300">
          <DetailRow 
            label={chrome.i18n.getMessage('energyInsights') || 'Energy Usage'}
            value={`${stats.energy.lastMonth} kWh`} 
            icon={<Zap className="h-3.5 w-3.5" />} 
            progress={stats.energy.lastMonth / (stats.energy.total * 0.2) * 100}
            progressColor="#fbbf24" 
          />
          
          <DetailRow 
            label={chrome.i18n.getMessage('smartTemplates') || 'Messages'} 
            value={stats.avgMessagesPerChat.toFixed(1)} 
            icon={<MessageCircle className="h-3.5 w-3.5" />} 
            progress={stats.avgMessagesPerChat * 5}
            progressColor="#3b82f6"
          />
          
          <DetailRow 
            label={chrome.i18n.getMessage('skillDevelopment') || 'Thinking Time'} 
            value={`${stats.thinkingTime.average.toFixed(1)}s`} 
            icon={<Award className="h-3.5 w-3.5" />} 
            progress={100 - (stats.thinkingTime.average * 5)}
            progressColor="#10b981"
          />
          
          <div className="flex justify-between items-center mt-2 pt-1 border-t text-xs text-muted-foreground">
            <span className="flex items-center">
              <span className="inline-block h-1 w-1 rounded-full bg-green-500 mr-1 animate-pulse"></span>
              <span className="text-[10px]">Updated {new Date().toLocaleTimeString()}</span>
            </span>
            <button 
              className="text-[10px] text-blue-500 hover:underline"
              onClick={() => window.open('https://chat.openai.com/stats', '_blank')}
            >
              View Analytics →
            </button>
          </div>
        </div>
      )}
    </BasePanel>
  );
};

export default StatsPanel;