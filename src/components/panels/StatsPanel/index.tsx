import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BarChart2, Zap, MessageCircle, Award, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useService } from '@/core/hooks/useService';
import { Stats, StatsService } from '@/services/analytics/StatsService';
import StatsCard from './StatsCard';
import StatsDetailRow from './StatsDetailRow';
import ErrorBoundary from '../../common/ErrorBoundary';

interface StatsPanelProps {
  onClose?: () => void;
  className?: string;
  compact?: boolean;
  maxHeight?: string;
}

/**
 * Panel displaying AI usage statistics
 * Uses StatsService to fetch and display data
 */
const StatsPanel: React.FC<StatsPanelProps> = ({ 
  onClose, 
  className, 
  compact = false,
  maxHeight
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

  // Use effect to load stats from service
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
      <div 
        className={`stats-panel p-3 bg-background border rounded-lg shadow-md ${className || ''}`}
        style={maxHeight ? { maxHeight } : {}}
      >
        {/* Compact header row with stats */}
        <div className="px-1 py-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <BarChart2 className="h-3.5 w-3.5 text-blue-500 mr-1" />
            <span className="text-sm font-medium">
              {chrome.i18n.getMessage('aiStats') || 'AI Stats'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
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
            
            <div className="flex gap-1">
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
                className="p-1 rounded-full hover:bg-accent/80 transition-colors"
                aria-label={isExpanded ? "Collapse stats" : "Expand stats"}
                variant="ghost"
                size="sm"
              >
                {isExpanded ? 
                  <ChevronUp className="h-3 w-3 text-muted-foreground" /> : 
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                }
              </Button>
              {!compact && onClose && (
                <Button 
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-accent/80 transition-colors"
                  aria-label="Close stats panel"
                  variant="ghost"
                  size="sm"
                >
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded details section */}
        {isExpanded && (
          <div className="px-4 py-3 border-t mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
      </div>
    </ErrorBoundary>
  );
};

export default StatsPanel;