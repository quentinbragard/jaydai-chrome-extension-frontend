// src/extension/welcome/components/FeatureGrid.tsx
import React from 'react';
import { Zap, BookOpen, TrendingUp } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { getMessage } from '@/core/utils/i18n';

export const FeatureGrid: React.FC = () => {
  return (
    <div className="jd-grid md:jd-grid-cols-3 jd-gap-6 jd-max-w-6xl jd-mx-auto jd-mb-12">
      <FeatureCard 
        icon={Zap}
        title={getMessage('energyInsights', undefined, 'Energy Insights')}
        description={getMessage('energyInsightsDesc', undefined, 'Track and optimize your AI usage with real-time energy consumption metrics.')}
      />
      
      <FeatureCard 
        icon={BookOpen}
        title={getMessage('smartTemplates', undefined, 'Smart Templates')}
        description={getMessage('smartTemplatesDesc', undefined, 'Access a library of curated prompt templates to enhance your AI interactions.')}
      />
      
      <FeatureCard 
        icon={TrendingUp}
        title={getMessage('skillDevelopment', undefined, 'Skill Development')}
        description={getMessage('skillDevelopmentDesc', undefined, 'Receive personalized recommendations to upskill and maintain human expertise.')}
      />
    </div>
  );
};

