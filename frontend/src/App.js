import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Pages
import Home, { COMBOS_DATA, BEST_SELLERS_DATA } from './pages/Home';
import Services from './pages/Services';
import MenuPage from './pages/MenuPage';
import ComboPage from './pages/ComboPage';
import BuffetPage from './pages/BuffetPage';
import AuthPage from './pages/AuthPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Trang chủ */}
        <Route path="/" element={<Home />} />

        {/* Trang Dịch vụ (Đã thêm lại) */}
        <Route path="/services" element={<Services />} />

        {/* Các trang chức năng khác từ bản cũ của bạn */}
        <Route 
          path="/menu" 
          element={<MenuPage menuItems={BEST_SELLERS_DATA} />} 
        />
        <Route 
          path="/combo" 
          element={<ComboPage combos={COMBOS_DATA} />} 
        />
        <Route path="/buffet" element={<BuffetPage />} />
        
        {/* Hệ thống xác thực */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Bẫy lỗi 404: Nếu gõ sai đường dẫn sẽ tự về Home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;