// src/components/StatsPanel/index.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { statsService, Stats } from '@/services/StatsService';

interface StatsPanelProps {
  className?: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ className }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Register for stats updates
    const cleanup = statsService.onUpdate((updatedStats) => {
      setStats(updatedStats);
      setIsLoading(false);
    });
    // Initial stats fetch
    statsService.getStats();
    return cleanup;
  }, []);

  // Utility for showing progress bars when expanded
  const createProgressBar = (value: number, max: number) => {
    const percent = Math.min((value / max) * 100, 100);
    return (
      <div className="h-2 rounded-full bg-gray-700 dark:bg-gray-300">
        <div 
          className="h-full rounded-full bg-blue-500 dark:bg-blue-600" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    );
  };

  if (isLoading && !stats) {
    return (
      <div className={`shadow-lg rounded-lg bg-gray-800 dark:bg-gray-100 text-gray-100 dark:text-gray-800 w-64 ${className || ''}`}>
        <div className="p-4 text-center">
          <p className="text-lg font-medium">Loading stats...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`shadow-lg rounded-lg bg-gray-800 dark:bg-gray-100 text-gray-100 dark:text-gray-800 w-64 ${className || ''}`}>
        <div className="p-4 text-center">
          <p className="text-lg font-medium">Stats unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`shadow-lg rounded-lg bg-gray-800 dark:bg-gray-100 text-gray-100 dark:text-gray-800 border border-gray-700 dark:border-gray-300 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-64'} ${className || ''}`}>
      <div className="flex items-center justify-between p-4">
        {/* Horizontal bar with 3 stats */}
        <div className="flex flex-1 justify-around">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium">Chaaaaats</span>
            <span className="text-lg font-bold">{stats.totalChats}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium">Msg/Chat</span>
            <span className="text-lg font-bold">{stats.avgMessagesPerChat.toFixed(1)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium">Usage</span>
            <span className="text-lg font-bold">{stats.tokenUsage.total.toLocaleString()}</span>
          </div>
        </div>
        {/* Chevron button to toggle expand */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 h-6 w-6 p-0"
        >
          {isExpanded ? '⌃' : '⌄'}
        </Button>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4">
          <Separator />
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Token Usage (Month)</span>
              <span className="font-medium">{stats.tokenUsage.lastMonth.toLocaleString()}</span>
            </div>
            {createProgressBar(stats.tokenUsage.lastMonth, 100000)}
            <div className="mt-2 text-xs text-gray-400 dark:text-gray-600 text-right">
              <span>Updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
