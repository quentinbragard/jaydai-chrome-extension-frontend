import React from 'react';
import ReactDOM from 'react-dom/client';
import ExtensionPopup from './ExtensionPopup';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ExtensionPopup />
  </React.StrictMode>
);