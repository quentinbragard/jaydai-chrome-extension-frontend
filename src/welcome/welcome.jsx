import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from "@/components/ui/sonner";
import WelcomePage from '@/entry_points/WelcomePage';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WelcomePage />
    <Toaster richColors />
  </React.StrictMode>
);