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
    className="jd-space-y-6"
  >
    {/* Header with progress indicator */}
    <div className="jd-text-center jd-space-y-4">
      <div className="jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-mb-4">
        <div className="jd-flex jd-space-x-1">
          <div className="jd-w-2 jd-h-2 jd-bg-blue-500 jd-rounded-full"></div>
          <div className="jd-w-2 jd-h-2 jd-bg-blue-500 jd-rounded-full"></div>
          <div className="jd-w-2 jd-h-2 jd-bg-blue-500 jd-rounded-full"></div>
          <div className="jd-w-6 jd-h-2 jd-bg-gradient-to-r jd-from-blue-500 jd-to-purple-500 jd-rounded-full"></div>
        </div>
        <span className="jd-text-xs jd-text-gray-400 jd-font-medium">
          {getMessage('almostDone', undefined, 'Almost done!')}
        </span>
      </div>
    </div>

    {/* FREE TRIAL HERO SECTION */}
    <motion.div
      className="jd-bg-gradient-to-br jd-from-green-900/40 jd-to-emerald-900/40 jd-border-2 jd-border-green-500/50 jd-rounded-xl jd-p-6 jd-text-center jd-relative jd-overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      {/* Animated background elements */}
      <motion.div 
        className="jd-absolute jd-top-2 jd-right-2 jd-text-green-400/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="jd-w-8 jd-h-8" />
      </motion.div>
      
      <motion.div 
        className="jd-absolute jd-bottom-2 jd-left-2 jd-text-green-400/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <Gift className="jd-w-6 jd-h-6" />
      </motion.div>

      <div className="jd-relative jd-z-10">
        <motion.div
          className="jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Gift className="jd-w-6 jd-h-6 jd-text-green-400" />
          <Badge className="jd-bg-green-500 jd-text-white jd-font-bold jd-text-sm jd-px-4 jd-py-1.5 jd-animate-pulse">
            {getMessage('freeTrial', undefined, 'FREE TRIAL')}
          </Badge>
        </motion.div>
        
        <motion.h2 
          className="jd-text-2xl jd-font-bold jd-text-white jd-mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          🎉 {getMessage('startFree3DayTrial', undefined, 'Start Your FREE 3-Day Trial!')}
        </motion.h2>
        
        <motion.p 
          className="jd-text-green-200 jd-text-lg jd-mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {getMessage('trialDescription', undefined, 'Try all premium features risk-free. Cancel anytime during your trial.')}
        </motion.p>

        <motion.div
          className="jd-flex jd-items-center jd-justify-center jd-space-x-4 jd-text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="jd-flex jd-items-center jd-space-x-2 jd-text-green-300">
            <Calendar className="jd-w-4 jd-h-4" />
            <span className="jd-font-semibold">{getMessage('3DaysCompleteFree', undefined, '3 days completely free')}</span>
          </div>
          <div className="jd-w-1 jd-h-1 jd-bg-green-400 jd-rounded-full"></div>
          <div className="jd-flex jd-items-center jd-space-x-2 jd-text-green-300">
            <CheckCircle className="jd-w-4 jd-h-4" />
            <span className="jd-font-semibold">{getMessage('cancelAnytimeDuringTrial', undefined, 'Cancel anytime during trial')}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>

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

    {/* Trial Benefits Section */}
    <motion.div 
      className="jd-bg-gray-800/50 jd-border jd-border-gray-700/50 jd-rounded-lg jd-p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
    >
      <h3 className="jd-text-lg jd-font-semibold jd-text-white jd-mb-3 jd-text-center">
        {getMessage('whatYouGetInTrial', undefined, 'What you get in your trial:')}
      </h3>
      <div className="jd-grid jd-grid-cols-2 jd-gap-3 jd-text-sm">
        <div className="jd-flex jd-items-center jd-space-x-2 jd-text-green-300">
          <CheckCircle className="jd-w-4 jd-h-4 jd-flex-shrink-0" />
          <span>{getMessage('trial1000Templates', undefined, '1000+ premium templates')}</span>
        </div>
        <div className="jd-flex jd-items-center jd-space-x-2 jd-text-green-300">
          <CheckCircle className="jd-w-4 jd-h-4 jd-flex-shrink-0" />
          <span>{getMessage('trialUnlimitedPersonal', undefined, 'Unlimited personal templates')}</span>
        </div>
        <div className="jd-flex jd-items-center jd-space-x-2 jd-text-green-300">
          <CheckCircle className="jd-w-4 jd-h-4 jd-flex-shrink-0" />
          <span>{getMessage('trialAdvancedAnalytics', undefined, 'Advanced analytics')}</span>
        </div>
        <div className="jd-flex jd-items-center jd-space-x-2 jd-text-green-300">
          <CheckCircle className="jd-w-4 jd-h-4 jd-flex-shrink-0" />
          <span>{getMessage('trialPremiumSupport', undefined, 'Premium support')}</span>
        </div>
      </div>
    </motion.div>

    {/* Pricing */}
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 1.0, duration: 0.5 }}
    >
      <PricingPlans 
        user={user} 
        onPaymentSuccess={onPaymentSuccess} 
        onPaymentCancel={onPaymentCancel} 
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