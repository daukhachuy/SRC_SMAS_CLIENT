import React from 'react';
import AppRoutes from './routes';
import ApiDiagnostics from './components/ApiDiagnostics';

function App() {
  return (
    <>
      <AppRoutes />
      <ApiDiagnostics />
    </>
  );
}

export default App;