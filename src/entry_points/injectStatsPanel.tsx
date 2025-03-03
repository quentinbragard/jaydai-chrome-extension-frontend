import React from 'react';
import { createRoot } from 'react-dom/client';
import { StatsPanel } from '@/components/StatsPanel';

/**
 * Injects the stats panel into the DOM
 */
export function injectStatsPanel() {
  console.log('🔍 Injecting stats panel...');

  try {
    // Inject CSS dynamically
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = chrome.runtime.getURL('assets/globals.css'); // Ensure this matches your Vite output
    document.head.appendChild(style);

    // Create an isolated container
    const container = document.createElement('div');
    container.id = 'archimind-stats-panel-container';
    document.body.appendChild(container);

    // Simple approach without shadow DOM
    const root = createRoot(container);
    root.render(React.createElement(StatsPanel));

    console.log('✅ Stats panel injected successfully');
  } catch (error) {
    console.error('Failed to inject stats panel:', error);
  }
}
