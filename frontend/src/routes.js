import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home, { COMBOS_DATA, BEST_SELLERS_DATA } from './pages/Home';
import ComboPage from './pages/ComboPage';
import MenuPage from './pages/MenuPage';
import BuffetPage from './pages/BuffetPage';
import AuthPage from './pages/AuthPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
// 1. Thêm dòng import này
import Services from './pages/Services'; 

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* 2. THÊM DÒNG NÀY VÀO ĐÂY */}
        <Route path="/services" element={<Services />} /> 
        
        <Route path="/menu" element={<MenuPage menuItems={BEST_SELLERS_DATA} />} />
        <Route path="/combo" element={<ComboPage combos={COMBOS_DATA} />} />
        <Route path="/buffet" element={<BuffetPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;