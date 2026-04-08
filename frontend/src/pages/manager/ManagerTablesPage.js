import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import '../../styles/AdminTableMap.css';
import '../../styles/ManagerTablesPage.css';
import { getTables, isTableRowInUse } from '../../api/tableApi';

/**
 * ManagerTablesPage - Quản lý bàn trong nhà hàng
 * - Chỉ xem danh sách bàn
 * - Lọc theo trạng thái: trống, đang dùng, không hoạt động
 */
const ManagerTablesPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedTables = tables.map((table) => {
    const effectiveStatus = !table.isActive
      ? 'inactive'
      : (isTableRowInUse(table) ? 'occupied' : 'empty');

    return {
      ...table,
      effectiveStatus,
    };
  });

  const countAll = normalizedTables.length;
  const countEmpty = normalizedTables.filter((t) => t.effectiveStatus === 'empty').length;
  const countOccupied = normalizedTables.filter((t) => t.effectiveStatus === 'occupied').length;
  const countInactive = normalizedTables.filter((t) => t.effectiveStatus === 'inactive').length;

  // Lọc bàn theo status
  const filteredTables = normalizedTables.filter((table) => {
    const statusMatch =
      activeTab === 'all' ||
      (activeTab === 'empty' && table.effectiveStatus === 'empty') ||
      (activeTab === 'occupied' && table.effectiveStatus === 'occupied') ||
      (activeTab === 'inactive' && table.effectiveStatus === 'inactive');

    const searchMatch =
      searchQuery === '' ||
      String(table.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(table.tableCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(table.area || '').toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'empty':
        return { bg: '#dcfce7', text: '#0f7a45', label: 'Trống' };
      case 'occupied':
        return { bg: '#fee2e2', text: '#991b1b', label: 'Đang dùng' };
      case 'inactive':
        return { bg: '#f3f4f6', text: '#6b7280', label: 'Không hoạt động' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: 'Không xác định' };
    }
  };

  // Lấy danh sách bàn thật từ backend khi load trang
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const data = await getTables();
        setTables(data);
      } catch (err) {
        setError('Không thể tải danh sách bàn từ server.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1 className="page-title">
          <Users size={24} />
          Quản lý bàn
        </h1>
        <p className="page-subtitle">Quản lý và giám sát trạng thái các bàn trong nhà hàng</p>
      </div>

      {/* Filter & Search */}
      <div className="filter-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm bàn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả ({countAll})
          </button>
          <button
            className={`tab ${activeTab === 'empty' ? 'active' : ''}`}
            onClick={() => setActiveTab('empty')}
          >
            Trống ({countEmpty})
          </button>
          <button
            className={`tab ${activeTab === 'occupied' ? 'active' : ''}`}
            onClick={() => setActiveTab('occupied')}
          >
            Đang dùng ({countOccupied})
          </button>
          <button
            className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
            onClick={() => setActiveTab('inactive')}
          >
            Không hoạt động ({countInactive})
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="tables-grid">
        {loading ? (
          <div className="no-data">
            <p>Đang tải danh sách bàn...</p>
          </div>
        ) : error ? (
          <div className="no-data">
            <p>{error}</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="no-data">
            <p>Không tìm thấy bàn nào</p>
          </div>
        ) : (
          filteredTables.map((table) => {
            const statusColor = getStatusColor(table.effectiveStatus);
            const occupancyPercent = (table.currentGuests / table.capacity) * 100;

            return (
              <div
                key={table.id}
                className={`table-card ${!table.isActive ? 'disabled' : ''} ${
                  table.effectiveStatus === 'occupied' ? 'occupied' : ''
                }`}
              >
                {/* Header */}
                <div className="table-card-header">
                  <div className="table-info">
                    <h3>{table.name}</h3>
                    <p className="area">{table.area}</p>
                  </div>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: statusColor.bg,
                      color: statusColor.text,
                    }}
                  >
                    {statusColor.label}
                  </span>
                </div>

                {/* Body */}
                <div className="table-card-body">
                  <div className="capacity-info">
                    <span className="label">Sức chứa:</span>
                    <span className="value">{table.capacity} người</span>
                  </div>

                  {table.effectiveStatus === 'occupied' && (
                    <>
                      <div className="occupancy-info">
                        <span className="label">Khách hiện tại:</span>
                        <span className="value">{table.currentGuests} người</span>
                      </div>
                      <div className="occupancy-bar">
                        <div
                          className="occupancy-fill"
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ManagerTablesPage;
