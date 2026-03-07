import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Settings,
  Edit,
  Package,
  ArrowUpToLine,
  ArrowDownToLine,
  History,
  Menu,
  CircleAlert,
  X,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Beef,
  Fish,
  Check,
  RotateCcw
} from 'lucide-react';
import '../../styles/ManagerInventoryPage.css';

const materialsData = [
  {
    id: 'NL-001',
    name: 'Thịt bò Thăn',
    unit: 'kg',
    current: 42,
    max: 100,
    alert: 20,
    level: 'normal'
  },
  {
    id: 'NL-042',
    name: 'Cá hồi Nauy',
    unit: 'kg',
    current: 8,
    max: 50,
    alert: 10,
    level: 'danger'
  },
  {
    id: 'NL-105',
    name: 'Gạo ST25',
    unit: 'bao',
    current: 15,
    max: 20,
    alert: 5,
    level: 'normal'
  }
];

const batchesData = [
  {
    batchCode: '#BCH-2024-001',
    material: 'Thịt bò Thăn',
    stockText: 'Tồn: 15.5 kg',
    expiryDate: '15/10/2024',
    status: 'valid'
  },
  {
    batchCode: '#BCH-2024-042',
    material: 'Cá hồi Nauy',
    stockText: 'Tồn: 8.0 kg',
    expiryDate: '28/09/2024',
    status: 'expiring'
  },
  {
    batchCode: '#BCH-2024-105',
    material: 'Gạo ST25',
    stockText: 'Tồn: 15 bao',
    expiryDate: '20/12/2024',
    status: 'valid'
  }
];

const logsData = [
  {
    date: '20/10/2024',
    time: '10:45:12',
    type: 'import',
    material: 'Thịt bò Thăn',
    quantity: '+20.0',
    unit: 'kg',
    reason: 'Nhập hàng định kỳ tháng 10',
    operator: 'NV. Tuấn',
    avatar: 'T'
  },
  {
    date: '20/10/2024',
    time: '09:30:45',
    type: 'export',
    material: 'Cá hồi Nauy',
    quantity: '-2.5',
    unit: 'kg',
    reason: 'Xuất chế biến Buffet trưa',
    operator: 'NV. Lan',
    avatar: 'L'
  },
  {
    date: '19/10/2024',
    time: '18:15:00',
    type: 'import',
    material: 'Gạo ST25',
    quantity: '+5',
    unit: 'bao',
    reason: 'Hoàn kho cuối ngày (dư)',
    operator: 'QL. An',
    avatar: 'A'
  },
  {
    date: '19/10/2024',
    time: '14:20:10',
    type: 'export',
    material: 'Rượu Vang Đỏ',
    quantity: '-12',
    unit: 'chai',
    reason: 'Xuất cho tiệc cưới sảnh A',
    operator: 'NV. Tuấn',
    avatar: 'T'
  }
];

const menuManageData = {
  menu: [
    { name: 'Phở Bò Tái Lăn', price: '65.000đ', state: 'active' },
    { name: 'Sushi Cá Hồi', price: '120.000đ', state: 'sold-out' },
    { name: 'Bún Đậu Mắm Tôm', price: '55.000đ', state: 'active' },
    { name: 'Salad Ức Gà', price: '45.000đ', state: 'active' }
  ],
  combo: [
    { name: 'Combo Gia đình', price: '285.000đ', state: 'active' },
    { name: 'Combo Tiết kiệm', price: '115.000đ', state: 'active' },
    { name: 'Combo Bạn bè', price: '390.000đ', state: 'sold-out' }
  ],
  buffet: [
    { name: 'Buffet Lẩu 199k', price: '199.000đ', state: 'active' },
    { name: 'Buffet Nướng BBQ', price: '299.000đ', state: 'sold-out' },
    { name: 'Buffet Hải sản cao cấp', price: '499.000đ', state: 'active' },
    { name: 'Buffet Chay Thuần Việt', price: '159.000đ', state: 'active' }
  ]
};

