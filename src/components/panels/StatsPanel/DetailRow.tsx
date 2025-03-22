import React from 'react';

interface DetailRowProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  progress?: number | null;
  progressColor?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ 
  label, 
  value, 
  icon, 
  progress = null, 
  progressColor 
}) => (
  <div className="mb-3 last:mb-1">
    <div className="flex items-center mb-1">
      <div className="mr-2 text-muted-foreground">{icon}</div>
      <span className="text-xs font-medium flex-1">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
    {progress !== null && (
      <div className="bg-muted h-1 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full" 
          style={{ 
            width: `${Math.min(100, progress)}%`,
            backgroundColor: progressColor || '#3b82f6'
          }}
        />
      </div>
    )}
  </div>
);

export default DetailRow;