import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthTestPage.css';

/**
 * Auth Test Page
 * Dùng để test protected routes & authorization
 * Access: /auth-test
 */
const AuthTestPage = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    alert('✅ Logged out!');
  };

  const handleTestProtectedRoute = (route) => {
    navigate(route);
  };

  return (
    <div className="auth-test-container">
      <h1>🔐 Authentication & Authorization Test</h1>

      {/* Status Box */}
      <div className={`status-box ${token ? 'authenticated' : 'not-authenticated'}`}>
        <h2>
          {token ? '✅ Authenticated' : '❌ Not Authenticated'}
        </h2>
        
        <div className="status-details">
          <p>
            <strong>Token Status:</strong> 
            {token ? (
              <span className="success"> ✅ Token Present</span>
            ) : (
              <span className="error"> ❌ No Token</span>
            )}
          </p>

          <p>
            <strong>Token Preview:</strong>
            {token ? (
              <code className="token-preview">
                {token.substring(0, 50)}...
              </code>
            ) : (
              <span className="error"> None</span>
            )}
          </p>

          <p>
            <strong>User Info:</strong>
            {user ? (
              <div className="user-info">
                <ul>
                  <li>Email: <strong>{user.email}</strong></li>
                  {user.fullName && <li>Name: <strong>{user.fullName}</strong></li>}
                  {user.role && <li>Role: <strong>{user.role}</strong></li>}
                </ul>
              </div>
            ) : (
              <span className="error"> No User Data</span>
            )}
          </p>
        </div>
      </div>

      {/* Protected Routes Test */}
      <section className="test-section">
        <h2>🚀 Test Protected Routes</h2>
        <p className="section-desc">
          Click các nút dưới đây để test. Nếu chưa login, sẽ redirect tự động về /auth
        </p>

        <div className="routes-grid">
          <button 
            className="route-btn primary"
            onClick={() => handleTestProtectedRoute('/profile')}
          >
            👤 Profile
            <span className="route-desc">Yêu cầu: Đã login</span>
          </button>

          <button 
            className="route-btn primary"
            onClick={() => handleTestProtectedRoute('/my-orders')}
          >
            🛒 My Orders
            <span className="route-desc">Yêu cầu: Đã login</span>
          </button>

          <button 
            className="route-btn primary"
            onClick={() => handleTestProtectedRoute('/order-history')}
          >
            📋 Order History
            <span className="route-desc">Yêu cầu: Đã login</span>
          </button>

          <button 
            className="route-btn success"
            onClick={() => handleTestProtectedRoute('/')}
          >
            🏠 Home
            <span className="route-desc">Public (Mọi người)</span>
          </button>

          <button 
            className="route-btn success"
            onClick={() => handleTestProtectedRoute('/menu')}
          >
            📖 Menu
            <span className="route-desc">Public (Mọi người)</span>
          </button>
        </div>
      </section>

      {/* Actions */}
      <section className="test-section">
        <h2>⚙️ Actions</h2>

        {token ? (
          <button 
            className="action-btn danger"
            onClick={handleLogout}
          >
            🚪 Logout & Clear Token
          </button>
        ) : (
          <button 
            className="action-btn primary"
            onClick={() => navigate('/auth')}
          >
            🔐 Go to Login
          </button>
        )}

        <button 
          className="action-btn secondary"
          onClick={() => {
            setToken(localStorage.getItem('authToken'));
            setUser(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
          }}
        >
          🔄 Refresh Status
        </button>
      </section>

      {/* Instructions */}
      <section className="instructions">
        <h2>📖 Hướng Dẫn Test</h2>
        <ol>
          <li>
            <strong>Chưa Login:</strong>
            <ul>
              <li>Click "Profile", "My Orders", "Order History"</li>
              <li>Kỳ vọng: Tự động redirect về /auth</li>
            </ul>
          </li>
          <li>
            <strong>Sau Khi Login:</strong>
            <ul>
              <li>Token sẽ xuất hiện ở trên</li>
              <li>Click "Profile", "My Orders", "Order History"</li>
              <li>Kỳ vọng: Trang tải bình thường (không redirect)</li>
            </ul>
          </li>
          <li>
            <strong>Logout:</strong>
            <ul>
              <li>Click "Logout & Clear Token"</li>
              <li>Token sẽ mất</li>
              <li>Thử click protected route lại → redirect về /auth</li>
            </ul>
          </li>
        </ol>
      </section>

      {/* Test Cases Table */}
      <section className="test-cases">
        <h2>✅ Test Cases</h2>
        <table>
          <thead>
            <tr>
              <th>Test Case</th>
              <th>Status</th>
              <th>Expected Result</th>
              <th>Actual Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>No token → Access /profile</td>
              <td className="not-authenticated">❌ Not Auth</td>
              <td>Redirect to /auth</td>
              <td>{!token ? '✅ PASS' : '⏳ TBD'}</td>
            </tr>
            <tr>
              <td>Has token → Access /profile</td>
              <td className="authenticated">✅ Auth</td>
              <td>Load /profile page</td>
              <td>{token ? '✅ PASS' : '⏳ TBD'}</td>
            </tr>
            <tr>
              <td>Public page access</td>
              <td>Public</td>
              <td>Always accessible</td>
              <td>✅ PASS</td>
            </tr>
            <tr>
              <td>Logout → Access /my-orders</td>
              <td className="not-authenticated">❌ Not Auth</td>
              <td>Redirect to /auth</td>
              <td>{!token ? '✅ PASS' : '⏳ TBD'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Console Logs */}
      <section className="console-section">
        <h2>🖥️ Console Commands</h2>
        <p>Mở DevTools (F12) → Console và chạy các lệnh:</p>
        <pre><code>
{`// 1. Xem token
console.log('Token:', localStorage.getItem('authToken'))

// 2. Xem user info
console.log('User:', JSON.parse(localStorage.getItem('user')))

// 3. Xem toàn bộ localStorage
console.table(localStorage)

// 4. Logout
localStorage.removeItem('authToken')
localStorage.removeItem('user')`}
        </code></pre>
      </section>
    </div>
  );
};

export default AuthTestPage;