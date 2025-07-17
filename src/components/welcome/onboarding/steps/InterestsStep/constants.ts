import { getMessage } from '@/core/utils/i18n';

export const INTERESTS = [
  { value: 'writing', label: getMessage('onboardingStep2InterestsWriting', undefined, 'Writing & Content Creation') },
  { value: 'coding', label: getMessage('onboardingStep2InterestsCoding', undefined, 'Coding & Development') },
  { value: 'data_analysis', label: getMessage('onboardingStep2InterestsDataAnalysis', undefined, 'Data Analysis') },
  { value: 'research', label: getMessage('onboardingStep2InterestsResearch', undefined, 'Research') },
  { value: 'creativity', label: getMessage('onboardingStep2InterestsCreativity', undefined, 'Creative Work') },
  { value: 'learning', label: getMessage('onboardingStep2InterestsLearning', undefined, 'Learning & Education') },
  { value: 'marketing', label: getMessage('onboardingStep2InterestsMarketing', undefined, 'Marketing & SEO') },
  { value: 'email', label: getMessage('onboardingStep2InterestsEmail', undefined, 'Email Drafting') },
  { value: 'summarizing', label: getMessage('onboardingStep2InterestsSummarizing', undefined, 'Document Summarization') },
  { value: 'critical_thinking', label: getMessage('onboardingStep2InterestsCriticalThinking', undefined, 'Critical Thinking & Analysis') },
  { value: 'customer_support', label: getMessage('onboardingStep2InterestsCustomerSupport', undefined, 'Customer Support') },
  { value: 'decision_making', label: getMessage('onboardingStep2InterestsDecisionMaking', undefined, 'Decision Making') },
  { value: 'language_learning', label: getMessage('onboardingStep2InterestsLanguageLearning', undefined, 'Language Learning') },
  { value: 'other', label: getMessage('onboardingStep2InterestsOther', undefined, 'Other') },
];
