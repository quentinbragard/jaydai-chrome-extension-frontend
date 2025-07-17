import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Gift, Shield, Sparkles, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    className="jd-space-y-8"
  >
    <div className="jd-relative jd-text-center jd-py-8">
      <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-br jd-from-blue-600/10 jd-via-purple-600/10 jd-to-pink-600/10 jd-rounded-3xl jd-blur-3xl" />
      <div className="jd-relative jd-z-10">
        <motion.div
          className="jd-inline-flex jd-items-center jd-justify-center jd-w-20 jd-h-20 jd-rounded-full jd-bg-gradient-to-r jd-from-blue-500 jd-to-purple-600 jd-shadow-2xl jd-shadow-blue-500/30 jd-mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <Crown className="jd-h-10 jd-w-10 jd-text-white" />
        </motion.div>
        <motion.h2
          className="jd-text-3xl md:jd-text-4xl jd-font-bold jd-text-white jd-font-heading jd-mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="jd-bg-gradient-to-r jd-from-blue-400 jd-via-purple-400 jd-to-pink-400 jd-bg-clip-text jd-text-transparent">
            {getMessage('upgradeTitle', undefined, 'Unlock Premium Features')}
          </span>
        </motion.h2>
        <motion.p
          className="jd-text-lg jd-text-gray-300 jd-max-w-2xl jd-mx-auto jd-mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {getMessage(
            'premiumDescription',
            undefined,
            'Get unlimited AI conversations, priority support, and exclusive templates to supercharge your productivity.'
          )}
        </motion.p>
        <motion.div
          className="jd-flex jd-flex-wrap jd-justify-center jd-gap-4 jd-mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { icon: Zap, text: getMessage('unlimitedAI', undefined, 'Unlimited AI') },
            { icon: Shield, text: getMessage('prioritySupport', undefined, 'Priority Support') },
            { icon: Sparkles, text: getMessage('exclusiveTemplates', undefined, 'Exclusive Templates') },
            { icon: Star, text: getMessage('advancedFeatures', undefined, 'Advanced Features') },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="jd-flex jd-items-center jd-space-x-2 jd-bg-gray-800/50 jd-backdrop-blur-sm jd-rounded-full jd-px-4 jd-py-2 jd-border jd-border-gray-700/50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <feature.icon className="jd-w-4 jd-h-4 jd-text-blue-400" />
              <span className="jd-text-sm jd-text-gray-300">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
    <motion.div
      className="jd-flex jd-justify-center jd-mb-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
    >
      <div className="jd-bg-gradient-to-r jd-from-green-500 jd-to-emerald-600 jd-rounded-full jd-px-6 jd-py-3 jd-flex jd-items-center jd-space-x-2 jd-shadow-lg">
        <Gift className="jd-w-5 jd-h-5 jd-text-white" />
        <span className="jd-text-white jd-font-semibold jd-text-sm">
          {getMessage('specialOffer', undefined, 'Special Launch Offer - Save 22% with Yearly Plan!')}
        </span>
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>
      <PricingPlans user={user} onPaymentSuccess={onPaymentSuccess} onPaymentCancel={onPaymentCancel} />
    </motion.div>
    <motion.div
      className="jd-flex jd-justify-between jd-items-center jd-pt-8 jd-border-t jd-border-gray-800/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <Button
        onClick={onBack}
        variant="outline"
        className="jd-border-gray-700 jd-text-gray-300 hover:jd-bg-gray-800 hover:jd-border-gray-600 jd-transition-all jd-duration-200 jd-font-heading"
        size="lg"
      >
        <ArrowLeft className="jd-mr-2 jd-h-4 jd-w-4" />
        {getMessage('back', undefined, 'Back')}
      </Button>
      {onSkip && (
        <Button onClick={onSkip} variant="ghost" className="jd-text-gray-400 hover:jd-text-white jd-transition-colors jd-group" size="lg">
          <span className="jd-group-hover:jd-mr-2 jd-transition-all jd-duration-200">
            {getMessage('skipForNow', undefined, 'Skip for now')}
          </span>
          <motion.span className="jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity" initial={{ width: 0 }} whileHover={{ width: 'auto' }}>
            →
          </motion.span>
        </Button>
      )}
    </motion.div>
    <motion.div
      className="jd-flex jd-flex-col jd-items-center jd-space-y-4 jd-pt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
    >
      <div className="jd-flex jd-items-center jd-space-x-2 jd-text-sm jd-text-gray-400">
        <Shield className="jd-w-4 jd-h-4 jd-text-green-400" />
        <span>{getMessage('securePayment', undefined, 'Secure payment powered by Stripe')}</span>
      </div>
      <div className="jd-flex jd-items-center jd-space-x-6 jd-text-xs jd-text-gray-500">
        <div className="jd-flex jd-items-center jd-space-x-1">
          <div className="jd-w-2 jd-h-2 jd-bg-green-500 jd-rounded-full" />
          <span>{getMessage('ssl', undefined, 'SSL Encrypted')}</span>
        </div>
        <div className="jd-flex jd-items-center jd-space-x-1">
          <div className="jd-w-2 jd-h-2 jd-bg-blue-500 jd-rounded-full" />
          <span>{getMessage('instantAccess', undefined, 'Instant Access')}</span>
        </div>
        <div className="jd-flex jd-items-center jd-space-x-1">
          <div className="jd-w-2 jd-h-2 jd-bg-purple-500 jd-rounded-full" />
          <span>{getMessage('cancelAnytime', undefined, 'Cancel Anytime')}</span>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

export default PaymentDefault;
