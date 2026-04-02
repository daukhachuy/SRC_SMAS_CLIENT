import React, { useState, useEffect } from 'react';
import { Users, Pencil, Trash2, Search, Eye, EyeOff, X, Copy, QrCode } from 'lucide-react';
import '../../styles/AdminTableMap.css';
import '../../styles/ManagerTablesPage.css';
import { openTable } from '../../api/tableSessionApi';
import { extractUserFromToken } from '../../utils/jwtHelper';
import { getTables } from '../../api/tableApi';

/**
 * ManagerTablesPage - Quản lý bàn trong nhà hàng
 * - Xem danh sách bàn
 * - Xem trạng thái từng bàn (trống, đang dùng, v.v.)
 * - Kích hoạt/tắt bàn
 * - Mở/đóng bàn
 */
const ManagerTablesPage = () => {
  const [tables, setTables] = useState([
    { id: 1, name: 'Bàn 01', area: 'Tầng 1', capacity: 6, currentGuests: 0, status: 'empty', isActive: true },
    { id: 2, name: 'Bàn 02', area: 'Tầng 1', capacity: 4, currentGuests: 2, status: 'occupied', isActive: true },
    { id: 3, name: 'Bàn 03', area: 'Tầng 1', capacity: 10, currentGuests: 8, status: 'occupied', isActive: true },
    { id: 4, name: 'Bàn 04', area: 'Tầng 2', capacity: 2, currentGuests: 0, status: 'empty', isActive: true },
    { id: 5, name: 'Bàn 05', area: 'Tầng 1', capacity: 4, currentGuests: 0, status: 'empty', isActive: false },
    { id: 6, name: 'Bàn 06', area: 'Sân vườn', capacity: 4, currentGuests: 0, status: 'empty', isActive: true },
  ]);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTable, setEditingTable] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, table: null, link: '' });

  // Lọc bàn theo status
  const filteredTables = tables.filter((table) => {
    const statusMatch =
      activeTab === 'all' ||
      (activeTab === 'empty' && table.status === 'empty') ||
      (activeTab === 'occupied' && table.status === 'occupied') ||
      (activeTab === 'inactive' && !table.isActive);

    const searchMatch =
      searchQuery === '' ||
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.area.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  const getTableSessionLink = (table) => {
    const baseUrl = window.location?.origin || 'https://fptres.vn';
    return `${baseUrl}/table/${table.id}/session?ticket=demo-${table.id}-${Date.now()}`;
  };

  const getQrImageUrl = (value) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(value)}`;

  // Mở bàn và hiện QR để share cho khách (sử dụng API backend)
  const handleOpenTable = async (table) => {
    try {
      // Lấy userId từ token lưu trong localStorage
      const token = localStorage.getItem('authToken');
      const user = token ? extractUserFromToken(token) : null;
      if (!user || !user.userId) {
        alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }
      // Sử dụng đúng mã bàn (code hoặc tableCode)
      const tableCode = table.code || table.tableCode || table.id;
      const response = await openTable(tableCode, user.userId);
      if (!response.qrTicket) {
        alert('Không lấy được mã QR từ backend.');
        return;
      }
      const baseUrl = window.location?.origin || 'https://fptres.vn';
      const link = `${baseUrl}/table/${tableCode}/session?ticket=${response.qrTicket}`;
      setQrModal({ open: true, table, link });
    } catch (error) {
      alert(error?.message || 'Có lỗi khi mở bàn.');
    }
  };

  const handleCopyQrLink = async () => {
    if (!qrModal.link) return;

    try {
      await navigator.clipboard.writeText(qrModal.link);
      alert('✅ Đã copy link QR');
    } catch (error) {
      alert('❌ Không thể copy tự động. Vui lòng copy thủ công.');
    }
  };

  // Đóng bàn (gọi API thật, reload danh sách)
  const handleCloseTable = async (table) => {
    if (!window.confirm(`Bạn có chắc muốn đóng bàn ${table.name}?`)) return;
    try {
      // Lấy userId từ token lưu trong localStorage
      const token = localStorage.getItem('authToken');
      const user = token ? extractUserFromToken(token) : null;
      if (!user || !user.userId) {
        alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }
      // Sử dụng đúng mã bàn (code hoặc tableCode hoặc id)
      const tableCode = table.code || table.tableCode || table.id;
      // Gọi API đóng bàn
      await import('../../api/tableSessionApi').then(api => api.closeTable(tableCode, user.userId));
      alert(`✅ Đã đóng bàn ${table.name}`);
      // Reload lại danh sách bàn từ server
      const data = await getTables();
      setTables(data);
    } catch (error) {
      alert(error?.message || `❌ Đóng bàn thất bại!`);
    }
  };

  // Kích hoạt/tắt bàn
  const handleToggleActive = (table) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === table.id ? { ...t, isActive: !t.isActive } : t
      )
    );
  };

  // Chỉnh sửa bàn
  const handleEditTable = (table) => {
    setEditingTable(table);
    setShowModal(true);
  };

  // Xóa bàn
  const handleDeleteTable = (table) => {
    if (window.confirm(`Bạn có chắc muốn xóa bàn ${table.name}?`)) {
      setTables((prev) => prev.filter((t) => t.id !== table.id));
      alert(`✅ Đã xóa bàn ${table.name}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'empty':
        return { bg: '#dcfce7', text: '#0f7a45', label: 'Trống' };
      case 'occupied':
        return { bg: '#fee2e2', text: '#991b1b', label: 'Đang dùng' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: status };
    }
  };

  // Lấy danh sách bàn thật từ backend khi load trang
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTables();
        setTables(data);
      } catch (err) {
        alert('Không thể tải danh sách bàn từ server!');
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
            Tất cả ({tables.length})
          </button>
          <button
            className={`tab ${activeTab === 'empty' ? 'active' : ''}`}
            onClick={() => setActiveTab('empty')}
          >
            Trống ({tables.filter((t) => t.status === 'empty').length})
          </button>
          <button
            className={`tab ${activeTab === 'occupied' ? 'active' : ''}`}
            onClick={() => setActiveTab('occupied')}
          >
            Đang dùng ({tables.filter((t) => t.status === 'occupied').length})
          </button>
          <button
            className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
            onClick={() => setActiveTab('inactive')}
          >
            Không hoạt động ({tables.filter((t) => !t.isActive).length})
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="tables-grid">
        {filteredTables.length === 0 ? (
          <div className="no-data">
            <p>Không tìm thấy bàn nào</p>
          </div>
        ) : (
          filteredTables.map((table) => {
            const statusColor = getStatusColor(table.status);
            const occupancyPercent = (table.currentGuests / table.capacity) * 100;

            return (
              <div
                key={table.id}
                className={`table-card ${!table.isActive ? 'disabled' : ''} ${
                  table.status === 'occupied' ? 'occupied' : ''
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

                  {table.status === 'occupied' && (
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

                  <div className="active-toggle">
                    <span className="label">Kích hoạt:</span>
                    <button
                      className={`toggle-btn ${table.isActive ? 'active' : ''}`}
                      onClick={() => handleToggleActive(table)}
                      title={table.isActive ? 'Tắt bàn' : 'Bật bàn'}
                    >
                      {table.isActive ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="table-card-actions">
                  {table.status === 'empty' ? (
                    <button
                      className="action-btn open-btn"
                      onClick={() => handleOpenTable(table)}
                      disabled={!table.isActive}
                      title="Mở bàn để khách gọi món"
                    >
                      Mở bàn
                    </button>
                  ) : (
                    <button
                      className="action-btn close-btn"
                      onClick={() => handleCloseTable(table)}
                      title="Đóng bàn"
                    >
                      Đóng bàn
                    </button>
                  )}

                  <button
                    className="action-btn icon-btn"
                    onClick={() => handleEditTable(table)}
                    title="Chỉnh sửa"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="action-btn icon-btn danger"
                    onClick={() => handleDeleteTable(table)}
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats Footer */}
      <div className="stats-footer">
        <div className="stat">
          <span className="label">Tổng bàn:</span>
          <span className="value">{tables.length}</span>
        </div>
        <div className="stat">
          <span className="label">Đang dùng:</span>
          <span className="value">{tables.filter((t) => t.status === 'occupied').length}</span>
        </div>
        <div className="stat">
          <span className="label">Trống:</span>
          <span className="value">{tables.filter((t) => t.status === 'empty').length}</span>
        </div>
        <div className="stat">
          <span className="label">Tổng khách:</span>
          <span className="value">{tables.reduce((sum, t) => sum + t.currentGuests, 0)}</span>
        </div>
      </div>

      {qrModal.open && qrModal.table && (
        <div className="qr-modal-overlay" onClick={() => setQrModal({ open: false, table: null, link: '' })}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="qr-modal-close"
              onClick={() => setQrModal({ open: false, table: null, link: '' })}
              title="Đóng"
            >
              <X size={18} />
            </button>

            <div className="qr-modal-head">
              <div className="qr-modal-icon">
                <QrCode size={20} />
              </div>
              <div>
                <h3>QR mở bàn {qrModal.table.name}</h3>
                <p>Khách quét mã để vào phiên gọi món</p>
              </div>
            </div>

            <div className="qr-image-wrap">
              <img
                src={getQrImageUrl(qrModal.link)}
                alt={`QR ${qrModal.table.name}`}
                className="qr-image"
              />
            </div>

            <div className="qr-link-box">
              <input value={qrModal.link} readOnly />
              <button className="qr-copy-btn" onClick={handleCopyQrLink}>
                <Copy size={16} />
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTablesPage;
