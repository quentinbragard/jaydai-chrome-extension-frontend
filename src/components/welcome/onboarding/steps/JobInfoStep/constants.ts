import { getMessage } from '@/core/utils/i18n';

export const JOB_TYPES = [
  { value: 'content_comm_specialists', label: getMessage('onboardingStep1JobTypeContentCommSpecialists', undefined, 'Content & Communication Specialists') },
  { value: 'analysts_researchers', label: getMessage('onboardingStep1JobTypeAnalystsResearchers', undefined, 'Analysts & Researchers') },
  { value: 'customer_client_facing', label: getMessage('onboardingStep1JobTypeCustomerClientFacing', undefined, 'Customer & Client Facing Roles') },
  { value: 'product_dev_teams', label: getMessage('onboardingStep1JobTypeProductDevTeams', undefined, 'Product & Development Teams') },
  { value: 'hr_training_professionals', label: getMessage('onboardingStep1JobTypeHrTrainingProfessionals', undefined, 'HR & Training Professionals') },
  { value: 'entrepreneurs_business_owners', label: getMessage('onboardingStep1JobTypeEntrepreneursBusinessOwners', undefined, 'Entrepreneurs & Business Owners') },
  { value: 'sales_marketing', label: getMessage('onboardingStep1JobTypeSalesMarketing', undefined, 'Sales & Marketing') },
  { value: 'finance', label: getMessage('onboardingStep1JobTypeFinance', undefined, 'Finance') },
  { value: 'freelance', label: getMessage('onboardingStep1JobTypeFreelance', undefined, 'Freelance') },
  { value: 'other', label: getMessage('onboardingStep1JobTypeOther', undefined, 'Other') },
];

export const JOB_INDUSTRIES = [
  { value: 'tech_software_dev', label: getMessage('onboardingStep1JobIndustryTechSoftwareDev', undefined, 'Technology & Software Development') },
  { value: 'marketing_advertising', label: getMessage('onboardingStep1JobIndustryMarketingAdvertising', undefined, 'Marketing & Advertising') },
  { value: 'consulting_professional_services', label: getMessage('onboardingStep1JobIndustryConsultingProfessionalServices', undefined, 'Consulting & Professional Services') },
  { value: 'finance_banking', label: getMessage('onboardingStep1JobIndustryFinanceBanking', undefined, 'Finance & Banking') },
  { value: 'healthcare_medical', label: getMessage('onboardingStep1JobIndustryHealthcareMedical', undefined, 'Healthcare & Medical') },
  { value: 'legal_law', label: getMessage('onboardingStep1JobIndustryLegalLaw', undefined, 'Legal & Law') },
  { value: 'manufacturing_production', label: getMessage('onboardingStep1JobIndustryManufacturingProduction', undefined, 'Manufacturing & Production') },
  { value: 'media_entertainment', label: getMessage('onboardingStep1JobIndustryMediaEntertainment', undefined, 'Media & Entertainment') },
  { value: 'real_estate', label: getMessage('onboardingStep1JobIndustryRealEstate', undefined, 'Real Estate') },
  { value: 'ecommerce_retail', label: getMessage('onboardingStep1JobIndustryEcommerceRetail', undefined, 'E-commerce & Retail') },
  { value: 'education_training', label: getMessage('onboardingStep1JobIndustryEducationTraining', undefined, 'Education & Training') },
  { value: 'hr_recruitment', label: getMessage('onboardingStep1JobIndustryHrRecruitment', undefined, 'Human Resources & Recruitment') },
  { value: 'customer_service_support', label: getMessage('onboardingStep1JobIndustryCustomerServiceSupport', undefined, 'Customer Service & Support') },
  { value: 'other', label: getMessage('onboardingStep1JobIndustryOther', undefined, 'Other') },
];

export const JOB_SENIORITY = [
  { value: 'student', label: getMessage('onboardingStep1JobSeniorityStudent', undefined, 'Student') },
  { value: 'junior_0_5', label: getMessage('onboardingStep1JobSeniorityJunior05', undefined, 'Junior (0-5 years of experience)') },
  { value: 'mid_5_10', label: getMessage('onboardingStep1JobSeniorityMid510', undefined, 'Mid-level (5-10 years of experience)') },
  { value: 'senior_10_15', label: getMessage('onboardingStep1JobSenioritySenior1015', undefined, 'Senior (10-15 years of experience)') },
  { value: 'lead_15_plus', label: getMessage('onboardingStep1JobSeniorityLead15Plus', undefined, 'Lead/Manager (15+ years of experience)') },
  { value: 'executive', label: getMessage('onboardingStep1JobSeniorityExecutive', undefined, 'Executive (C-level/VP/Director)') },
  { value: 'other', label: getMessage('onboardingStep1JobSeniorityOther', undefined, 'Other') },
];
