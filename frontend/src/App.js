import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Menu from './pages/Menu';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Trang Home sẽ hiện đầu tiên khi vào địa chỉ "/" */}
        <Route path="/" element={<Home />} />
        
        {/* Menu page */}
        <Route path="/menu" element={<Menu />} />
        
        {/* About page */}
        <Route path="/about" element={<AboutPage />} />
        
        {/* Các trang khác */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ForgotPasswordPage />} />
      </Routes>
    </Router>
  );
}

export default App;