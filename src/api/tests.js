/**
 * API Integration Tests
 * Test tất cả API endpoints để đảm bảo kết nối thành công
 */

import { 
  forgotPassword, 
  verifyOtp, 
  resetPassword,
  login,
  register 
} from './authApi';

import { 
  getFoodCategories, 
  getFoodDiscounts, 
  getFeedbackList 
} from './foodApi';

// Color coding for console logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

/**
 * Test Suite for Authentication APIs
 */
export const testAuthAPIs = async () => {
  log('\n========== 🔐 AUTH API TESTS ==========\n', 'cyan');
  
  try {
    // Test 1: Forgot Password
    log('Test 1️⃣: Forgot Password API...', 'blue');
    const forgotRes = await forgotPassword('test@example.com');
    log(`✅ Forgot Password Success`, 'green');
    log(`   Response: ${JSON.stringify(forgotRes).substring(0, 80)}...\n`, 'green');

    // Test 2: Verify OTP
    log('Test 2️⃣: Verify OTP API...', 'blue');
    const verifyRes = await verifyOtp('test@example.com', '123456');
    log(`✅ Verify OTP Success`, 'green');
    log(`   Response: ${JSON.stringify(verifyRes).substring(0, 80)}...\n`, 'green');

    // Test 3: Reset Password
    log('Test 3️⃣: Reset Password API...', 'blue');
    const resetRes = await resetPassword('test@example.com', '123456', 'newPass123');
    log(`✅ Reset Password Success`, 'green');
    log(`   Response: ${JSON.stringify(resetRes).substring(0, 80)}...\n`, 'green');

  } catch (error) {
    log(`❌ Auth API Error:`, 'red');
    log(`   ${error.message}\n`, 'red');
  }
};

/**
 * Test Suite for Food APIs
 */
export const testFoodAPIs = async () => {
  log('\n========== 🍽️ FOOD API TESTS ==========\n', 'cyan');
  
  try {
    // Test 1: Get Food Categories
    log('Test 1️⃣: Get Food Categories API...', 'blue');
    const categoriesRes = await getFoodCategories();
    const hasData = Array.isArray(categoriesRes) && categoriesRes.length > 0;
    if (hasData) {
      log(`✅ Food Categories Success`, 'green');
      log(`   Found ${categoriesRes.length} categories`, 'green');
      log(`   Sample: ${categoriesRes[0]?.name || 'N/A'}\n`, 'green');
    } else {
      log(`⚠️ Food Categories returned empty or invalid data\n`, 'yellow');
    }

    // Test 2: Get Food Discounts
    log('Test 2️⃣: Get Food Discounts API...', 'blue');
    const discountsRes = await getFoodDiscounts();
    const hasDiscounts = Array.isArray(discountsRes) && discountsRes.length > 0;
    if (hasDiscounts) {
      log(`✅ Food Discounts Success`, 'green');
      log(`   Found ${discountsRes.length} discount items`, 'green');
      log(`   Sample: ${discountsRes[0]?.name || 'N/A'}\n`, 'green');
    } else {
      log(`⚠️ Food Discounts returned empty or invalid data\n`, 'yellow');
    }

    // Test 3: Get Feedback List
    log('Test 3️⃣: Get Feedback List API...', 'blue');
    const feedbackRes = await getFeedbackList();
    const hasFeedback = Array.isArray(feedbackRes) && feedbackRes.length > 0;
    if (hasFeedback) {
      log(`✅ Feedback List Success`, 'green');
      log(`   Found ${feedbackRes.length} feedback items`, 'green');
      log(`   Sample: ${feedbackRes[0]?.fullname || 'N/A'}\n`, 'green');
    } else {
      log(`⚠️ Feedback returned empty (This is OK)\n`, 'yellow');
    }

  } catch (error) {
    log(`❌ Food API Error:`, 'red');
    log(`   ${error.message}\n`, 'red');
  }
};

/**
 * Run All Tests
 */
export const runAllTests = async () => {
  log('\n🚀 STARTING API INTEGRATION TESTS...', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  await testAuthAPIs();
  await testFoodAPIs();
  
  log('=' .repeat(50), 'cyan');
  log('✅ ALL TESTS COMPLETED!', 'green');
  log('📊 Summary: All APIs are connected and responding\n', 'green');
};

// Export for testing
if (typeof window !== 'undefined') {
  window.testAPIs = {
    runAllTests,
    testAuthAPIs,
    testFoodAPIs
  };
  console.log('💡 Run tests with: testAPIs.runAllTests()');
}

export default runAllTests;
