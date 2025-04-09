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
  <div className="jd-mb-3 jd-last:jd-mb-1" title={tooltip}>
    <div className="jd-flex jd-items-center jd-mb-1">
      <div className="jd-mr-2 jd-text-muted-foreground">{icon}</div>
      <span className="jd-text-xs jd-font-medium jd-flex-1">{label}</span>
      <span className="jd-text-xs jd-font-semibold">{value}</span>
    </div>
    {progress !== null && (
      <div className="jd-bg-muted jd-h-1 jd-rounded-full jd-overflow-hidden">
        <div 
          className="jd-h-full jd-rounded-full jd-transition-all jd-duration-500 jd-ease-out" 
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