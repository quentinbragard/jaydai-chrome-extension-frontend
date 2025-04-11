// src/extension/popup/constants/ai-tools.tsx
import React from 'react';
import { AITool } from '../types/tool-types';

// AI Tool Configuration
export const AI_TOOLS: AITool[] = [
  {
    name: 'ChatGPT',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//chatgpt_logo.png" alt="ChatGPT" className="jd-h-8 jd-w-8" />,
    url: 'https://chat.openai.com/',
    description: 'OpenAI\'s conversational AI',
    disabled: false,
    color: 'jd-from-green-500/20 jd-to-emerald-500/20'
  },
  {
    name: 'Claude',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//claude_logo.png" alt="Claude" className="jd-h-8 jd-w-8" />,
    url: 'https://claude.ai/',
    description: 'Anthropic\'s AI assistant',
    disabled: true,
    color: 'jd-from-purple-500/20 jd-to-indigo-500/20'
  },
  {
    name: 'Gemini',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//gemini_logo.png" alt="Gemini" className="jd-h-8 jd-w-8" />,
    url: 'https://gemini.google.com/',
    description: 'Google\'s generative AI',
    disabled: true,
    color: 'jd-from-blue-500/20 jd-to-sky-500/20'
  },
  {
    name: 'Mistral',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//mistral_logo.png" alt="Mistral" className="jd-h-8 jd-w-8" />,
    url: 'https://chat.mistral.ai/',
    description: 'Mistral AI\'s conversational model',
    disabled: true,
    color: 'jd-from-amber-500/20 jd-to-yellow-500/20'
  },
  {
    name: 'Perplexity',
    icon: <img src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//perplexity_logo.png" alt="Perplexity" className="jd-h-8 jd-w-8" />,
    url: 'https://www.perplexity.ai/',
    description: 'AI-powered search and chat',
    disabled: true,
    color: 'jd-from-pink-500/20 jd-to-rose-500/20'
  }
];