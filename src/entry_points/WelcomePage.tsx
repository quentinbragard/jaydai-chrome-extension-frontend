import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import AuthModal from '@/components/auth/AuthModal';
import "@/styles/globals.css";

const WelcomePage: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleGetStarted = () => {
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-none">
        <CardHeader className="text-center pb-0">
          <CardTitle className="text-4xl font-bold text-gray-800">
            Welcome to Archimind
          </CardTitle>
          <CardDescription className="text-xl text-gray-600 mt-2">
            Your AI Conversation Companion
          </CardDescription>
        </CardHeader>
        
        <Separator className="my-6 bg-gray-200" />
        
        <CardContent className="grid md:grid-cols-2 gap-8">
          {/* Left Side: Features */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Key Features
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="mr-3 text-green-500">✓</span>
                  ChatGPT Message Interception
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-green-500">✓</span>
                  Supabase Integration
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-green-500">✓</span>
                  Seamless Data Saving
                </li>
              </ul>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About Archimind</DialogTitle>
                </DialogHeader>
                <p className="text-gray-600">
                  Archimind helps you capture and organize your ChatGPT conversations 
                  effortlessly, ensuring no valuable insight is lost.
                </p>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Right Side: Call to Action */}
          <div className="flex flex-col justify-center space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 text-center">
              Ready to Get Started?
            </h2>
            <p className="text-center text-gray-600 mb-4">
              Unlock the power of conversation tracking
            </p>
            
            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleGetStarted} 
                  className="w-full py-3 text-lg"
                >
                  Start Your Journey
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sign In to Archimind</DialogTitle>
                </DialogHeader>
                <AuthModal onClose={() => setIsAuthOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      
      {/* Toaster for notifications */}
      <Toaster richColors />
    </div>
  );
};

export default WelcomePage;