import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        {/* Đặt trang Home vào đường dẫn mặc định "/" */}<Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;