import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';

export const PaymentSuccess: React.FC = () => (
  <motion.div
    className="jd-space-y-8 jd-text-center jd-py-12"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="jd-relative jd-flex jd-justify-center">
      <motion.div
        className="jd-relative jd-w-24 jd-h-24 jd-bg-gradient-to-r jd-from-green-500 jd-to-emerald-600 jd-rounded-full jd-flex jd-items-center jd-justify-center jd-shadow-2xl jd-shadow-green-500/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <Check className="jd-w-12 jd-h-12 jd-text-white" />
      </motion.div>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="jd-absolute jd-w-2 jd-h-2 jd-bg-yellow-400 jd-rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            x: [0, (i % 2 ? 80 : -80) * Math.sin(i * 45 * Math.PI / 180)],
            y: [0, (i % 2 ? 80 : -80) * Math.cos(i * 45 * Math.PI / 180)],
          }}
          transition={{ duration: 1.5, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
        />
      ))}
    </div>

    <div className="jd-space-y-4">
      <motion.h3
        className="jd-text-3xl jd-font-bold jd-text-white jd-font-heading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        🎉 {getMessage('paymentSuccessful', undefined, 'Payment Successful!')}
      </motion.h3>
      <motion.p
        className="jd-text-lg jd-text-gray-300 jd-max-w-md jd-mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {getMessage(
          'paymentSuccessMessage',
          undefined,
          'Welcome to Jaydai Premium! Your account has been upgraded.'
        )}
      </motion.p>
    </div>

    <motion.div
      className="jd-flex jd-justify-center jd-items-center jd-space-x-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="jd-animate-spin jd-rounded-full jd-h-6 jd-w-6 jd-border-2 jd-border-blue-500 jd-border-t-transparent" />
      <span className="jd-text-blue-400 jd-text-sm">
        {getMessage('completing', undefined, 'Completing setup...')}
      </span>
    </motion.div>
  </motion.div>
);

export default PaymentSuccess;
