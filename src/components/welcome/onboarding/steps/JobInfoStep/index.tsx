// src/extension/welcome/onboarding/steps/JobInfoStep.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { OnboardingData } from '../OnboardingFlow';
import { JOB_TYPES, JOB_INDUSTRIES, JOB_SENIORITY } from './constants';

// Components
import { OnboardingSelect } from '@/components/welcome/onboarding/OnboardingSelect';
import { OnboardingActions } from '@/components/welcome/onboarding/OnboardingActions';
import { OtherOptionInput } from '@/components/welcome/onboarding/OtherOptionInput';


interface JobInfoStepProps {
  initialData: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  isSubmitting: boolean;
}

export const JobInfoStep: React.FC<JobInfoStepProps> = ({ 
    initialData, 
    onNext,
    isSubmitting
  }) => {
    // Local state for this step - keep your original state setup
    const [jobType, setJobType] = useState<string | null>(initialData.job_type);
    const [jobIndustry, setJobIndustry] = useState<string | null>(initialData.job_industry);
    const [jobSeniority, setJobSeniority] = useState<string | null>(initialData.job_seniority);
    const [otherJobType, setOtherJobType] = useState<string>(initialData.job_other_details || '');
    
    // Validation state - keep your original validation
    const [errors, setErrors] = useState({
      jobType: false,
      jobIndustry: false,
      jobSeniority: false,
      otherJobType: false
    });
    
  // Check if all required fields are filled
  const isFormValid = () => {
    const validJobType = jobType !== null && (jobType !== 'other' || otherJobType.trim() !== '');
    const validJobIndustry = jobIndustry !== null;
    const validJobSeniority = jobSeniority !== null;
    
    return validJobType && validJobIndustry && validJobSeniority;
  };
  
  // Handle next button click with validation
  const handleNext = () => {
    // Validate the form
    const newErrors = {
      jobType: !jobType,
      jobIndustry: !jobIndustry,
      jobSeniority: !jobSeniority,
      otherJobType: jobType === 'other' && otherJobType.trim() === ''
    };
    
    setErrors(newErrors);
    
    // Only proceed if all fields are valid
    if (isFormValid()) {
      // Track step completion
      trackEvent(EVENTS.ONBOARDING_STEP_COMPLETED, {
        step: 'job_info',
        job_type: jobType,
        job_industry: jobIndustry,
        job_seniority: jobSeniority
      });
      
      // Pass the data up to the parent
      onNext({
        job_type: jobType,
        job_industry: jobIndustry,
        job_seniority: jobSeniority,
        job_other_details: jobType === 'other' ? otherJobType : null
      });
    }
  };

  // Handle job type change
  const handleJobTypeChange = (value: string) => {
    setJobType(value);
    // Clear error when selection is made
    setErrors(prev => ({ ...prev, jobType: false }));
    
    // If not "other", clear other error as well
    if (value !== 'other') {
      setErrors(prev => ({ ...prev, otherJobType: false }));
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="jd-space-y-6"
    >
      <div className="jd-text-center jd-mb-8">
        <motion.div 
          className="jd-inline-flex jd-items-center jd-justify-center jd-w-16 jd-h-16 jd-rounded-full jd-bg-blue-500/10 jd-mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.1 
          }}
        >
          <Briefcase className="jd-h-8 jd-w-8 jd-text-blue-400" />
        </motion.div>
        <h3 className="jd-text-xl jd-font-medium jd-text-white jd-mb-2">
          {getMessage('tellUsAboutJob', undefined, 'Tell us about your job')}
        </h3>
        <p className="jd-text-gray-400 jd-text-sm">
          {getMessage('jobInfoHelp', undefined, 'This helps us provide you with the most relevant AI templates')}
        </p>
      </div>
      
      <div className="jd-space-y-6">
        {/* Job Type Selection */}
        <OnboardingSelect
          id="jobType"
          label={getMessage('jobType', undefined, 'What type of work do you do?')}
          placeholder={getMessage('selectJobType', undefined, 'Select job type')}
          options={JOB_TYPES}
          value={jobType}
          onChange={handleJobTypeChange}
          required
          error={errors.jobType}
          errorMessage={getMessage('jobTypeRequired', undefined, 'Please select your job type')}
        />
        
        {/* Other Job Type Input */}
        {jobType === 'other' && (
          <div className="jd-ml-2 jd-mt-2">
            <OtherOptionInput
              value={otherJobType}
              onChange={(value) => {
                setOtherJobType(value);
                setErrors(prev => ({ ...prev, otherJobType: value.trim() === '' }));
              }}
              placeholder={getMessage('specifyJobType', undefined, 'Please specify your job type...')}
            />
            {errors.otherJobType && (
              <p className="jd-text-red-400 jd-text-xs jd-mt-1 jd-ml-6">
                {getMessage('otherJobTypeRequired', undefined, 'Please specify your job type')}
              </p>
            )}
          </div>
        )}
        
        {/* Industry Selection */}
        <OnboardingSelect
          id="jobIndustry"
          label={getMessage('jobIndustry', undefined, 'What industry do you work in?')}
          placeholder={getMessage('selectIndustry', undefined, 'Select industry')}
          options={JOB_INDUSTRIES}
          value={jobIndustry}
          onChange={(value) => {
            setJobIndustry(value);
            setErrors(prev => ({ ...prev, jobIndustry: false }));
          }}
          required
          error={errors.jobIndustry}
          errorMessage={getMessage('industryRequired', undefined, 'Please select your industry')}
        />
        
        {/* Seniority Selection */}
        <OnboardingSelect
          id="jobSeniority"
          label={getMessage('jobSeniority', undefined, 'What is your seniority level?')}
          placeholder={getMessage('selectSeniority', undefined, 'Select seniority')}
          options={JOB_SENIORITY}
          value={jobSeniority}
          onChange={(value) => {
            setJobSeniority(value);
            setErrors(prev => ({ ...prev, jobSeniority: false }));
          }}
          required
          error={errors.jobSeniority}
          errorMessage={getMessage('seniorityRequired', undefined, 'Please select your seniority level')}
        />
      </div>
      
      {/* Action Buttons */}
      <OnboardingActions 
        onNext={handleNext}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
};

export default JobInfoStep;

