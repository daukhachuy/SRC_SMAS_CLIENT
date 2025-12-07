import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MenuPage from './pages/MenuPage';
import BlogPage from './pages/BlogPage';
import DashboardPage from './pages/DashboardPage';
import ServicesPage from './pages/ServicesPage';
import AboutPage from './pages/AboutPage';  // Add this import

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />  {/* Add this route */}
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/category/:category" element={<BlogPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;