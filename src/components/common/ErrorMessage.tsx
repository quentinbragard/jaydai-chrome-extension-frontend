import React from 'react';
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorMessageProps {
  message: string;
  detail?: string;
  onRetry?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

/**
 * Generic error message component with optional retry button
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  detail,
  onRetry,
  variant = 'error'
}) => {
  // Determine icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'error':
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };
  
  // Determine alert variant
  const alertVariant = variant === 'error' ? 'destructive' : 'default';
  
  return (
    <Alert variant={alertVariant} className="my-2">
      <div className="flex items-start gap-2">
        {getIcon()}
        <AlertDescription className="flex-1">
          <div className="font-medium">{message}</div>
          {detail && <div className="text-sm opacity-80 mt-1">{detail}</div>}
          
          {onRetry && (
            <div className="mt-3">
              <Button 
                variant={variant === 'error' ? 'secondary' : 'outline'} 
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </Button>
            </div>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default ErrorMessage;