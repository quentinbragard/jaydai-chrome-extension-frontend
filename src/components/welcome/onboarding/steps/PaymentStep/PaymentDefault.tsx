import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Gift, Shield, Sparkles, Star, Zap, CheckCircle, Users, TrendingUp, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import { getMessage } from '@/core/utils/i18n';
import { User } from '@/types';

interface PaymentDefaultProps {
  user: User;
  onBack: () => void;
  onSkip?: () => void;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

export const PaymentDefault: React.FC<PaymentDefaultProps> = ({
  user,
  onBack,
  onSkip,
  onPaymentSuccess,
  onPaymentCancel,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="jd-space-y-2"
  >
    {/* Social proof */}
    <motion.div
      className="jd-flex jd-justify-center jd-items-center jd-space-x-6 jd-py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <div className="jd-flex jd-items-center jd-space-x-2">
        <Users className="jd-w-4 jd-h-4 jd-text-blue-400" />
        <span className="jd-text-white jd-font-semibold jd-text-sm">1,000+</span>
        <span className="jd-text-gray-400 jd-text-sm">{getMessage('activeUsers', undefined, 'active users')}</span>
      </div>
      <div className="jd-flex jd-items-center jd-space-x-2">
        <Star className="jd-w-4 jd-h-4 jd-text-yellow-400" />
        <span className="jd-text-white jd-font-semibold jd-text-sm">5/5</span>
        <span className="jd-text-gray-400 jd-text-sm">{getMessage('rating', undefined, 'rating')}</span>
      </div>
      <div className="jd-flex jd-items-center jd-space-x-2">
        <TrendingUp className="jd-w-4 jd-h-4 jd-text-green-400" />
        <span className="jd-text-white jd-font-semibold jd-text-sm">2+ {getMessage('hoursSaved', undefined, 'hrs saved')}</span>
        <span className="jd-text-gray-400 jd-text-sm">{getMessage('daily', undefined, 'daily')}</span>
      </div>
    </motion.div>

    {/* Pricing */}
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 1.0, duration: 0.5 }}
    >
      <div className="jd-flex jd-items-center jd-justify-center jd-mb-2">
        <h2 className="jd-text-2xl jd-font-semibold jd-mb-2">
          {getMessage('choosePlan', undefined, 'Choose Your Plan')}
        </h2>
      </div>
      <PricingPlans
        user={user}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentCancel={onPaymentCancel}
        skipAction={onSkip}
      />
    </motion.div>

    {/* Enhanced money back guarantee with trial messaging */}
    <motion.div
      className="jd-flex jd-flex-col jd-items-center jd-space-y-2 jd-py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1 }}
    >
      <div className="jd-flex jd-items-center jd-space-x-2">
        <CheckCircle className="jd-w-5 jd-h-5 jd-text-green-400" />
        <span className="jd-text-green-400 jd-font-semibold jd-text-sm">
          {getMessage('noRiskTrial', undefined, 'No risk: 3-day free trial + 30-day money-back guarantee')}
        </span>
      </div>
      <p className="jd-text-gray-400 jd-text-xs jd-text-center jd-max-w-md">
        {getMessage('trialDisclaimer', undefined, 'You won\'t be charged during your 3-day trial. Cancel anytime before it ends and pay nothing.')}
      </p>
    </motion.div>

    {/* Navigation */}
    <motion.div
      className="jd-flex jd-justify-between jd-items-center jd-pt-6 jd-border-t jd-border-gray-800/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
    >
      <Button
        onClick={onBack}
        variant="ghost"
        className="jd-text-gray-400 hover:jd-text-white jd-transition-colors"
        size="sm"
      >
        <ArrowLeft className="jd-mr-2 jd-h-4 jd-w-4" />
        {getMessage('back', undefined, 'Back')}
      </Button>
      
      {onSkip && (
        <Button 
          onClick={onSkip} 
          variant="ghost" 
          className="jd-text-gray-400 hover:jd-text-white jd-transition-colors jd-group" 
          size="sm"
        >
          <span className="jd-group-hover:jd-mr-2 jd-transition-all jd-duration-200">
            {getMessage('continueWithFree', undefined, 'Continue with free')}
          </span>
          <motion.span 
            className="jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity" 
            initial={{ width: 0 }} 
            whileHover={{ width: 'auto' }}
          >
            →
          </motion.span>
        </Button>
      )}
    </motion.div>

    {/* Trust signals with trial emphasis */}
    <motion.div
      className="jd-flex jd-justify-center jd-items-center jd-space-x-4 jd-pt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.3 }}
    >
      <div className="jd-flex jd-items-center jd-space-x-1 jd-text-xs jd-text-gray-500">
        <Shield className="jd-w-3 jd-h-3 jd-text-green-400" />
        <span>{getMessage('securePayment', undefined, 'Secure payment')}</span>
      </div>
      <div className="jd-w-1 jd-h-1 jd-bg-gray-600 jd-rounded-full"></div>
      <div className="jd-flex jd-items-center jd-space-x-1 jd-text-xs jd-text-gray-500">
        <Clock className="jd-w-3 jd-h-3 jd-text-blue-400" />
        <span>{getMessage('3DayFreeTrial', undefined, '3-day free trial')}</span>
      </div>
      <div className="jd-w-1 jd-h-1 jd-bg-gray-600 jd-rounded-full"></div>
      <div className="jd-flex jd-items-center jd-space-x-1 jd-text-xs jd-text-gray-500">
        <Zap className="jd-w-3 jd-h-3 jd-text-yellow-400" />
        <span>{getMessage('instantActivation', undefined, 'Instant activation')}</span>
      </div>
    </motion.div>
  </motion.div>
);