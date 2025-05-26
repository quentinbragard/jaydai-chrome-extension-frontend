// src/components/templates/metadata/types.ts

export type MetadataType = 
  | 'audience' 
  | 'tone' 
  | 'language' 
  | 'output_format' 
  | 'max_length' 
  | 'style' 
  | 'complexity' 
  | 'domain' 
  | 'perspective'
  | 'urgency'
  | 'formality';

export interface MetadataField {
  id: string;
  type: MetadataType;
  label: string;
  value: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: string[]; // For dropdown/select fields
  inputType?: 'text' | 'select' | 'textarea' | 'number';
}

export interface PromptMetadata {
  fields: MetadataField[];
}

// Predefined metadata configurations
export const METADATA_CONFIGS: Record<MetadataType, {
  label: string;
  description: string;
  placeholder: string;
  inputType: 'text' | 'select' | 'textarea' | 'number';
  options?: string[];
  icon: string;
  category: 'core' | 'format' | 'style' | 'context';
}> = {
  audience: {
    label: 'Audience',
    description: 'Who is the target audience for this content?',
    placeholder: 'e.g., Business professionals, Students, General public',
    inputType: 'select',
    options: [
      'Business professionals',
      'Students',
      'General public',
      'Technical experts',
      'Children',
      'Academics',
      'Creative professionals',
      'Healthcare workers',
      'Custom...'
    ],
    icon: '👥',
    category: 'core'
  },
  tone: {
    label: 'Tone',
    description: 'What tone should the response have?',
    placeholder: 'e.g., Professional, Casual, Friendly',
    inputType: 'select',
    options: [
      'Professional',
      'Casual',
      'Friendly',
      'Formal',
      'Conversational',
      'Authoritative',
      'Empathetic',
      'Enthusiastic',
      'Neutral',
      'Custom...'
    ],
    icon: '🎭',
    category: 'style'
  },
  language: {
    label: 'Language',
    description: 'What language should the response be in?',
    placeholder: 'e.g., English, Spanish, French',
    inputType: 'select',
    options: [
      'English',
      'Spanish',
      'French',
      'German',
      'Italian',
      'Portuguese',
      'Chinese',
      'Japanese',
      'Korean',
      'Arabic',
      'Custom...'
    ],
    icon: '🌐',
    category: 'core'
  },
  output_format: {
    label: 'Output Format',
    description: 'How should the response be formatted?',
    placeholder: 'e.g., Bullet points, Paragraph, Table',
    inputType: 'select',
    options: [
      'Paragraph',
      'Bullet points',
      'Numbered list',
      'Table',
      'JSON',
      'Markdown',
      'HTML',
      'Code block',
      'Step-by-step',
      'Custom...'
    ],
    icon: '📝',
    category: 'format'
  },
  max_length: {
    label: 'Maximum Length',
    description: 'Maximum length constraint for the response',
    placeholder: 'e.g., 500 words, 2 paragraphs, 1 page',
    inputType: 'text',
    icon: '📏',
    category: 'format'
  },
  style: {
    label: 'Writing Style',
    description: 'What writing style should be used?',
    placeholder: 'e.g., Academic, Journalistic, Creative',
    inputType: 'select',
    options: [
      'Academic',
      'Journalistic',
      'Creative',
      'Technical',
      'Persuasive',
      'Descriptive',
      'Narrative',
      'Explanatory',
      'Custom...'
    ],
    icon: '✍️',
    category: 'style'
  },
  complexity: {
    label: 'Complexity Level',
    description: 'How complex should the response be?',
    placeholder: 'e.g., Beginner, Intermediate, Advanced',
    inputType: 'select',
    options: [
      'Beginner',
      'Intermediate',
      'Advanced',
      'Expert',
      'Child-friendly',
      'Custom...'
    ],
    icon: '🎯',
    category: 'context'
  },
  domain: {
    label: 'Domain/Field',
    description: 'What domain or field is this related to?',
    placeholder: 'e.g., Technology, Healthcare, Finance',
    inputType: 'text',
    icon: '🏢',
    category: 'context'
  },
  perspective: {
    label: 'Perspective',
    description: 'From what perspective should the response be written?',
    placeholder: 'e.g., First person, Third person, Expert view',
    inputType: 'select',
    options: [
      'First person',
      'Second person',
      'Third person',
      'Expert perspective',
      'Customer perspective',
      'Neutral observer',
      'Custom...'
    ],
    icon: '👁️',
    category: 'style'
  },
  urgency: {
    label: 'Urgency Level',
    description: 'How urgent or time-sensitive is this?',
    placeholder: 'e.g., High, Medium, Low',
    inputType: 'select',
    options: [
      'Low',
      'Medium',
      'High',
      'Critical',
      'Custom...'
    ],
    icon: '⚡',
    category: 'context'
  },
  formality: {
    label: 'Formality Level',
    description: 'How formal should the response be?',
    placeholder: 'e.g., Very formal, Moderate, Informal',
    inputType: 'select',
    options: [
      'Very formal',
      'Formal',
      'Moderate',
      'Informal',
      'Very informal',
      'Custom...'
    ],
    icon: '🎩',
    category: 'style'
  }
} as const;

// Default metadata fields that every prompt should have
export const DEFAULT_METADATA_FIELDS: MetadataField[] = [
  {
    id: 'audience',
    type: 'audience',
    label: 'Audience',
    value: '',
    required: true
  },
  {
    id: 'tone',
    type: 'tone',
    label: 'Tone',
    value: '',
    required: true
  },
  {
    id: 'language',
    type: 'language',
    label: 'Language',
    value: 'English',
    required: true
  }
];

// Helper function to get metadata config safely
export function getMetadataConfig(type: MetadataType) {
  return METADATA_CONFIGS[type];
}

// Helper function to format metadata for prompt
export function formatMetadataForPrompt(metadata: PromptMetadata): string {
  return metadata.fields
    .filter(field => field.value && field.value.trim())
    .map(field => {
      const config = getMetadataConfig(field.type);
      return `${config.label}: ${field.value}`;
    })
    .join('\n');
}