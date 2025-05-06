// src/components/onboarding/steps/JobInfoStep.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { OnboardingData } from '../OnboardingFlow';
import { trackEvent, EVENTS } from '@/utils/amplitude';

// Job type options
const JOB_TYPES = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'product', label: 'Product Management' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'customer_support', label: 'Customer Support' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'research', label: 'Research' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' }
];

// Industry options
const JOB_INDUSTRIES = [
  { value: 'tech', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'government', label: 'Government' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'energy', label: 'Energy' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'other', label: 'Other' }
];

// Seniority levels
const JOB_SENIORITY = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
  { value: 'vp', label: 'VP' },
  { value: 'executive', label: 'Executive (C-level)' },
  { value: 'student', label: 'Student' },
  { value: 'other', label: 'Other' }
];

interface JobInfoStepProps {
  initialData: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
}

export const JobInfoStep: React.FC<JobInfoStepProps> = ({ initialData, onNext }) => {
  // Local state for this step
  const [jobType, setJobType] = useState<string | null>(initialData.job_type);
  const [jobIndustry, setJobIndustry] = useState<string | null>(initialData.job_industry);
  const [jobSeniority, setJobSeniority] = useState<string | null>(initialData.job_seniority);
  
  // Validation state
  const [errors, setErrors] = useState({
    jobType: false,
    jobIndustry: false,
    jobSeniority: false
  });
  
  // Check if all required fields are filled
  const isFormValid = jobType && jobIndustry && jobSeniority;
  
  // Handle next button click with validation
  const handleNext = () => {
    // Validate the form
    const newErrors = {
      jobType: !jobType,
      jobIndustry: !jobIndustry,
      jobSeniority: !jobSeniority
    };
    
    setErrors(newErrors);
    
    // Only proceed if all fields are valid
    if (isFormValid) {
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
        job_seniority: jobSeniority
      });
    }
  };
  
  return (
    <div className="jd-space-y-6">
      <div className="jd-text-center jd-mb-8">
        <h3 className="jd-text-xl jd-font-medium jd-text-white jd-mb-2">
          {getMessage('tellUsAboutJob', undefined, 'Tell us about your job')}
        </h3>
        <p className="jd-text-gray-400 jd-text-sm">
          {getMessage('jobInfoHelp', undefined, 'This helps us provide you with the most relevant AI templates')}
        </p>
      </div>
      
      {/* Job Type Selection */}
      <div className="jd-space-y-2">
        <Label htmlFor="jobType" className={`jd-text-sm jd-font-medium ${errors.jobType ? 'jd-text-red-400' : 'jd-text-gray-200'}`}>
          {getMessage('jobType', undefined, 'What type of work do you do?')} *
        </Label>
        <Select
          value={jobType || ''}
          onValueChange={(value) => setJobType(value)}
        >
          <SelectTrigger 
            id="jobType"
            className={`jd-w-full jd-bg-gray-800 jd-border-gray-700 jd-text-white ${errors.jobType ? 'jd-border-red-400' : ''}`}
          >
            <SelectValue placeholder={getMessage('selectJobType', undefined, 'Select job type')} />
          </SelectTrigger>
          <SelectContent className="jd-bg-gray-800 jd-border-gray-700">
            {JOB_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value} className="jd-text-white hover:jd-bg-gray-700">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.jobType && (
          <p className="jd-text-red-400 jd-text-xs jd-mt-1">
            {getMessage('jobTypeRequired', undefined, 'Please select your job type')}
          </p>
        )}
      </div>
      
      {/* Industry Selection */}
      <div className="jd-space-y-2">
        <Label htmlFor="jobIndustry" className={`jd-text-sm jd-font-medium ${errors.jobIndustry ? 'jd-text-red-400' : 'jd-text-gray-200'}`}>
          {getMessage('jobIndustry', undefined, 'What industry do you work in?')} *
        </Label>
        <Select
          value={jobIndustry || ''}
          onValueChange={(value) => setJobIndustry(value)}
        >
          <SelectTrigger 
            id="jobIndustry"
            className={`jd-w-full jd-bg-gray-800 jd-border-gray-700 jd-text-white ${errors.jobIndustry ? 'jd-border-red-400' : ''}`}
          >
            <SelectValue placeholder={getMessage('selectIndustry', undefined, 'Select industry')} />
          </SelectTrigger>
          <SelectContent className="jd-bg-gray-800 jd-border-gray-700">
            {JOB_INDUSTRIES.map((industry) => (
              <SelectItem key={industry.value} value={industry.value} className="jd-text-white hover:jd-bg-gray-700">
                {industry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.jobIndustry && (
          <p className="jd-text-red-400 jd-text-xs jd-mt-1">
            {getMessage('industryRequired', undefined, 'Please select your industry')}
          </p>
        )}
      </div>
      
      {/* Seniority Selection */}
      <div className="jd-space-y-2">
        <Label htmlFor="jobSeniority" className={`jd-text-sm jd-font-medium ${errors.jobSeniority ? 'jd-text-red-400' : 'jd-text-gray-200'}`}>
          {getMessage('jobSeniority', undefined, 'What is your seniority level?')} *
        </Label>
        <Select
          value={jobSeniority || ''}
          onValueChange={(value) => setJobSeniority(value)}
        >
          <SelectTrigger 
            id="jobSeniority"
            className={`jd-w-full jd-bg-gray-800 jd-border-gray-700 jd-text-white ${errors.jobSeniority ? 'jd-border-red-400' : ''}`}
          >
            <SelectValue placeholder={getMessage('selectSeniority', undefined, 'Select seniority')} />
          </SelectTrigger>
          <SelectContent className="jd-bg-gray-800 jd-border-gray-700">
            {JOB_SENIORITY.map((seniority) => (
              <SelectItem key={seniority.value} value={seniority.value} className="jd-text-white hover:jd-bg-gray-700">
                {seniority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.jobSeniority && (
          <p className="jd-text-red-400 jd-text-xs jd-mt-1">
            {getMessage('seniorityRequired', undefined, 'Please select your seniority level')}
          </p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="jd-flex jd-justify-end jd-pt-4">
        <Button 
          onClick={handleNext} 
          className="jd-bg-blue-600 hover:jd-bg-blue-700 jd-text-white jd-font-heading"
        >
          {getMessage('nextStep', undefined, 'Next Step')}
          <ArrowRight className="jd-ml-2 jd-h-4 jd-w-4" />
        </Button>
      </div>
    </div>
  );
};

export default JobInfoStep;