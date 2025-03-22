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
  color = "text-blue-500", 
  title,
  description,
  className = "",
  onClick
}) => {
  const isClickable = !!onClick;

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 stat-card rounded-md transition-all", 
        isClickable && "cursor-pointer hover:bg-accent/50",
        className
      )}
      onClick={onClick}
    >
      <div className={cn("flex-shrink-0", color)}>{icon}</div>
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className="text-sm font-semibold">{value}</span>
          {unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
        </div>
        
        {title && (
          <span className="text-xs text-muted-foreground">{title}</span>
        )}
        
        {description && (
          <span className="text-xs text-muted-foreground mt-0.5 hidden group-hover:block">{description}</span>
        )}
      </div>
    </div>
  );
};

export default StatCard;