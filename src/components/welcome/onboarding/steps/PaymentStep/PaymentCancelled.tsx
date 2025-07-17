import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';

interface PaymentCancelledProps {
  onTryAgain: () => void;
  onSkip: () => void;
}

export const PaymentCancelled: React.FC<PaymentCancelledProps> = ({ onTryAgain, onSkip }) => (
  <motion.div
    className="jd-space-y-8 jd-text-center jd-py-12"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="jd-w-16 jd-h-16 jd-bg-orange-500/20 jd-rounded-full jd-flex jd-items-center jd-justify-center jd-mx-auto">
      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 2 }}>
        <CreditCard className="jd-w-8 jd-h-8 jd-text-orange-400" />
      </motion.div>
    </div>
    <div className="jd-space-y-3">
      <h3 className="jd-text-2xl jd-font-bold jd-text-white jd-font-heading">
        {getMessage('paymentCancelled', undefined, 'Payment Cancelled')}
      </h3>
      <p className="jd-text-gray-400 jd-max-w-md jd-mx-auto">
        {getMessage('paymentCancelledMessage', undefined, 'No worries! You can upgrade to premium anytime.')}
      </p>
    </div>
    <div className="jd-flex jd-flex-col jd-space-y-4 jd-max-w-sm jd-mx-auto">
      <Button onClick={onTryAgain} className="jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 hover:jd-from-blue-700 hover:jd-to-purple-700 jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300" size="lg">
        {getMessage('tryAgain', undefined, 'Try Again')}
      </Button>
      <Button onClick={onSkip} variant="ghost" className="jd-text-gray-400 hover:jd-text-white jd-transition-colors">
        {getMessage('continueWithFree', undefined, 'Continue with Free Plan')}
      </Button>
    </div>
  </motion.div>
);

export default PaymentCancelled;
