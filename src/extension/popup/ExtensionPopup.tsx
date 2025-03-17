import React from 'react';
import { 
  Bot, 
  Zap, 
  Globe, 
  Shield, 
  Cpu 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import './popup.css';

// AI Tool Configuration
const AI_TOOLS = [
  {
    name: 'ChatGPT',
    icon: <Bot className="h-5 w-5 text-green-500" />,
    url: 'https://chat.openai.com/',
    description: 'OpenAI\'s conversational AI'
  },
  {
    name: 'Claude',
    icon: <Shield className="h-5 w-5 text-blue-500" />,
    url: 'https://claude.ai/',
    description: 'Anthropic\'s AI assistant'
  },
  {
    name: 'Gemini',
    icon: <Zap className="h-5 w-5 text-purple-500" />,
    url: 'https://gemini.google.com/',
    description: 'Google\'s generative AI'
  },
  {
    name: 'Mistral',
    icon: <Cpu className="h-5 w-5 text-red-500" />,
    url: 'https://chat.mistral.ai/',
    description: 'Mistral AI\'s conversational model'
  },
  {
    name: 'Perplexity',
    icon: <Globe className="h-5 w-5 text-indigo-500" />,
    url: 'https://www.perplexity.ai/',
    description: 'AI-powered search and chat'
  }
];

const ExtensionPopup: React.FC = () => {
  const openTool = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <div className="w-80 bg-background">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-yellow-500 text-center">
            {chrome.i18n.getMessage('aiToolLauncher')}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 space-y-2">
          {AI_TOOLS.map((tool) => (
            <Button 
              key={tool.name}
              variant="outline"
              className="w-full justify-start space-x-3"
              onClick={() => openTool(tool.url)}
            >
              {tool.icon}
              <span className="flex-grow text-left">{tool.name}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtensionPopup;