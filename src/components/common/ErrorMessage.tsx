import React from 'react';
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getMessage } from '@/core/utils/i18n';
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
        return <AlertTriangle className="jd-h-5 jd-w-5 jd-text-amber-500" />;
      case 'info':
        return <AlertCircle className="jd-h-5 jd-w-5 jd-text-blue-500" />;
      case 'error':
      default:
        return <AlertTriangle className="jd-h-5 jd-w-5 jd-text-red-500" />;
    }
  };
  
  // Determine alert variant
  const alertVariant = variant === 'error' ? 'destructive' : 'default';
  
  return (
    <Alert variant={alertVariant} className="jd-my-2">
      <div className="jd-flex jd-items-start jd-gap-2">
        {getIcon()}
        <AlertDescription className="jd-flex-1">
          <div className="jd-font-medium">{message}</div>
          {detail && <div className="jd-text-sm jd-opacity-80 jd-mt-1">{detail}</div>}
          
          {onRetry && (
            <div className="jd-mt-3">
              <Button 
                variant={variant === 'error' ? 'secondary' : 'outline'} 
                size="sm"
                onClick={onRetry}
                className="jd-flex jd-items-center jd-gap-1"
              >
                <RefreshCw className="jd-h-3.5 jd-w-3.5" />
                <span>{getMessage('tryAgain')}</span>
              </Button>
            </div>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default ErrorMessage;