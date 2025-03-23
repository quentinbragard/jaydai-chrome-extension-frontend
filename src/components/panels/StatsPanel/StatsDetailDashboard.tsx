import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useService } from '@/core/hooks/useService';
import { StatsService } from '@/services/analytics/StatsService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatsDetailDashboard = () => {
  const statsService = useService('stats');
  const [stats, setStats] = useState(null);
  const [weeklyConversations, setWeeklyConversations] = useState(null);
  const [messageDistribution, setMessageDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllStats = async () => {
      if (statsService) {
        // Get main stats
        setStats(statsService.getStats());
        
        // Register for updates
        const unsubscribe = statsService.onUpdate((newStats) => {
          setStats(newStats);
        });
        
        try {
          // Load additional stats
          const weeklyData = await statsService.getWeeklyConversations();
          if (weeklyData) {
            setWeeklyConversations(weeklyData);
          }
          
          const distributionData = await statsService.getMessageDistribution();
          if (distributionData) {
            setMessageDistribution(distributionData);
          }
        } catch (error) {
          console.error('Error loading additional stats:', error);
        } finally {
          setLoading(false);
        }
        
        return unsubscribe;
      }
    };
    
    loadAllStats();
  }, [statsService]);
  
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Format data for message distribution pie chart
  const messageDistributionData = messageDistribution ? [
    { name: 'User', value: messageDistribution.user_messages },
    { name: 'AI', value: messageDistribution.ai_messages }
  ] : [];
  
  // Format data for weekly conversations chart
  const weeklyConversationsData = weeklyConversations ? 
    weeklyConversations.weekly_conversations.map((count, index) => ({
      week: `Week ${index + 1}`,
      count
    })) : [];
  
  // Format data for model usage
  const modelUsageData = stats.modelUsage ? 
    Object.entries(stats.modelUsage).map(([model, data]) => ({
      name: model,
      count: data.count
    })) : [];
  
  // Format data for token usage
  const tokenUsageData = [
    { name: 'Input', value: stats.tokenUsage.totalInput },
    { name: 'Output', value: stats.tokenUsage.totalOutput }
  ];
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">AI Usage Analytics</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.totalChats.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentChats} in the last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgMessagesPerChat.toFixed(1)} avg per conversation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Energy Usage</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.energyUsage.total.toFixed(2)} kWh</div>
            <p className="text-xs text-muted-foreground">
              {stats.energyUsage.recent.toFixed(2)} kWh in the last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.efficiency || 0}/100</div>
            <p className="text-xs text-muted-foreground">
              Based on usage patterns
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="models">Model Usage</TabsTrigger>
          <TabsTrigger value="tokens">Token Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Conversation Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyConversationsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Message Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={messageDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {messageDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Daily Message Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(stats.messagesPerDay).map(([date, count]) => ({ date, count }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Model Usage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={modelUsageData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tokens">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tokenUsageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tokenUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent vs Total Token Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { 
                          name: 'Recent', 
                          input: stats.tokenUsage.recentInput, 
                          output: stats.tokenUsage.recentOutput 
                        },
                        { 
                          name: 'All Time', 
                          input: stats.tokenUsage.totalInput, 
                          output: stats.tokenUsage.totalOutput 
                        }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="input" name="Input Tokens" fill="#3b82f6" />
                      <Bar dataKey="output" name="Output Tokens" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StatsDetailDashboard;