import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
// Remove the import for getAllStats since we'll use mock data
// import { getAllStats } from '@/utils/statsManager';

interface Stats {
  totalChats: number;
  totalMessages: number;
  avgMessagesPerChat: number;
  tokenUsage: {
    total: number;
    lastMonth: number;
  };
}

// Mock data for development
const MOCK_STATS: Stats = {
  totalChats: 57,
  totalMessages: 843,
  avgMessagesPerChat: 14.8,
  tokenUsage: {
    total: 756320,
    lastMonth: 243950
  }
};

export const StatsPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    console.log('🔍 StatsPanel useEffect'); 
    // Simulate API loading with a short delay
    const timer = setTimeout(() => {
      setStats(MOCK_STATS);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading && !stats) {
    return (
      <Card className="w-64">
        <CardHeader>
          <CardTitle className="text-lg">Loading stats...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="w-64">
        <CardHeader>
          <CardTitle className="text-lg">Stats unavailable</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg transition-all duration-300 ${isExpanded ? 'w-80' : 'w-64'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Archimind Stats</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Total Chats</span>
              <span className="font-medium">{stats.totalChats}</span>
            </div>
            <Progress value={(stats.totalChats / 100) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Messages / Chat</span>
              <span className="font-medium">{stats.avgMessagesPerChat.toFixed(1)}</span>
            </div>
            <Progress value={(stats.avgMessagesPerChat / 20) * 100} className="h-2" />
          </div>
          
          {isExpanded && (
            <>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Token Usage (Total)</span>
                  <span className="font-medium">{stats.tokenUsage.total.toLocaleString()}</span>
                </div>
                <Progress value={(stats.tokenUsage.total / 1000000) * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Token Usage (Month)</span>
                  <span className="font-medium">{stats.tokenUsage.lastMonth.toLocaleString()}</span>
                </div>
                <Progress value={(stats.tokenUsage.lastMonth / 100000) * 100} className="h-2" />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 