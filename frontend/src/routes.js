import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home, { COMBOS_DATA, BEST_SELLERS_DATA } from './pages/Home';
import ComboPage from './pages/ComboPage';
import MenuPage from './pages/MenuPage';
import BuffetPage from './pages/BuffetPage';
import AuthPage from './pages/AuthPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AboutPage from './pages/AboutPage';
import Services from './pages/Services';
import Profile from './pages/Profile'; 
import MyOrders from './pages/MyOrders'; 
import UserLayout from './components/UserLayout';
import OrderHistory from './pages/OrderHistory';
import Cart from './pages/Cart'; 

// 1. Import trang Promotion
import Promotion from './pages/Promotion'; 

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Các trang công khai */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MenuPage menuItems={BEST_SELLERS_DATA} />} />
        <Route path="/combo" element={<ComboPage combos={COMBOS_DATA} />} />
        <Route path="/buffet" element={<BuffetPage />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<AboutPage />} />
        
        {/* 2. Thêm Route cho trang Khuyến mãi */}
        <Route path="/promotion" element={<Promotion />} />

        <Route path="/auth" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        <Route path="/cart" element={<Cart />} />

        {/* Các trang yêu cầu UserLayout (thông tin cá nhân, đơn hàng) */}
        <Route element={<UserLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/order-history" element={<OrderHistory />} /> 
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;