import React from 'react';
import { cn } from "@/core/utils/classNames";

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  unit?: string;
  color?: string;
  title?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * A card displaying a single statistic with icon and value
 * Can be clicked to show more details
 */
const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  value, 
  unit = "", 
  color = "jd-text-blue-500", 
  title,
  description,
  className = "",
  onClick
}) => {
  const isClickable = !!onClick;

  return (
    <div 
      className={cn(
        "jd-flex jd-items-center jd-gap-2 jd-p-3 jd-stat-card jd-rounded-md jd-transition-all", 
        isClickable && "jd-cursor-pointer hover:jd-bg-accent/50",
        className
      )}
      onClick={onClick}
    >
      <div className={cn("jd-flex-shrink-0", color)}>{icon}</div>
      <div className="jd-flex jd-flex-col">
        <div className="jd-flex jd-items-baseline">
          <span className="jd-text-sm jd-font-semibold">{value}</span>
          {unit && <span className="jd-text-xs jd-text-muted-foreground jd-ml-0.5">{unit}</span>}
        </div>
        
        {title && (
          <span className="jd-text-xs jd-text-muted-foreground">{title}</span>
        )}
        
        {description && (
          <span className="jd-text-xs jd-text-muted-foreground jd-mt-0.5 jd-hidden group-hover:jd-block">{description}</span>
        )}
      </div>
    </div>
  );
};

export default StatCard;