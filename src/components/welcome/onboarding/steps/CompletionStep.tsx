// src/components/welcome/onboarding/steps/CompletionStep.tsx - Updated
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Star, Folder, TrendingUp } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { AIToolGrid } from '@/components/welcome/AIToolGrid';

interface FolderDetail {
  id: number;
  title: string;
  description?: string | null;
  type: string;
}

interface FolderRecommendationResult {
  success: boolean;
  new_folders: number[];
  total_recommended: number[];
  total_pinned: number[];
  folder_details?: FolderDetail[];
  explanation: {
    starter_pack: number[];
    professional_role: number[];
    industry: number[];
    seniority: number[];
    interests: number[];
  };
  message: string;
}

interface CompletionStepProps {
  onComplete: () => void;
  folderRecommendations?: FolderRecommendationResult | null;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({ 
  onComplete, 
  folderRecommendations 
}) => {
  // Track when component mounts
  useEffect(() => {
    trackEvent(EVENTS.ONBOARDING_COMPLETED);
  }, []);


  
  return (
    <motion.div 
      className="jd-space-y-6 jd-flex jd-flex-col jd-items-center jd-text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success animation */}
      <div className="jd-relative jd-p-4 jd-mb-4">
        <motion.div 
          className="jd-absolute jd-inset-0 jd-rounded-full jd-bg-gradient-to-r jd-from-green-500/20 jd-to-teal-500/20 jd-blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        
        <motion.div
          className="jd-relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
        >
          <div className="jd-bg-gradient-to-r jd-from-green-500 jd-to-teal-500 jd-w-24 jd-h-24 jd-rounded-full jd-flex jd-items-center jd-justify-center">
            <CheckCircle2 className="jd-h-12 jd-w-12 jd-text-white" />
          </div>
          
          {/* Celebration stars */}
          <CelebrationStars />
        </motion.div>
      </div>
      
      <motion.h3 
        className="jd-text-2xl jd-font-bold jd-text-white jd-font-heading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {getMessage('onboardingComplete', undefined, 'Setup Complete!')}
      </motion.h3>
      
      <motion.p 
        className="jd-text-gray-300 jd-max-w-md jd-mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {getMessage(
          'onboardingCompleteDescription', 
          undefined, 
          'Thank you for completing your profile. Your personalized AI templates are now ready to use.'
        )}
      </motion.p>

      {/* Main Call-to-Action: AI Tools Grid */}
      <motion.div
        className="jd-w-full jd-max-w-4xl jd-mx-auto jd-mt-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="jd-bg-gradient-to-br jd-from-blue-900/30 jd-to-indigo-900/30 jd-border jd-border-blue-700/50 jd-rounded-xl jd-p-8 jd-backdrop-blur-sm jd-shadow-2xl">
          <div className="jd-text-center jd-mb-6">
            <h3 className="jd-text-2xl jd-font-bold jd-text-white jd-mb-2 jd-font-heading">
              🚀 {getMessage('startUsingAI', undefined, 'Start Using AI Tools Now')}
            </h3>
            <p className="jd-text-blue-200 jd-text-lg">
              {getMessage('chooseYourTool', undefined, 'Choose your preferred AI tool to get started')}
            </p>
          </div>
          
          <AIToolGrid onToolClick={onComplete} />
          
          <div className="jd-flex jd-justify-center jd-mt-6">
            <Button
              onClick={onComplete}
              variant="outline"
              className="jd-border-blue-600 jd-text-blue-300 hover:jd-bg-blue-900/50 jd-font-heading jd-transition-all jd-duration-200"
              size="lg"
            >
              {getMessage('returnToHome', undefined, 'Return to Home')}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Compact Info Cards */}
      <motion.div 
        className="jd-flex jd-flex-col md:jd-flex-row jd-gap-4 jd-mt-6 jd-max-w-4xl jd-w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        
        {/* What's Next - Compact */}
        <div className="jd-bg-gray-800/40 jd-border jd-border-gray-700/50 jd-rounded-lg jd-p-4 jd-flex-1 jd-backdrop-blur-sm">
          <div className="jd-flex jd-items-center jd-gap-2 jd-mb-3">
            <Sparkles className="jd-h-4 jd-w-4 jd-text-blue-400" />
            <h4 className="jd-text-blue-400 jd-font-medium jd-text-sm">
              {getMessage('whatNext', undefined, 'What\'s Next?')}
            </h4>
          </div>
          <p className="jd-text-gray-400 jd-text-xs jd-leading-relaxed">
            {getMessage(
              'whatNextDescription', 
              undefined, 
              'Open your preferred AI tool above to start using personalized templates. Look for our extension button in the bottom corner.'
            )}
          </p>
        </div>
      </motion.div>

      {/* Onboarding walkthrough video */}
      <motion.div
        className="jd-w-full jd-max-w-2xl jd-mx-auto jd-mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div
          style={{ position: 'relative', paddingBottom: '62.5%', height: 0 }}
        >
          <iframe
            src="https://www.loom.com/embed/c910c2ceeea042d99b977b12bd8dba3e?sid=0ffed202-793e-4924-afad-8e89569a68c4"
            frameBorder="0"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Celebration animation component
const CelebrationStars = () => {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="jd-absolute"
          style={{
            top: '50%',
            left: '50%',
            x: `-50%`,
            y: `-50%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            x: [0, (i % 2 ? 60 : -60) * Math.sin(i * 45 * Math.PI / 180)],
            y: [0, (i % 2 ? 60 : -60) * Math.cos(i * 45 * Math.PI / 180)], 
          }}
          transition={{ 
            duration: 1,
            delay: 0.3 + (i * 0.05),
            ease: "easeOut" 
          }}
        >
          <Star className="jd-h-4 jd-w-4 jd-text-yellow-300" />
        </motion.div>
      ))}
    </>
  );
};