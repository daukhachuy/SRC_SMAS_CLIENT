import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import AdminMenuCategory from './AdminMenuCategory';
import AdminMenuFood from './AdminMenuFood';
import AdminMenuCombo from './AdminMenuCombo';
import AdminMenuBuffet from './AdminMenuBuffet';
import '../../../styles/AdminMenuManagement.css';

const TABS = [
  { id: 'category', label: 'Danh mục', Component: AdminMenuCategory },
  { id: 'food', label: 'Món lẻ', Component: AdminMenuFood },
  { id: 'combo', label: 'Combo', Component: AdminMenuCombo },
  { id: 'buffet', label: 'Buffet', Component: AdminMenuBuffet }
];

const AdminMenuManagement = () => {
  const [activeTab, setActiveTab] = useState('category');

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component || AdminMenuCategory;

  return (
    <div className="admin-menu-management">
      <header className="menu-management-header">
        <h1 className="menu-management-title">Quản lý Thực đơn</h1>
        <div className="menu-management-header-actions">
          <button type="button" className="menu-icon-btn menu-btn-icon-only" aria-label="Thông báo">
            <Bell size={20} />
          </button>
        </div>
      </header>

      <div className="menu-management-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`menu-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="menu-management-content">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AdminMenuManagement;
