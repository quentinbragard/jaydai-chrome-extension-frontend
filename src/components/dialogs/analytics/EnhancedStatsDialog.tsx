// src/components/dialogs/analytics/EnhancedStatsDialog.tsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDialog } from '@/components/dialogs/core/DialogContext';
import { DIALOG_TYPES } from '@/core/dialogs/registry';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Clock, 
  Zap, 
  MessageCircle, 
  Award, 
  BrainCircuit, 
  CalendarClock, 
  Star, 
  LightbulbIcon, 
  TrendingUp, 
  Users,
  LinkedinIcon,
  StarIcon,
  LockIcon,
  Construction
} from "lucide-react";
import { useService } from '@/core/hooks/useService';
import { Stats, StatsService } from '@/services/analytics/StatsService';
import { getMessage } from '@/core/utils/i18n';
import { getCurrentLanguage } from '@/core/utils/i18n';
import StatsChart from '@/components/panels/StatsPanel/StatsChart';
import UserInsightCard from './UserInsightCard';
import UsageMetricsGrid, { createMetricsData } from './UsageMetricsGrid';

// Define card types and their properties
interface StatCardInfo {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  suffix?: string;
  description?: string;
  color?: string;
  progress?: number;
  progressColor?: string;
}

/**
 * Coming Soon Card component for locked features
 */
const ComingSoonCard: React.FC<{ title: string }> = ({ title }) => {
  const openLinkedIn = () => {
    window.open('https://www.linkedin.com/company/104914264/admin/dashboard/', '_blank');
  };

  const openRatingPage = () => {
    // For Chrome Store
    const isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
    if (isChrome) {
      window.open('https://chromewebstore.google.com/detail/jaydai-chrome-extension/enfcjmbdbldomiobfndablekgdkmcipd/reviews', '_blank');
    } else {
      // For Firefox Add-ons
      window.open('https://addons.mozilla.org/firefox/addon/your-addon-id/reviews/', '_blank');
    }
  };

  const sendEmail = () => {
    window.open('mailto:contact@jayd.ai?subject=Analytics%20Feature%20Feedback', '_blank');
  };

  return (
    <Card className="jd-w-full jd-h-full jd-flex jd-flex-col jd-justify-center jd-items-center jd-py-12 jd-px-4 jd-text-center jd-border jd-border-muted">
      <div className="jd-mb-6 jd-bg-muted/20 jd-p-4 jd-rounded-full">
        <Construction className="jd-h-12 jd-w-12 jd-text-muted-foreground" />
      </div>
      <CardTitle className="jd-mb-4 jd-text-xl">
        {getMessage('comingSoon', undefined, 'Coming Soon!')}
      </CardTitle>
      <CardDescription className="jd-mb-6 jd-text-center jd-max-w-lg jd-text-base">
        {getMessage('featureInDevelopment', [title], `We're still building this exciting ${title} feature! Your support gives us energy to build faster.`)}
      </CardDescription>
      
      <div className="jd-flex jd-flex-col sm:jd-flex-row jd-gap-4 jd-mt-2 jd-mb-6">
        <Button 
          variant="outline" 
          className="jd-flex jd-items-center jd-gap-2 jd-bg-background jd-border-primary jd-text-primary-foreground hover:jd-bg-primary/10" 
          onClick={openLinkedIn}
        >
          <LinkedinIcon className="jd-h-4 jd-w-4" />
          {getMessage('followUsLinkedIn', undefined, 'Follow Us on LinkedIn')}
        </Button>
        <Button 
          className="jd-flex jd-items-center jd-gap-2 jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/90" 
          onClick={openRatingPage}
        >
          <StarIcon className="jd-h-4 jd-w-4" />
          {getMessage('rateUs', undefined, 'Rate Us 5 Stars')}
        </Button>
      </div>
      
      <p className="jd-text-sm jd-text-muted-foreground jd-mt-4">
        {getMessage('questionsFeedback', undefined, 'Questions or feedback?')} 
        <button 
          onClick={sendEmail} 
          className="jd-text-primary hover:jd-underline jd-ml-1"
        >
          contact@jayd.ai
        </button>
      </p>
    </Card>
  );
};