const ManagerInventoryPage = () => {
  const [activeTab, setActiveTab] = useState('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuModalTab, setMenuModalTab] = useState('menu');
  const [exportQty, setExportQty] = useState('16');
  const [exportReason, setExportReason] = useState('');

  const isExportInvalid = Number(exportQty) > 15.5;

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return materialsData;
    return materialsData.filter((item) => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredBatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return batchesData;
    return batchesData.filter((item) => item.material.toLowerCase().includes(q) || item.batchCode.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return logsData;
    return logsData.filter((item) => item.material.toLowerCase().includes(q) || item.reason.toLowerCase().includes(q));
  }, [searchQuery]);

  const renderMaterialsTable = () => (
    <div className="inventory-table-wrap">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Nguyên liệu</th>
            <th className="text-center">Đơn vị</th>
            <th>Tồn kho hiện tại</th>
            <th className="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredMaterials.map((item) => {
            const pct = Math.round((item.current / item.max) * 100);
            return (
              <tr key={item.id} className={item.level === 'danger' ? 'row-danger' : ''}>
                <td>
                  <div className={`cell-title ${item.level === 'danger' ? 'text-danger' : ''}`}>{item.name}</div>
                  <div className="cell-subtitle">Mã: {item.id}</div>
                </td>
                <td className="text-center">{item.unit}</td>
                <td>
                  <div className="stock-line">
                    <span className={item.level === 'danger' ? 'danger-text' : ''}>
                      {item.current} / {item.max} {item.unit}
                    </span>
                    <span className={`stock-alert ${item.level === 'danger' ? 'danger-text' : ''}`}>
                      {item.level === 'danger' ? 'Dưới mức cảnh báo' : `Cảnh báo: ${item.alert}${item.unit}`}
                    </span>
                  </div>
                  <div className="stock-progress">
                    <span className={`stock-progress-fill ${item.level === 'danger' ? 'danger' : ''}`} style={{ width: `${pct}%` }} />
                  </div>
                </td>
                <td className="text-right">
                  <button className="icon-btn">
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderBatchesTable = () => (
    <div className="inventory-table-wrap">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Mã lô (BatchCode)</th>
            <th>Nguyên liệu</th>
            <th>Ngày hết hạn</th>
            <th>Trạng thái</th>
            <th className="text-right">Thao tác kho</th>
          </tr>
        </thead>
        <tbody>
          {filteredBatches.map((item) => (
            <tr key={item.batchCode}>
              <td className="mono">{item.batchCode}</td>
              <td>
                <div className="cell-title">{item.material}</div>
                <div className="cell-subtitle">{item.stockText}</div>
              </td>
              <td>{item.expiryDate}</td>
              <td>
                <span className={`status-badge ${item.status === 'valid' ? 'valid' : 'expiring'}`}>
                  {item.status === 'valid' ? 'Còn hạn' : 'Sắp hết hạn'}
                </span>
              </td>
              <td className="text-right">
                <div className="action-inline">
                  <button className="action-btn export" onClick={() => setShowExportModal(true)}>
                    <ArrowUpToLine size={14} />
                    Xuất chế biến
                  </button>
                  <button className="action-btn restore" onClick={() => setShowReturnModal(true)}>
                    <ArrowDownToLine size={14} />
                    Hoàn kho
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLogsTable = () => (
    <>
      <div className="inventory-table-wrap">
        <table className="inventory-table logs">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Loại</th>
              <th>Nguyên liệu</th>
              <th>Số lượng</th>
              <th>Đơn vị</th>
              <th>Lý do</th>
              <th>Người thực hiện</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, idx) => (
              <tr key={`${log.material}-${idx}`}>
                <td>
                  <div className="cell-title">{log.date}</div>
                  <div className="cell-subtitle">{log.time}</div>
                </td>
                <td>
                  <span className={`status-badge ${log.type === 'import' ? 'valid' : 'danger'}`}>
                    {log.type === 'import' ? 'Nhập kho' : 'Xuất kho'}
                  </span>
                </td>
                <td className="cell-title">{log.material}</td>
                <td className={log.type === 'import' ? 'qty-in' : 'qty-out'}>{log.quantity}</td>
                <td>{log.unit}</td>
                <td>{log.reason}</td>
                <td>
                  <div className="operator-cell">
                    <span className="avatar-mini">{log.avatar}</span>
                    {log.operator}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Hiển thị 4 trên 150 bản ghi</span>
        <div className="page-row">
          <button className="page-btn" disabled>Trước</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">Sau</button>
        </div>
      </div>
    </>
  );

  return (
    <div className="inventory-page">
      <header className="inventory-topbar">
        <div className="topbar-search">
          <Search size={18} />
          <input
            type="text"
            placeholder={activeTab === 'history' ? 'Tìm kiếm nhật ký, nguyên liệu...' : 'Tìm kiếm nguyên liệu, lô hàng...'}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="topbar-actions">
          <button className="icon-square"><Bell size={18} /></button>
          <button className="icon-square"><Settings size={18} /></button>
        </div>
      </header>

      <div className="inventory-content">
        <div className="inventory-headline">
          <div>
            <h1>{activeTab === 'history' ? 'Nhật ký Nhập/Xuất kho hàng' : 'Quản lý Kho hàng'}</h1>
            <p>
              {activeTab === 'history'
                ? 'Hệ thống quản lý nhà hàng - Xem lịch sử biến động kho hàng.'
                : 'Quản lý chi tiết nguyên liệu, lô hàng và lịch sử biến động.'}
            </p>
          </div>
          {activeTab === 'history' ? (
            <div className="history-actions">
              <button className="secondary-btn">
                <Filter size={16} />
                Lọc dữ liệu
              </button>
              <button className="primary-btn">
                <Download size={16} />
                Xuất báo cáo
              </button>
            </div>
          ) : (
            <button className="primary-btn">
              <Plus size={16} />
              Nhập kho mới
            </button>
          )}
        </div>

        <div className="inventory-grid">
          <section className="inventory-main-card">
            <div className="inventory-tabs">
              <button
                className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                onClick={() => setActiveTab('materials')}
              >
                Nguyên liệu
              </button>
              <button
                className={`tab-btn ${activeTab === 'batches' ? 'active' : ''}`}
                onClick={() => setActiveTab('batches')}
              >
                Lô hàng tồn kho
              </button>
              <button
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Lịch sử Nhập/Xuất
              </button>
            </div>

            {activeTab === 'batches' && (
              <div className="section-subhead">
                <h3>
                  <Package size={16} />
                  Quản lý chi tiết lô hàng (Batch Management)
                </h3>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="section-subhead">
                <h3>
                  <History size={16} />
                  Nhật ký biến động kho (Inventory Logs)
                </h3>
              </div>
            )}

            {activeTab === 'materials' && renderMaterialsTable()}
            {activeTab === 'batches' && renderBatchesTable()}
            {activeTab === 'history' && renderLogsTable()}
          </section>

          <aside className="inventory-side">
            <section className="side-card sticky">
              <div className="side-card-head">
                <h3>
                  <Menu size={18} />
                  Thực đơn hôm nay
                </h3>
                <button onClick={() => setShowMenuModal(true)}>Xem tất cả</button>
              </div>

              <div className="menu-mini-list">
                <div className="menu-mini-item">
                  <div className="menu-mini-icon"><Beef size={16} /></div>
                  <div>
                    <strong>Phở Bò Tái Lăn</strong>
                    <span>65,000đ • Sẵn sàng</span>
                  </div>
                </div>
                <div className="menu-mini-item sold-out">
                  <div className="menu-mini-icon"><Fish size={16} /></div>
                  <div>
                    <strong>Sushi Cá Hồi</strong>
                    <span>Hết nguyên liệu</span>
                  </div>
                </div>
              </div>

              <div className="mini-stats">
                <div>
                  <strong>24</strong>
                  <span>Phục vụ</span>
                </div>
                <div>
                  <strong>02</strong>
                  <span>Tạm ngưng</span>
                </div>
              </div>
            </section>

            <section className="side-card">
              <div className="side-card-head logs-headline">
                <h3>
                  <History size={16} />
                  Nhật ký Kho gần đây
                </h3>
              </div>

              <div className="recent-log-list">
                <div className="recent-log import">
                  <span className="dot" />
                  <div>
                    <strong>Nhập +20kg Thịt bò</strong>
                    <p>Lý do: Nhập hàng định kỳ</p>
                    <small>10:45 AM • NV. Tuấn</small>
                  </div>
                </div>

                <div className="recent-log export">
                  <span className="dot" />
                  <div>
                    <strong>Xuất -2kg Cá hồi</strong>
                    <p>Lý do: Chế biến món ăn</p>
                    <small>09:15 AM • NV. Lan</small>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showExportModal && (
        <div className="inv-modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="inv-modal" onClick={(event) => event.stopPropagation()}>
            <div className="inv-modal-head">
              <h3>
                <ArrowUpToLine size={18} />
                Xác nhận Xuất kho - Thịt bò Thăn
              </h3>
              <button onClick={() => setShowExportModal(false)}><X size={18} /></button>
            </div>

            <div className="inv-modal-body">
              <div className="batch-info-box">
                <div>
                  <span>Thông tin lô hàng</span>
                  <strong>#BCH-2024-001</strong>
                </div>
                <div className="right">
                  <span>Tồn kho hiện tại</span>
                  <strong>15.5 kg</strong>
                </div>
              </div>

              <label>Số lượng xuất (kg)</label>
              <input type="number" value={exportQty} onChange={(event) => setExportQty(event.target.value)} />
              {isExportInvalid && (
                <p className="error-text">
                  <CircleAlert size={14} />
                  Số lượng xuất vượt quá tồn kho hiện tại (15.5 kg).
                </p>
              )}

              <label>Ghi chú</label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Xuất cho ca sáng..."
                value={exportReason}
                onChange={(event) => setExportReason(event.target.value)}
              />
            </div>

            <div className="inv-modal-foot">
              <button className="ghost" onClick={() => setShowExportModal(false)}>Hủy</button>
              <button className="danger" disabled={isExportInvalid || !exportReason.trim()}>Xác nhận xuất</button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="inv-modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="inv-modal small" onClick={(event) => event.stopPropagation()}>
            <div className="inv-modal-head">
              <h3>
                <RotateCcw size={18} />
                Xác nhận Hoàn kho
              </h3>
              <button onClick={() => setShowReturnModal(false)}><X size={18} /></button>
            </div>

            <div className="inv-modal-body">
              <div className="batch-info-box neutral">
                <div>
                  <span>Thông tin lô hàng</span>
                  <strong>#BCH-2024-042</strong>
                </div>
                <div className="right">
                  <span>Tồn kho hiện tại</span>
                  <strong>8.0 kg</strong>
                </div>
              </div>

              <label>Số lượng hoàn trả (kg)</label>
              <input type="number" placeholder="0.0" />

              <label>Lý do hoàn kho</label>
              <select>
                <option>Dư thừa cuối ngày</option>
                <option>Đổi trả NCC</option>
                <option>Sai sót nhập liệu</option>
                <option>Lý do khác</option>
              </select>

              <div className="operator-info">
                <User size={14} />
                Người thực hiện: <strong>Nguyễn Văn An</strong>
              </div>
            </div>

            <div className="inv-modal-foot">
              <button className="ghost" onClick={() => setShowReturnModal(false)}>Đóng</button>
              <button className="primary" onClick={() => setShowReturnModal(false)}>Hoàn tất</button>
            </div>
          </div>
        </div>
      )}

      {showMenuModal && (
        <div className="inv-modal-overlay" onClick={() => setShowMenuModal(false)}>
          <div className="inv-modal menu-modal" onClick={(event) => event.stopPropagation()}>
            <div className="inv-modal-head">
              <div>
                <h3>Quản lý Thực đơn</h3>
                <p>Cập nhật danh sách món và trạng thái phục vụ</p>
              </div>
              <button onClick={() => setShowMenuModal(false)}><X size={18} /></button>
            </div>

            <div className="menu-modal-tabs">
              <button className={menuModalTab === 'menu' ? 'active' : ''} onClick={() => setMenuModalTab('menu')}>Món lẻ (Menu)</button>
              <button className={menuModalTab === 'combo' ? 'active' : ''} onClick={() => setMenuModalTab('combo')}>Combo</button>
              <button className={menuModalTab === 'buffet' ? 'active' : ''} onClick={() => setMenuModalTab('buffet')}>Buffet</button>
            </div>

            <div className="menu-modal-search">
              <div className="input-wrap">
                <Search size={16} />
                <input type="text" placeholder="Tìm tên món ăn..." />
              </div>
              <div className="filter-wrap">
                <span>Trạng thái:</span>
                <select>
                  <option>Tất cả</option>
                  <option>Đang bán</option>
                  <option>Hết hàng</option>
                </select>
              </div>
            </div>

            <div className="menu-modal-body">
              <div className="menu-grid">
                {(menuManageData[menuModalTab] || []).map((item) => (
                  <div key={item.name} className={`menu-card ${item.state === 'sold-out' ? 'sold-out' : ''}`}>
                    <div>
                      <h4>{item.name}</h4>
                      <p>{item.price}</p>
                    </div>
                    <div className="toggle-wrap">
                      <span className={item.state === 'sold-out' ? 'off' : 'on'}>
                        {item.state === 'sold-out' ? 'HẾT HÀNG' : 'ĐANG BÁN'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="menu-pagination">
                <p>Hiển thị 4 trên {menuModalTab === 'menu' ? '48' : menuModalTab === 'combo' ? '12' : '8'} mục</p>
                <div className="page-row">
                  <button className="page-icon" disabled><ChevronLeft size={14} /></button>
                  <button className="page-chip active">1</button>
                  <button className="page-chip">2</button>
                  {menuModalTab !== 'buffet' && <button className="page-chip">3</button>}
                  <button className="page-icon"><ChevronRight size={14} /></button>
                </div>
              </div>
            </div>

            <div className="inv-modal-foot">
              <button className="ghost" onClick={() => setShowMenuModal(false)}>Đóng</button>
              <button className="primary" onClick={() => setShowMenuModal(false)}>
                <Check size={14} />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="inventory-footer">
        <p>© 2024 Quản Lý Nhà Hàng Việt. Cập nhật: 10:45 AM</p>
        <div>
          <a href="#support">Hỗ trợ</a>
          <a href="#docs">Tài liệu hệ thống</a>
        </div>
      </footer>
    </div>
  );
};

export default ManagerInventoryPage;
