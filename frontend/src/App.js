import React from 'react';
import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';
import { AppToastProvider } from './context/AppToastContext';

function App() {
  return (
    <AuthProvider>
      <AppToastProvider>
        <AppRoutes />
      </AppToastProvider>
    </AuthProvider>
  );
}




export default App;