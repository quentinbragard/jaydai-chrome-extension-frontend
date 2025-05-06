// src/extension/welcome/components/FeatureCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="jd-bg-gray-900 jd-rounded-lg jd-border jd-border-gray-800 jd-shadow-md jd-p-6 jd-text-left jd-feature-card">
      <div className="jd-flex jd-items-start jd-mb-4">
        <Icon className="jd-h-6 jd-w-6 jd-text-blue-500 jd-mr-4 jd-mt-0.5 jd-flex-shrink-0" />
        <h3 className="jd-text-lg jd-font-medium jd-text-white jd-font-heading">{title}</h3>
      </div>
      <p className="jd-text-gray-300 jd-text-sm jd-font-sans">
        {description}
      </p>
    </div>
  );
};