// Define the enhanced stats dialog component
export const EnhancedStatsDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.ENHANCED_STATS);
  const statsService = useService<StatsService>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('en');

  // Load stats data
  useEffect(() => {
    if (isOpen && statsService) {
      setLoading(true);
      setStats(statsService.getStats());
      
      // Set current language
      setLanguage(getCurrentLanguage());
      
      // Subscribe to stats updates
      const unsubscribe = statsService.onUpdate((newStats) => {
        setStats(newStats);
        setLoading(false);
      });
      
      return unsubscribe;
    }
  }, [isOpen, statsService]);

  // Helper function to format numbers
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  // Render loading state
  if (loading || !stats) {
    return (
      <Dialog {...dialogProps}>
        <DialogContent className="sm:max-w-3xl">
          <div className="jd-flex jd-items-center jd-justify-center jd-p-8">
            <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Build overview cards
  const overviewCards: StatCardInfo[] = [
    {
      icon: <MessageCircle className="jd-h-5 jd-w-5" />,
      title: getMessage('totalConversations', undefined, 'Total Conversations'),
      value: formatNumber(stats.totalChats),
      suffix: stats.recentChats > 0 ? `+${stats.recentChats} ${getMessage('lastWeek', undefined, 'last week')}` : '',
      color: 'jd-bg-blue-500'
    },
    {
      icon: <Users className="jd-h-5 jd-w-5" />,
      title: getMessage('messagesExchanged', undefined, 'Messages Exchanged'),
      value: formatNumber(stats.totalMessages),
      suffix: `~${stats.avgMessagesPerChat.toFixed(1)} ${getMessage('perChat', undefined, 'per chat')}`,
      color: 'jd-bg-indigo-500'
    },
    {
      icon: <Award className="jd-h-5 jd-w-5" />,
      title: getMessage('efficiencyScore', undefined, 'Efficiency Score'),
      value: Math.min(Math.round(stats.efficiency || 0), 100),
      suffix: '/100',
      description: getMessage('basedOnUsage', undefined, 'Based on your usage patterns'),
      progress: Math.min(stats.efficiency || 0, 100),
      progressColor: 
        (stats.efficiency || 0) >= 80 ? '#22c55e' : 
        (stats.efficiency || 0) >= 60 ? '#eab308' : '#ef4444',
      color: 'jd-bg-amber-500'
    },
    {
      icon: <Clock className="jd-h-5 jd-w-5" />,
      title: getMessage('avgResponseTime', undefined, 'Avg. Response Time'),
      value: stats.thinkingTime.average.toFixed(1),
      suffix: getMessage('seconds', undefined, 'seconds'),
      color: 'jd-bg-purple-500'
    },
    {
      icon: <Zap className="jd-h-5 jd-w-5" />,
      title: getMessage('energyUsage', undefined, 'Energy Usage'),
      value: stats.energyUsage.totalWh.toFixed(3),
      suffix: 'Wh',
      description: getMessage('consumptionEquivalent', undefined, 'Consumption equivalent'),
      color: 'jd-bg-green-500'
    },
    {
      icon: <BrainCircuit className="jd-h-5 jd-w-5" />,
      title: getMessage('tokensProcessed', undefined, 'Tokens Processed'),
      value: formatNumber(stats.tokenUsage.total),
      description: getMessage('inputOutput', undefined, 'Input + Output'),
      color: 'jd-bg-rose-500'
    }
  ];

  // Format messages per day data for chart
  const messagesPerDayData = {
    labels: Object.keys(stats.messagesPerDay || {}),
    values: Object.values(stats.messagesPerDay || {})
  };

  // Format token usage data for chart
  const tokenUsageData = {
    labels: [
      getMessage('input', undefined, 'Input'), 
      getMessage('output', undefined, 'Output')
    ],
    values: [stats.tokenUsage.totalInput, stats.tokenUsage.totalOutput],
    colors: ['#3b82f6', '#f59e0b']
  };

  // Model usage data for chart (if available)
  const modelUsageData = stats.modelUsage ? {
    labels: Object.keys(stats.modelUsage).map(key => key === 'unknown' ? getMessage('unknown', undefined, 'Unknown') : key),
    values: Object.values(stats.modelUsage).map(model => model.count),
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  } : { labels: [], values: [] };

  // Energy equivalent explanation
  const energyEquivalent = stats.energyUsage.equivalent || 
    getMessage('noEquivalent', undefined, 'No equivalent available');
  
  // Get efficiency description based on score
  const getEfficiencyDescription = (score: number): string => {
    if (score >= 85) return getMessage('expertLevel', undefined, 'Expert AI user - highly efficient');
    if (score >= 75) return getMessage('advancedLevel', undefined, 'Advanced AI user - good conversation flow');
    if (score >= 65) return getMessage('proficientLevel', undefined, 'Proficient AI user - effective usage');
    if (score >= 50) return getMessage('developingLevel', undefined, 'Developing AI user - learning patterns');
    return getMessage('noviceLevel', undefined, 'Novice AI user - beginning your journey');
  };

  return (
    <Dialog {...dialogProps}>
      <DialogContent className="sm:max-w-4xl jd-max-h-[90vh] jd-overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {getMessage('enhancedAiAnalytics', undefined, 'Enhanced AI Analytics')}
          </DialogTitle>
          <DialogDescription>
            {getMessage('analyticsDescription', undefined, 'Detailed insights about your AI interactions and usage patterns')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="jd-w-full">
        <TabsList className="jd-grid jd-grid-cols-4 jd-mb-4">
            <TabsTrigger value="overview">
              <Star className="jd-h-4 jd-w-4 jd-mr-2" />
              {getMessage('overview', undefined, 'Overview')}
            </TabsTrigger>
            <TabsTrigger value="usage" className="jd-flex jd-items-center jd-justify-center">
              <div className="jd-flex jd-items-center">
                <BarChart className="jd-h-4 jd-w-4 jd-mr-2" />
                {getMessage('usageMetrics', undefined, 'Usage Metrics')}
              </div>
              <LockIcon className="jd-h-3.5 jd-w-3.5 jd-ml-2 jd-text-muted-foreground" />
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="jd-flex jd-items-center jd-justify-center">
              <div className="jd-flex jd-items-center">
                <Award className="jd-h-4 jd-w-4 jd-mr-2" />
                {getMessage('efficiency', undefined, 'Efficiency')}
              </div>
              <LockIcon className="jd-h-3.5 jd-w-3.5 jd-ml-2 jd-text-muted-foreground" />
            </TabsTrigger>
            <TabsTrigger value="insights" className="jd-flex jd-items-center jd-justify-center">
              <div className="jd-flex jd-items-center">
                <LightbulbIcon className="jd-h-4 jd-w-4 jd-mr-2" />
                {getMessage('insights', undefined, 'Insights')}
              </div>
              <LockIcon className="jd-h-3.5 jd-w-3.5 jd-ml-2 jd-text-muted-foreground" />
            </TabsTrigger>
          </TabsList>
          
          {/* Warning message about beta features */}
          <div className="jd-bg-yellow-100 jd-dark:jd-bg-yellow-900/30 jd-border jd-border-yellow-300 jd-dark:jd-border-yellow-700 jd-rounded-md jd-p-3 jd-mb-4 jd-text-yellow-800 jd-dark:jd-text-yellow-200 jd-text-sm">
            <div className="jd-flex">
              <div className="jd-flex-shrink-0">
                <svg className="jd-h-5 jd-w-5 jd-text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="jd-ml-3">
                <h3 className="jd-font-medium">{getMessage('betaFeatureWarning', undefined, 'Beta Feature Warning')}</h3>
                <div className="jd-mt-1">
                  {getMessage('betaFeatureWarningMessage', undefined, 'We are still building and refining our analytics features. If you encounter any issues, please email us at')} <a href="mailto:contact@jayd.ai" className="font-medium underline">contact@jayd.ai</a>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Tab - The only tab that is actually functional */}
          <TabsContent value="overview" className="space-y-4">
            <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-3 jd-gap-4">
              {overviewCards.map((card, index) => (
                <Card key={index} className="jd-overflow-hidden">
                  <CardHeader className={`jd-flex jd-flex-row jd-items-center jd-justify-between jd-py-2 ${card.color} jd-bg-opacity-10`}>
                    <CardTitle className="jd-text-sm jd-font-medium">
                      {card.title}
                    </CardTitle>
                    <div className={`jd-p-1 jd-rounded-full ${card.color} jd-bg-opacity-20`}>
                      {card.icon}
                    </div>
                  </CardHeader>
                  <CardContent className="jd-p-4">
                    <div className="jd-flex jd-flex-col">
                      <div className="jd-flex jd-items-baseline">
                        <span className="jd-text-2xl jd-font-bold">{card.value}</span>
                        {card.suffix && (
                          <span className="jd-ml-1 jd-text-muted-foreground jd-text-sm">{card.suffix}</span>
                        )}
                      </div>
                      {card.description && (
                        <p className="jd-text-xs jd-text-muted-foreground jd-mt-1">{card.description}</p>
                      )}
                      {card.progress !== undefined && (
                        <div className="jd-mt-3">
                          <div className="jd-h-2 jd-bg-muted jd-rounded-full jd-overflow-hidden">
                            <div 
                              className="jd-h-full jd-rounded-full jd-transition-all jd-duration-500 jd-ease-out" 
                              style={{
                                width: `${Math.min(100, Math.max(0, card.progress))}%`,
                                backgroundColor: card.progressColor || '#3b82f6'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="jd-text-sm">
                    {getMessage('dailyActivity', undefined, 'Daily Activity')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="jd-h-60">
                  <StatsChart 
                    data={messagesPerDayData} 
                    type="bar" 
                    color="#3b82f6" 
                    showGrid={true}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="jd-text-sm">
                    {getMessage('tokenDistribution', undefined, 'Token Distribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="jd-h-60">
                  <StatsChart 
                    data={tokenUsageData} 
                    type="pie" 
                    showLegend={true}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Energy equivalent card */}
            <Card>
              <CardHeader>
                <CardTitle className="jd-text-sm">
                  {getMessage('energyDetails', undefined, 'Energy Consumption Details')}
                </CardTitle>
              </CardHeader>
              <CardContent className="jd-p-4">
                <div className="jd-flex jd-justify-between jd-mb-4">
                  <div>
                    <span className="jd-text-sm jd-font-medium">
                      {getMessage('totalEnergy', undefined, 'Total Energy')}
                    </span>
                    <div className="jd-text-2xl jd-font-bold jd-mt-1">{stats.energyUsage.totalWh.toFixed(4)} Wh</div>
                  </div>
                  <div>
                    <span className="jd-text-sm jd-font-medium">
                      {getMessage('perMessage', undefined, 'Per Message')}
                    </span>
                    <div className="jd-text-lg jd-font-medium jd-mt-1">{stats.energyUsage.perMessageWh.toFixed(6)} Wh</div>
                  </div>
                </div>
                
                <Separator className="jd-my-4" />
                {/*
                <div className="jd-mt-4">
                  <h4 className="jd-text-sm jd-font-semibold jd-mb-2">
                    {getMessage('equivalent', undefined, 'Equivalent to')}
                  </h4>
                  <div className="jd-flex jd-p-4 jd-bg-green-100 jd-dark:jd-bg-green-900/20 jd-text-background jd-rounded-md">
                    <Zap className="jd-h-5 jd-w-5 jd-mr-2 jd-text-green-600 jd-dark:jd-text-green-400 jd-flex-shrink-0" />
                    <p className="jd-text-base jd-text-green-800 jd-dark:jd-text-green-300">
                      {energyEquivalent}
                    </p>
                  </div>
                </div>
                */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All other tabs show the Coming Soon card */}
          <TabsContent value="usage" className="jd-h-[400px]">
            <ComingSoonCard title={getMessage('usageMetrics', undefined, 'Usage Metrics')} />
          </TabsContent>

          <TabsContent value="efficiency" className="jd-h-[400px]">
            <ComingSoonCard title={getMessage('efficiency', undefined, 'Efficiency')} />
          </TabsContent>

          <TabsContent value="insights" className="jd-h-[400px]">
            <ComingSoonCard title={getMessage('insights', undefined, 'Insights')} />
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="jd-mt-6">
          <Button onClick={() => dialogProps.onOpenChange(false)}>
            {getMessage('close', undefined, 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};