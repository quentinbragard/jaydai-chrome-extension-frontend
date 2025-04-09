// src/components/dialogs/analytics/UserInsightCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface UserInsightCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'rose' | 'indigo';
}

/**
 * A card component that displays a user insight with an icon and styled background
 */
const UserInsightCard: React.FC<UserInsightCardProps> = ({
  title,
  description,
  icon,
  color = 'blue'
}) => {
  // Map color prop to Tailwind classes
  const colorClasses = {
    blue: {
      bg: 'jd-bg-blue-50 jd-dark:jd-bg-blue-900/20',
      text: 'jd-text-blue-900 jd-dark:jd-text-blue-200',
      description: 'jd-text-blue-700 jd-dark:jd-text-blue-300',
      icon: 'jd-text-blue-600 jd-dark:jd-text-blue-400'
    },
    green: {
      bg: 'jd-bg-green-50 jd-dark:jd-bg-green-900/20',
      text: 'jd-text-green-900 jd-dark:jd-text-green-200',
      description: 'jd-text-green-700 jd-dark:jd-text-green-300',
      icon: 'jd-text-green-600 jd-dark:jd-text-green-400'
    },
    amber: {
      bg: 'jd-bg-amber-50 jd-dark:jd-bg-amber-900/20',
      text: 'jd-text-amber-900 jd-dark:jd-text-amber-200',
      description: 'jd-text-amber-700 jd-dark:jd-text-amber-300',
      icon: 'jd-text-amber-600 jd-dark:jd-text-amber-400'
    },
    purple: {
      bg: 'jd-bg-purple-50 jd-dark:jd-bg-purple-900/20',
      text: 'jd-text-purple-900 jd-dark:jd-text-purple-200',
      description: 'jd-text-purple-700 jd-dark:jd-text-purple-300',
      icon: 'jd-text-purple-600 jd-dark:jd-text-purple-400'
    },
    rose: {
      bg: 'jd-bg-rose-50 jd-dark:jd-bg-rose-900/20',
      text: 'jd-text-rose-900 jd-dark:jd-text-rose-200',
      description: 'jd-text-rose-700 jd-dark:jd-text-rose-300',
      icon: 'jd-text-rose-600 jd-dark:jd-text-rose-400'
    },
    indigo: {
      bg: 'jd-bg-indigo-50 jd-dark:jd-bg-indigo-900/20',
      text: 'jd-text-indigo-900 jd-dark:jd-text-indigo-200',
      description: 'jd-text-indigo-700 jd-dark:jd-text-indigo-300',
      icon: 'jd-text-indigo-600 jd-dark:jd-text-indigo-400'
    }
  };

  const classes = colorClasses[color];

  return (
    <Card className={`${classes.bg} jd-border-0 jd-shadow-none`}>
      <CardContent className="jd-p-4">
        <div className="jd-flex">
          <div className={`jd-flex-shrink-0 jd-mr-3 ${classes.icon}`}>
            {icon}
          </div>
          <div>
            <h4 className={`jd-font-medium ${classes.text} jd-mb-1`}>
              {title}
            </h4>
            <p className={`jd-text-sm ${classes.description}`}>
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInsightCard;