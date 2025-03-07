import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart2, Zap, MessageCircle, Award, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import StatCard from './StatCard';
import DetailRow from './DetailRow';

// Mock data for demonstration
const mockData = {
  totalChats: 68,
  avgMessagesPerChat: 12.5,
  efficiency: 85, // out of 100
  energyUsage: {
    total: 12.4,   // kWh
    lastMonth: 4.2,
    percentage: 42 // percentage of monthly budget
  },
  thinkingTime: {
    total: 342,    // seconds
    average: 8.2
  }
};



export const StatsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState(mockData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();
  
  // Animation classes
  const containerClasses = `
    stats-panel
    bg-white
    dark:bg-black 
    shadow-md
    rounded-lg 
    border 
    transition-all 
    duration-300 
    ease-in-out
    backdrop-blur-sm
    overflow-hidden
    w-96
    ${theme === 'dark' ? 'bg-opacity-90 border-slate-700' : 'bg-opacity-95 border-slate-200'}
  `;
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const refreshStats = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats({
        ...stats,
        totalChats: stats.totalChats + 1,
        efficiency: Math.min(100, stats.efficiency + Math.floor(Math.random() * 5)),
        energyUsage: {
          ...stats.energyUsage,
          total: +(stats.energyUsage.total + 0.1).toFixed(1)
        }
      });
      setIsRefreshing(false);
    }, 800);
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

  const efficiencyColor = getEfficiencyColor(stats.efficiency);

  return (
    <div className={containerClasses}>
      {/* Compact header row with stats */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BarChart2 className="h-3.5 w-3.5 text-blue-500 mr-1" />
          <span className="text-xs font-medium">AI Stats</span>
        </div>
        
        <div className="flex items-center gap-3">
          <StatCard 
            icon={<MessageCircle className="h-3.5 w-3.5" />} 
            value={stats.totalChats} 
            color="text-blue-500"
          />
          
          <StatCard 
            icon={<Award className="h-3.5 w-3.5" />} 
            value={formatEfficiency(stats.efficiency)} 
            unit="%" 
            color={efficiencyColor}
          />
          
          < StatCard 
            icon={<Zap className="h-3.5 w-3.5" />} 
            value={formatEnergy(stats.energyUsage.total)} 
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
          </div>
        </div>
      </div>
      
      {/* Expanded details section */}
      {isExpanded && (
        <div className="px-4 py-3 border-t animate-in fade-in slide-in-from-top-2 duration-300">
          <DetailRow 
            label="Energy Usage (Monthly)" 
            value={`${stats.energyUsage.lastMonth} kWh`} 
            icon={<Zap className="h-3.5 w-3.5" />} 
            progress={stats.energyUsage.percentage}
            progressColor="#fbbf24" 
          />
          
          <DetailRow 
            label="Messages Per Chat" 
            value={stats.avgMessagesPerChat.toFixed(1)} 
            icon={<MessageCircle className="h-3.5 w-3.5" />} 
            progress={stats.avgMessagesPerChat * 5}
            progressColor="#3b82f6"
          />
          
          <DetailRow 
            label="Avg. Response Time" 
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
    </div>
  );
};

export default StatsPanel;