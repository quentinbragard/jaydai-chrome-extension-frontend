// src/extension/popup/popup.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import ExtensionPopup from './ExtensionPopup';
import { Toaster } from "@/components/ui/sonner";

// Load and apply theme preferences
const applyStoredThemePreference = () => {
  const root = window.document.documentElement;
  const storedTheme = localStorage.getItem("theme") || "system";
  
  if (storedTheme === "dark") {
    root.classList.add("dark");
  } else if (storedTheme === "light") {
    root.classList.add("light");
  } else {
    // System preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  }
};

// Apply theme immediately to prevent flash
applyStoredThemePreference();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ExtensionPopup />
    <Toaster richColors position="bottom-right" />
  </React.StrictMode>
);