import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './styles/base.css';
import './styles/common.css';
import { LanguageProvider } from './contexts/LanguageContext';
import App from './App'; // Ensure the path is correct

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);