import React from 'react';
import { Check } from 'lucide-react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { cn } from '@/core/utils/classNames';

interface OnboardingCheckListProps {
  items: string[];
  className?: string;
}

export const OnboardingCheckList: React.FC<OnboardingCheckListProps> = ({ items, className }) => {
  const isDark = useThemeDetector();
  return (
    <ul className={cn('jd-space-y-2 jd-list-none jd-p-0', className)}>
      {items.map((item, i) => (
        <li
          key={i}
          className={cn(
            'jd-flex jd-items-start jd-gap-2 jd-text-sm',
            isDark ? 'jd-text-[var(--secondary-foreground)]' : 'jd-text-[var(--foreground)]'
          )}
        >
          <span
            className={cn(
              'jd-flex jd-items-center jd-justify-center jd-h-4 jd-w-4 jd-rounded-sm jd-mt-0.5',
              isDark
                ? 'jd-bg-[var(--primary)] jd-text-[var(--primary-foreground)]'
                : 'jd-bg-[var(--secondary)] jd-text-[var(--secondary-foreground)]'
            )}
          >
            <Check className="jd-h-3 jd-w-3" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};
