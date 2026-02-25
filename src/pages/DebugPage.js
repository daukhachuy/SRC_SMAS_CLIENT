import React, { useState, useEffect } from 'react';
import { apiHealthCheck } from '../api/healthCheck';
import instance, { API_BASE_URL } from '../api/axiosInstance';
import '../styles/DebugPage.css';

/**
 * Debug Page - Test API Connection & Login
 * Access: /debug
 * Chỉ dùng trong development
 */
const DebugPage = () => {
  const [activeTab, setActiveTab] = useState('connection');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (level, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, level, message, data }]);
    console.log(`[${level}] ${message}`, data);
  };

  // Test 1: Backend Connection
  const testConnection = async () => {
    setLoading(true);
    addLog('info', 'Testing backend connection...', { url: API_BASE_URL });
    try {
      const response = await instance.get('/');
      setResults(prev => ({ ...prev, connection: {
        status: '✅ Connected',
        statusCode: response.status,
        time: new Date().toLocaleTimeString()
      }}));
      addLog('success', 'Backend is reachable!', { status: response.status });
    } catch (error) {
      setResults(prev => ({ ...prev, connection: {
        status: '❌ Failed',
        error: error.message,
        time: new Date().toLocaleTimeString()
      }}));
      addLog('error', 'Cannot reach backend', { 
        error: error.message,
        url: API_BASE_URL 
      });
    }
    setLoading(false);
  };

  // Test 2: Login Endpoint
  const testLogin = async () => {
    if (!email || !password) {
      addLog('warn', 'Email and password required');
      return;
    }

    setLoading(true);
    addLog('info', 'Testing login endpoint...', { email });
    
    try {
      const response = await instance.post('/auth/login', {
        email: email.trim(),
        password
      });

      setResults(prev => ({ ...prev, login: {
        status: '✅ Login Success',
        statusCode: response.status,
        user: response.data?.user,
        hasToken: !!response.data?.token,
        time: new Date().toLocaleTimeString()
      }}));

      // Save to localStorage like normal login
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user || { email }));
        addLog('success', 'Token saved to localStorage!', { 
          token: response.data.token.substring(0, 20) + '...'
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      const statusCode = error.response?.status;

      setResults(prev => ({ ...prev, login: {
        status: '❌ Login Failed',
        statusCode,
        message: errorMsg,
        time: new Date().toLocaleTimeString()
      }}));

      addLog('error', 'Login failed', { 
        status: statusCode,
        message: errorMsg
      });
    }
    setLoading(false);
  };

  // Test 3: Check Current Auth Status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    setResults(prev => ({ ...prev, auth: {
      hasToken: !!token,
      hasUser: !!user,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'None',
      user: user ? JSON.parse(user) : null
    }}));

    addLog('info', 'Auth status checked', { hasToken: !!token, hasUser: !!user });
  };

  // Test 4: Clear Auth
  const clearAuth = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    addLog('info', 'Auth cleared from localStorage');
    checkAuthStatus();
  };

  // Test 5: Make Test API Call with Token
  const testApiCall = async () => {
    setLoading(true);
    addLog('info', 'Testing API call with auth token...');

    try {
      const response = await instance.get('/User/profile');
      setResults(prev => ({ ...prev, apiCall: {
        status: '✅ API Call Success',
        statusCode: response.status,
        data: response.data,
        time: new Date().toLocaleTimeString()
      }}));
      addLog('success', 'API call successful', response.data);
    } catch (error) {
      setResults(prev => ({ ...prev, apiCall: {
        status: '❌ API Call Failed',
        statusCode: error.response?.status,
        message: error.response?.data?.message || error.message,
        time: new Date().toLocaleTimeString()
      }}));
      addLog('error', 'API call failed', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    addLog('info', 'Debug Page Loaded', { apiBaseUrl: API_BASE_URL });
  }, []);

  return (
    <div className="debug-container">
      <h1>🔧 API Debug Panel</h1>
      <p className="debug-subtitle">Backend URL: <code>{API_BASE_URL}</code></p>

      {/* Tabs */}
      <div className="debug-tabs">
        <button 
          className={`tab-btn ${activeTab === 'connection' ? 'active' : ''}`}
          onClick={() => setActiveTab('connection')}
        >
          🔌 Connection
        </button>
        <button 
          className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          🔐 Login Test
        </button>
        <button 
          className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          🔑 Auth Status
        </button>
        <button 
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Logs
        </button>
      </div>

      {/* Content */}
      <div className="debug-content">
        {/* Tab 1: Connection */}
        {activeTab === 'connection' && (
          <div className="debug-panel">
            <h2>Test Backend Connection</h2>
            <button onClick={testConnection} disabled={loading} className="debug-btn">
              {loading ? '⏳ Testing...' : '🔍 Test Connection'}
            </button>
            
            {results.connection && (
              <div className="debug-result">
                <pre>{JSON.stringify(results.connection, null, 2)}</pre>
              </div>
            )}

            <div className="debug-info">
              <h3>What to check:</h3>
              <ul>
                <li>✅ Status Code 200-299 (or any response) = Backend is reachable</li>
                <li>❌ "Failed" or timeout = Backend is offline or wrong URL</li>
                <li>🔗 Make sure API_BASE_URL is correct in .env.local</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Login Test */}
        {activeTab === 'login' && (
          <div className="debug-panel">
            <h2>Test Login Endpoint</h2>
            
            <div className="debug-form">
              <input
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="debug-input"
              />
              <input
                type="password"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="debug-input"
              />
              <button onClick={testLogin} disabled={loading} className="debug-btn">
                {loading ? '⏳ Logging in...' : '🔐 Test Login'}
              </button>
            </div>

            {results.login && (
              <div className="debug-result">
                <pre>{JSON.stringify(results.login, null, 2)}</pre>
              </div>
            )}

            <div className="debug-info">
              <h3>Expected Results:</h3>
              <ul>
                <li>✅ Status 200 + Token = Credentials are correct</li>
                <li>❌ Status 401 = Wrong email/password</li>
                <li>❌ Status 400 = Bad request (check email format)</li>
                <li>✅ Token will be auto-saved to localStorage</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Auth Status */}
        {activeTab === 'auth' && (
          <div className="debug-panel">
            <h2>Authentication Status</h2>
            
            <div className="debug-buttons">
              <button onClick={checkAuthStatus} className="debug-btn">
                🔍 Check Auth Status
              </button>
              <button onClick={testApiCall} disabled={loading} className="debug-btn">
                {loading ? '⏳ Testing...' : '📡 Test API Call (with token)'}
              </button>
              <button onClick={clearAuth} className="debug-btn danger">
                🗑️ Clear Auth
              </button>
            </div>

            {results.auth && (
              <div className="debug-result">
                <h3>Token Status:</h3>
                <p><strong>Has Token:</strong> {results.auth.hasToken ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Has User:</strong> {results.auth.hasUser ? '✅ Yes' : '❌ No'}</p>
                {results.auth.tokenPreview && <p><strong>Token:</strong> {results.auth.tokenPreview}</p>}
                {results.auth.user && (
                  <>
                    <h3>User Info:</h3>
                    <pre>{JSON.stringify(results.auth.user, null, 2)}</pre>
                  </>
                )}
              </div>
            )}

            {results.apiCall && (
              <div className="debug-result">
                <h3>API Call Result:</h3>
                <pre>{JSON.stringify(results.apiCall, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Logs */}
        {activeTab === 'logs' && (
          <div className="debug-panel">
            <h2>Debug Logs</h2>
            <button onClick={() => setLogs([])} className="debug-btn danger">
              🗑️ Clear Logs
            </button>
            
            <div className="debug-logs">
              {logs.length === 0 ? (
                <p className="log-empty">No logs yet. Perform a test above.</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={`log-entry log-${log.level}`}>
                    <span className="log-time">{log.timestamp}</span>
                    <span className="log-level">[{log.level.toUpperCase()}]</span>
                    <span className="log-message">{log.message}</span>
                    {log.data && (
                      <details className="log-data">
                        <summary>Details</summary>
                        <pre>{JSON.stringify(log.data, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="debug-footer">
        <p>💡 Tip: Open browser DevTools (F12) to see detailed network requests and errors</p>
      </div>
    </div>
  );
};

export default DebugPage;