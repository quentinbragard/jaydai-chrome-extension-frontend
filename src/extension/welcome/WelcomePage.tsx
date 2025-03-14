import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import AuthModal from '@/components/AuthModal';
import { 
  Zap, 
  BookOpen, 
  TrendingUp, 
  Lightbulb, 
  Activity, 
  Target 
} from 'lucide-react';
import "./welcome.css";

const WelcomePage: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleGetStarted = () => {
    setIsAuthOpen(true);
  };

  const FeatureCard: React.FC<{ 
    icon: React.ReactNode, 
    title: string, 
    description: string 
  }> = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group">
      <div className="flex items-center mb-4">
        <div className="bg-primary/10 p-3 rounded-full mr-4 group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-2xl border-none">
        <CardHeader className="text-center pb-0">
          <CardTitle className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Welcome to Archimind
          </CardTitle>
          <CardDescription className="text-2xl text-gray-600 mt-2">
            Your Intelligent AI Usage Companion
          </CardDescription>
        </CardHeader>
        
        <Separator className="my-6 bg-gray-200" />
        
        <CardContent className="space-y-8">
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Zap className="h-6 w-6 text-primary" />}
              title="Energy Insights"
              description="Track and optimize your AI usage with real-time energy consumption metrics."
            />
            <FeatureCard 
              icon={<BookOpen className="h-6 w-6 text-primary" />}
              title="Smart Templates"
              description="Access a library of curated prompt templates to enhance your AI interactions."
            />
            <FeatureCard 
              icon={<TrendingUp className="h-6 w-6 text-primary" />}
              title="Skill Development"
              description="Receive personalized recommendations to upskill and maintain human expertise."
            />
          </div>

          {/* How It Works Section */}
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8 space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
              How Archimind Empowers You
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Lightbulb className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI Usage Tracking</h3>
                <p className="text-gray-600">
                  Monitor your AI interactions, understand patterns, and gain insights into your digital workflow.
                </p>
              </div>
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Personalized Insights</h3>
                <p className="text-gray-600">
                  Receive actionable recommendations to improve your AI usage and maintain your skills.
                </p>
              </div>
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Continuous Learning</h3>
                <p className="text-gray-600">
                  Develop a balanced approach to AI assistance with weekly reports and skill development tips.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-800">
              Ready to Unlock Your AI Potential?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Archimind helps you harness the power of AI while maintaining your unique human expertise.
            </p>
            
            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleGetStarted} 
                  className="mx-auto px-10 py-3 text-lg"
                  size="lg"
                >
                  Get Started
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogDescription>
                  Sign in to Archimind to get started
                </DialogDescription>
                <DialogHeader>
                  <DialogTitle>Sign In to Archimind</DialogTitle>
                </DialogHeader>
                <AuthModal onClose={() => setIsAuthOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      
      <Toaster richColors />
    </div>
  );
};

export default WelcomePage;