import React from 'react';
import AppRoutes from './routes';
import ApiDiagnostics from './components/ApiDiagnostics';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ApiDiagnostics />
    </AuthProvider>
  );
}

export default App;