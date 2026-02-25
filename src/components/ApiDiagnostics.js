import React, { useState, useEffect } from 'react';
import { apiHealthCheck } from '../api/healthCheck';

/**
 * API Diagnostics Component
 * Shows backend connectivity status
 * Only visible in development mode
 */
const ApiDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isVisible, setIsVisible] = useState(process.env.NODE_ENV === 'development');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible && !diagnostics) {
      runDiagnostics();
    }
  }, [isVisible]);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const results = await apiHealthCheck.runFullDiagnostics();
    setDiagnostics(results);
    setIsLoading(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      maxWidth: 400,
      backgroundColor: '#1a1a1a',
      color: '#00ff00',
      border: '2px solid #00ff00',
      borderRadius: 8,
      padding: 12,
      fontFamily: 'monospace',
      fontSize: 11,
      maxHeight: 300,
      overflowY: 'auto',
      zIndex: 9999
    }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <strong>🔧 API Diagnostics</strong>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00ff00',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          ✕
        </button>
      </div>

      {isLoading ? (
        <div>⏳ Running diagnostics...</div>
      ) : diagnostics ? (
        <>
          <div>API: {diagnostics.apiBaseUrl}</div>
          <div>
            Connection: {
              diagnostics.tests.connection.status === 'online' 
                ? '✅ ONLINE' 
                : '❌ OFFLINE'
            }
          </div>
          <div>
            Login EP: {
              diagnostics.tests.loginEndpoint.code ? 
                `${diagnostics.tests.loginEndpoint.code}` : 
                'ERROR'
            }
          </div>
          <div>
            Public EP: {
              diagnostics.tests.publicEndpoint.code ? 
                `${diagnostics.tests.publicEndpoint.code}` : 
                'ERROR'
            }
          </div>
          <button
            onClick={runDiagnostics}
            style={{
              marginTop: 8,
              padding: '4px 8px',
              background: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 10
            }}
          >
            🔄 Retry
          </button>
        </>
      ) : null}
    </div>
  );
};

export default ApiDiagnostics;
