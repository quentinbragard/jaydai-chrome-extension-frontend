import React from 'react';

interface DetailRowProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  progress?: number | null;
  progressColor?: string;
  tooltip?: string;
}

/**
 * A single row in the expanded stats panel showing a detail with optional progress bar
 */
const StatsDetailRow: React.FC<DetailRowProps> = ({ 
  label, 
  value, 
  icon, 
  progress = null, 
  progressColor = '#3b82f6',
  tooltip
}) => (
  <div className="mb-3 last:mb-1" title={tooltip}>
    <div className="flex items-center mb-1">
      <div className="mr-2 text-muted-foreground">{icon}</div>
      <span className="text-xs font-medium flex-1">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
    {progress !== null && (
      <div className="bg-muted h-1 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out" 
          style={{ 
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: progressColor
          }}
        />
      </div>
    )}
  </div>
);

export default StatsDetailRow;