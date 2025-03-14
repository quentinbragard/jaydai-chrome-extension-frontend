import React from 'react';
import { cn } from "@/core/utils/classNames";

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  unit?: string;
  color?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, unit = "", color = "text-blue-500", className= "" }) => (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={color}>{icon}</div>
      <div className="flex items-baseline">
        <span className="text-sm font-semibold">{value}</span>
        {unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
      </div>
    </div>
  );

export default StatCard;