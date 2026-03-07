import React from 'react';
import AppRoutes from './routes';
import AIChatBot from './components/AIChatBot';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <AIChatBot />
    </AuthProvider>
  );
}

export default App;