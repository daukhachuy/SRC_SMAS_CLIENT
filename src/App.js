import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
<<<<<<< HEAD
import Home from './pages/Home';
=======
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
>>>>>>> aec556be98da9be58319287e3caa572a976e4406

function App() {
  return (
    <Router>
      <Routes>
        {/* Đặt trang Home vào đường dẫn mặc định "/" */}<Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
<<<<<<< HEAD
        <Route path="/register" element={<AuthPage />} />
=======
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ForgotPasswordPage />} />
>>>>>>> aec556be98da9be58319287e3caa572a976e4406
      </Routes>
    </Router>
  );
}

export default App;