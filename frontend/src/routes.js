import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
import ProtectedRoute from './components/ProtectedRoute';
import DebugPage from './pages/DebugPage';
import AuthTestPage from './pages/AuthTestPage';
import ManagerLayout from './pages/manager/ManagerLayout';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import ManagerOrdersPage from './pages/manager/ManagerOrdersPage';
import DineInOrderDetailPage from './pages/manager/DineInOrderDetailPage';
import TakeawayOrderDetailPage from './pages/manager/TakeawayOrderDetailPage';
import ManagerReservationsPage from './pages/manager/ManagerReservationsPage';
import EventDetailPage from './pages/manager/EventDetailPage';
import ContractSigningPage from './pages/manager/ContractSigningPage';
import ManagerStaffPage from './pages/manager/ManagerStaffPage';
import ManagerInventoryPage from './pages/manager/ManagerInventoryPage';
import ManagerSalaryPage from './pages/manager/ManagerSalaryPage';
import DineInOrdersPage from './pages/DineInOrdersPage';
import TakeawayOrdersPage from './pages/manager/TakeawayOrdersPage';
import PaymentResult from './pages/PaymentResult';
import WaiterLayout from './pages/waiter/WaiterLayout';
import WaiterOrdersPage from './pages/waiter/WaiterOrdersPage';
import WaiterSchedulePage from './pages/waiter/WaiterSchedulePage';
import WaiterProfilePage from './pages/waiter/WaiterProfilePage';

import KitchenLayout from './pages/kitchen/KitchenLayout';
import KitchenOrdersPage from './pages/kitchen/KitchenOrdersPage';
import KitchenSchedulePage from './pages/kitchen/KitchenSchedulePage';
import KitchenProfilePage from './pages/kitchen/KitchenProfilePage';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';

// Import trang Promotion
import Promotion from './pages/Promotion';

// Google OAuth Client ID - detect hostname để chọn đúng Client ID
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const DEFAULT_GOOGLE_CLIENT_ID_LOCAL = '282641166696-q8qrpm9gptdena5n6607joje92475of6.apps.googleusercontent.com';
const DEFAULT_GOOGLE_CLIENT_ID_PROD = '282641166696-q8qrpm9gptdena5n6607joje92475of6.apps.googleusercontent.com';

const normalizeClientId = (value) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (trimmed.includes('YOUR_') || trimmed.includes('_HERE')) return '';
  return trimmed;
};

const localClientId = normalizeClientId(process.env.REACT_APP_GOOGLE_CLIENT_ID_LOCAL);
const prodClientId = normalizeClientId(process.env.REACT_APP_GOOGLE_CLIENT_ID_PROD);
const GOOGLE_CLIENT_ID = isLocalhost
  ? (localClientId || DEFAULT_GOOGLE_CLIENT_ID_LOCAL)
  : (prodClientId || DEFAULT_GOOGLE_CLIENT_ID_PROD);

const AppRoutes = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/auth-test" element={<AuthTestPage />} />
        <Route path="/cart" element={<Cart />} />

        {/* Admin pages - Không có authorization */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
        </Route>
        <Route path="/payment-result" element={<PaymentResult />} />
        {/* Manager pages - BẢO VỆ BỞI ProtectedRoute với role Manager */}
        <Route path="/manager" element={
          <ProtectedRoute requiredRole="Manager">
            <ManagerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="orders" element={<ManagerOrdersPage />} />
          <Route path="orders/dine-in/:id" element={<DineInOrderDetailPage />} />
          <Route path="orders/takeaway/:id" element={<TakeawayOrderDetailPage />} />
          <Route path="dine-in" element={<DineInOrdersPage />} />
          <Route path="takeaway" element={<TakeawayOrdersPage />} />
          <Route path="reservations" element={<ManagerReservationsPage />} />
          <Route path="reservations/:eventId" element={<EventDetailPage />} />
          <Route path="reservations/:eventId/contract" element={<ContractSigningPage />} />
          <Route path="staff" element={<ManagerStaffPage />} />
          <Route path="inventory" element={<ManagerInventoryPage />} />
          <Route path="salary" element={<ManagerSalaryPage />} />
        </Route>

          {/* Waiter pages - BẢO VỆ BỞI ProtectedRoute với role Waiter */}
          <Route path="/waiter" element={
            <ProtectedRoute requiredRole="Waiter">
              <WaiterLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<WaiterOrdersPage />} />
              <Route path="schedule" element={<WaiterSchedulePage />} />
              <Route path="profile" element={<WaiterProfilePage />} />
          </Route>

          {/* Kitchen pages - BẢO VỆ BỞI ProtectedRoute với role Kitchen */}
          <Route path="/kitchen" element={
            <ProtectedRoute requiredRole="Kitchen">
              <KitchenLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<KitchenOrdersPage />} />
            <Route path="schedule" element={<KitchenSchedulePage />} />
            <Route path="profile" element={<KitchenProfilePage />} />
          </Route>

        {/* Các trang yêu cầu đăng nhập - Bảo vệ bằng ProtectedRoute */}
        <Route element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }>
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/order-history" element={<OrderHistory />} /> 
        </Route>
      </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default AppRoutes;