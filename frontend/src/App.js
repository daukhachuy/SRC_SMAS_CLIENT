import React, { useEffect } from 'react';
import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';
import { AppToastProvider } from './context/AppToastContext';
import NotificationSignalRBridge from './components/NotificationSignalRBridge';
import { attachGlobalUiClickSound } from './utils/uiClickSound';

function App() {
  useEffect(() => attachGlobalUiClickSound(), []);

  return (
    <AuthProvider>
      <NotificationSignalRBridge />
      <AppToastProvider>
        <AppRoutes />
      </AppToastProvider>
    </AuthProvider>
  );
}




export default App;