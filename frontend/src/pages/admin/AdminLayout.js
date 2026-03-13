import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminMenu from '../../components/AdminMenu';
import '../../styles/AdminLayout.css';

const AdminLayout = () => {
  return (
    <div className="admin-shell">
      <AdminMenu />
      <main className="admin-main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
