/**
 * API Health Check & Connection Test Utility
 * Use this for debugging API integration issues
 */

import instance, { API_BASE_URL } from './axiosInstance';

export const apiHealthCheck = {
  /**
   * Test backend connectivity
   */
  async testConnection() {
    console.log(`🔍 Testing backend connection to: ${API_BASE_URL}`);
    try {
      // Simple GET request to check if backend is reachable
      const response = await instance.get('/auth/login', {
        validateStatus: () => true // Accept any status code
      });
      console.log('✅ Backend is reachable');
      return { status: 'online', code: response.status };
    } catch (error) {
      console.error('❌ Backend is unreachable:', error.message);
      return { 
        status: 'offline', 
        error: error.message,
        hint: `Cannot reach ${API_BASE_URL}. Check if backend server is running.`
      };
    }
  },

  /**
   * Test login endpoint
   */
  async testLogin(email = 'test@example.com', password = 'test123') {
    console.log(`🔐 Testing login endpoint with ${email}...`);
    try {
      const response = await instance.post('/auth/login', { email, password });
      console.log('✅ Login endpoint responds:', response.status);
      return { status: 'ok', code: response.status, data: response.data };
    } catch (error) {
      console.log('⚠️ Login endpoint error (expected for invalid credentials):', error.response?.status);
      return { 
        status: 'error', 
        code: error.response?.status,
        message: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Test public endpoint (no auth required)
   */
  async testPublicEndpoint() {
    console.log('📍 Testing public endpoint (/public/info)...');
    try {
      const response = await instance.get('/public/info');
      console.log('✅ Public endpoint works:', response.status);
      return { status: 'ok', code: response.status, data: response.data };
    } catch (error) {
      console.log('❌ Public endpoint error:', error.response?.status || error.message);
      return { 
        status: 'error', 
        code: error.response?.status,
        message: error.message 
      };
    }
  },

  /**
   * Full diagnostic report
   */
  async runFullDiagnostics() {
    console.log('\n========== API HEALTH CHECK ==========\n');
    
    const results = {
      timestamp: new Date().toISOString(),
      apiBaseUrl: API_BASE_URL,
      tests: {}
    };

    // Test 1: Connection
    console.log('Test 1: Connection');
    results.tests.connection = await this.testConnection();
    console.log('');

    // Test 2: Login endpoint
    console.log('Test 2: Login Endpoint');
    results.tests.loginEndpoint = await this.testLogin();
    console.log('');

    // Test 3: Public endpoint
    console.log('Test 3: Public Endpoint');
    results.tests.publicEndpoint = await this.testPublicEndpoint();
    console.log('');

    console.log('========== SUMMARY ==========');
    console.log(JSON.stringify(results, null, 2));

    return results;
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.apiHealthCheck = apiHealthCheck;
}

export default apiHealthCheck;
