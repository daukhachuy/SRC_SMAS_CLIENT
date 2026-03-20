import React, { useMemo, useState, useEffect } from 'react';
import {
  Search,
  Plus,
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
  RotateCcw,
  Loader2
} from 'lucide-react';
import '../../styles/ManagerInventoryPage.css';
import {
  getMaterials,
  getBatches,
  getInventoryLogs,
  getIngredients,
  createInventory,
  createExport,
  createImport,
  getNewBatchCode
} from '../../api/inventoryApi';

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
  const [returnTargetBatch, setReturnTargetBatch] = useState(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuModalTab, setMenuModalTab] = useState('menu');
  const [exportQty, setExportQty] = useState('');
  const [exportReason, setExportReason] = useState('');
  const [exportTargetBatch, setExportTargetBatch] = useState(null);
  const [exportSubmitting, setExportSubmitting] = useState(false);
  const [showImportBatchModal, setShowImportBatchModal] = useState(false);
  const [importBatchTarget, setImportBatchTarget] = useState(null);
  const [importBatchQty, setImportBatchQty] = useState('');
  const [importBatchReason, setImportBatchReason] = useState('');
  const [importBatchSubmitting, setImportBatchSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importForm, setImportForm] = useState({
    ingredientId: '',
    batchCode: '',
    quantity: '',
    pricePerUnit: '',
    expiryDate: '',
    warehouseLocation: '',
    note: ''
  });

  // API Data State
  const [materialsData, setMaterialsData] = useState([]);
  const [batchesData, setBatchesData] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data from API - dùng allSettled để 1 API lỗi (vd logs 404) không làm mất hết data
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [materialsResult, batchesResult, logsResult, ingredientsResult] = await Promise.allSettled([
        getMaterials(),
        getBatches(),
        getInventoryLogs(),
        getIngredients()
      ]);

      const materials = materialsResult.status === 'fulfilled' ? materialsResult.value : null;
      const batches = batchesResult.status === 'fulfilled' ? batchesResult.value : null;
      const logs = logsResult.status === 'fulfilled' ? logsResult.value : [];
      console.log('📜 Logs fetched:', logs);
      const ingredientsRaw = ingredientsResult.status === 'fulfilled' ? ingredientsResult.value : null;
      const arr = Array.isArray(ingredientsRaw) ? ingredientsRaw : (ingredientsRaw?.$values || []);
      setIngredientsList(arr.map((i) => ({ id: i.ingredientId ?? i.id, name: i.ingredientName || i.name || '' })));

      setMaterialsData(transformMaterials(materials));
      setBatchesData(transformBatches(batches));
      setLogsData(transformLogs(logs));

      const failed = [materialsResult, batchesResult, logsResult].filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        const msg = failed[0].reason?.message || 'Failed to load some inventory data';
        setError(failed.length === 3 ? msg : null);
      }
    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
      setError(err.message || 'Failed to load inventory data');
      setMaterialsData([]);
      setBatchesData([]);
      setLogsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openImportModal = async () => {
    setShowImportModal(true);
    try {
      const code = await getNewBatchCode();
      if (code && typeof code === 'string') setImportForm((f) => ({ ...f, batchCode: code }));
    } catch (_) {}
  };

  const handleCreateInventory = async (e) => {
    e.preventDefault();
    const { ingredientId, batchCode, quantity, pricePerUnit, expiryDate, warehouseLocation, note } = importForm;
    if (!ingredientId || !batchCode || quantity === '' || pricePerUnit === '') return;
    setImportSubmitting(true);
    try {
      await createInventory({
        ingredientId: Number(ingredientId),
        batchCode: batchCode.trim(),
        quantity: Number(quantity) || 0,
        pricePerUnit: Number(pricePerUnit) || 0,
        expiryDate: expiryDate || null,
        warehouseLocation: warehouseLocation.trim() || null,
        note: note.trim() || null
      });
      setShowImportModal(false);
      setImportForm({ ingredientId: '', batchCode: '', quantity: '', pricePerUnit: '', expiryDate: '', warehouseLocation: '', note: '' });
      await fetchAllData();
    } catch (err) {
      console.error('Failed to create inventory:', err);
      setError(err.message || 'Không thể tạo lô hàng');
    } finally {
      setImportSubmitting(false);
    }
  };

  // Transform functions to match component format
  const transformMaterials = (data) => {
    if (!data) return [];
    const arr = Array.isArray(data) ? data : data.$values || [];
    return arr.map(item => ({
      id: item.ingredientId || item.inventoryId || '',
      name: item.ingredientName || '',
      unit: item.unitOfMeasurement || 'kg',
      current: item.quantityOnHand || item.currentStock || 0,
      max: 100,
      alert: item.warningLevel || 10,
      level: (item.quantityOnHand || 0) <= (item.warningLevel || 10) ? 'danger' : 'normal'
    }));
  };

  const transformBatches = (data) => {
    if (!data) return [];
    const arr = Array.isArray(data) ? data : data.$values || [];
    return arr.map(item => ({
      inventoryId: item.inventoryId,
      batchCode: item.batchCode || `#BATCH-${item.inventoryId || ''}`,
      material: item.ingredientName || '',
      quantityOnHand: item.quantityOnHand ?? 0,
      unit: item.unitOfMeasurement || 'kg',
      stockText: `Tồn: ${item.quantityOnHand ?? 0} ${item.unitOfMeasurement || 'kg'}`,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('vi-VN') : '',
      status: item.status === 'expired' || (item.expiryDate && new Date(item.expiryDate) < new Date()) ? 'expiring' : 'valid'
    }));
  };

  const transformLogs = (data) => {
    if (!data) return [];
    const arr = Array.isArray(data) ? data : data.$values || [];
    return arr.map(item => ({
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '',
      time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN') : '',
      type: item.action === 'Import' ? 'import' : 'export',
      material: item.ingredientName || '',
      quantity: (item.action === 'Import' ? '+' : '-') + (Math.abs((item.newQuantity || 0) - (item.oldQuantity || 0))),
      unit: item.unitOfMeasurement || 'kg',
      reason: item.note || '',
      operator: 'NV. Staff',
      avatar: 'S'
    }));
  };

  // Mock data fallback
  const MOCK_MATERIALS = [
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

  const MOCK_BATCHES = [
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

  const MOCK_LOGS = [
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

  const openExportModal = (batch) => {
    setExportTargetBatch(batch);
    setExportQty('');
    setExportReason('');
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportTargetBatch(null);
    setExportQty('');
    setExportReason('');
  };

  const maxExportQty = exportTargetBatch?.quantityOnHand ?? 0;
  const exportQtyNum = Number(exportQty);
  const hasQty = exportQty !== '' && !isNaN(exportQtyNum);
  const isExportInvalid = hasQty && (exportQtyNum > maxExportQty || exportQtyNum <= 0);

  const handleConfirmExport = async (e) => {
    e.preventDefault();
    if (!exportTargetBatch?.inventoryId || !hasQty || isExportInvalid || !exportReason.trim()) return;
    setExportSubmitting(true);
    try {
      await createExport({
        inventoryId: exportTargetBatch.inventoryId,
        quantity: Math.round(Number(exportQty)) || 0,
        reason: exportReason.trim()
      });
      console.log('✅ Export created, reloading logs...');
      closeExportModal();
      await fetchAllData();
    } catch (err) {
      console.error('Failed to create export:', err);
      setError(err.message || 'Không thể tạo phiếu xuất kho');
    } finally {
      setExportSubmitting(false);
    }
  };

  const openImportBatchModal = (batch) => {
    setImportBatchTarget(batch);
    setImportBatchQty('');
    setImportBatchReason('');
    setShowImportBatchModal(true);
  };

  const closeImportBatchModal = () => {
    setShowImportBatchModal(false);
    setImportBatchTarget(null);
    setImportBatchQty('');
    setImportBatchReason('');
  };

  const importBatchQtyNum = Number(importBatchQty);
  const hasImportQty = importBatchQty !== '' && !isNaN(importBatchQtyNum);
  const isImportBatchInvalid = hasImportQty && importBatchQtyNum <= 0;

  const handleConfirmImportBatch = async (e) => {
    e.preventDefault();
    if (!importBatchTarget?.inventoryId || !hasImportQty || isImportBatchInvalid || !importBatchReason.trim()) return;
    setImportBatchSubmitting(true);
    try {
      await createImport({
        inventoryId: importBatchTarget.inventoryId,
        quantity: Math.round(importBatchQtyNum) || 0,
        reason: importBatchReason.trim()
      });
      closeImportBatchModal();
      await fetchAllData();
    } catch (err) {
      console.error('Failed to create import:', err);
      setError(err.message || 'Không thể tạo phiếu nhập kho');
    } finally {
      setImportBatchSubmitting(false);
    }
  };

  const openReturnModal = (batch) => {
    setReturnTargetBatch(batch);
    setReturnQty('');
    setReturnReason('');
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setReturnTargetBatch(null);
    setReturnQty('');
    setReturnReason('');
  };

  const returnQtyNum = Number(returnQty);
  const hasReturnQty = returnQty !== '' && !isNaN(returnQtyNum);
  const isReturnInvalid = hasReturnQty && returnQtyNum <= 0;

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (!returnTargetBatch?.inventoryId || !hasReturnQty || isReturnInvalid || !returnReason.trim()) return;
    setReturnSubmitting(true);
    try {
      await createImport({
        inventoryId: returnTargetBatch.inventoryId,
        quantity: Math.round(returnQtyNum) || 0,
        reason: returnReason.trim()
      });
      closeReturnModal();
      await fetchAllData();
    } catch (err) {
      console.error('Failed to create return:', err);
      setError(err.message || 'Không thể tạo phiếu hoàn kho');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const exportLogsToCSV = () => {
    if (!logsData || logsData.length === 0) return;
    
    const headers = ['Thời gian', 'Ngày', 'Loại', 'Nguyên liệu', 'Số lượng', 'Đơn vị', 'Lý do', 'Người thực hiện'];
    const rows = logsData.map(log => [
      log.time,
      log.date,
      log.type === 'import' ? 'Nhập kho' : 'Xuất kho',
      log.material,
      log.quantity,
      log.unit,
      log.reason,
      log.operator
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `BaoCaoTonKho_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return materialsData;
    return materialsData.filter((item) => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
  }, [searchQuery, materialsData]);

  const filteredBatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return batchesData;
    return batchesData.filter((item) => item.material.toLowerCase().includes(q) || item.batchCode.toLowerCase().includes(q));
  }, [searchQuery, batchesData]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return logsData;
    return logsData.filter((item) => item.material.toLowerCase().includes(q) || item.reason.toLowerCase().includes(q));
  }, [searchQuery, logsData]);

  /** Chỉ 2 log mới nhất cho sidebar "Nhật ký Kho gần đây" */
  const recentLogs = useMemo(() => filteredLogs.slice(0, 2), [filteredLogs]);

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
                  <button className="action-btn export" onClick={() => openExportModal(item)}>
                    <ArrowUpToLine size={14} />
                    Xuất chế biến
                  </button>
                  <button className="action-btn restore" onClick={() => openReturnModal(item)}>
                    <RotateCcw size={14} />
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
            <button className="btn-export-report" onClick={exportLogsToCSV}>
              <Download size={16} />
              Xuất báo cáo
            </button>
          ) : (
            <button className="primary-btn" onClick={openImportModal}>
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

            {loading && (
              <div className="loading-container">
                <Loader2 size={32} className="spin" />
                <p>Đang tải dữ liệu kho hàng...</p>
              </div>
            )}

            {!loading && error && (
              <div className="error-banner">
                <CircleAlert size={16} />
                <span>{error}</span>
                <button onClick={fetchAllData}>Thử lại</button>
              </div>
            )}

            {!loading && activeTab === 'materials' && renderMaterialsTable()}
            {!loading && activeTab === 'batches' && renderBatchesTable()}
            {!loading && activeTab === 'history' && renderLogsTable()}
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
                {recentLogs.length === 0 ? (
                  <p className="recent-log-empty">Chưa có nhật ký</p>
                ) : (
                  recentLogs.map((log, idx) => (
                    <div key={`recent-${idx}-${log.material}-${log.time}`} className={`recent-log ${log.type}`}>
                      <span className="dot" />
                      <div>
                        <strong>
                          {log.type === 'import' ? 'Nhập' : 'Xuất'} {log.quantity}{log.unit} {log.material}
                        </strong>
                        <p>Lý do: {log.reason || '—'}</p>
                        <small>{log.time} • {log.operator}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showImportModal && (
        <div className="inv-modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-head">
              <h3>
                <ArrowUpToLine size={18} />
                Nhập kho mới (Tạo lô hàng)
              </h3>
              <button type="button" onClick={() => setShowImportModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateInventory} className="inv-modal-body">
              <label>Nguyên liệu <span className="inv-required">*</span></label>
              <select
                value={importForm.ingredientId}
                onChange={(e) => setImportForm((f) => ({ ...f, ingredientId: e.target.value }))}
                required
              >
                <option value="">Chọn nguyên liệu</option>
                {ingredientsList.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
              <label>Mã lô <span className="inv-required">*</span></label>
              <input
                type="text"
                placeholder="VD: BATCH20240105802"
                value={importForm.batchCode}
                onChange={(e) => setImportForm((f) => ({ ...f, batchCode: e.target.value }))}
                required
              />
              <label>Số lượng <span className="inv-required">*</span></label>
              <input
                type="number"
                step="0.0001"
                min="0"
                placeholder="0"
                value={importForm.quantity}
                onChange={(e) => setImportForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
              <label>Đơn giá (VNĐ/đơn vị) <span className="inv-required">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={importForm.pricePerUnit}
                onChange={(e) => setImportForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
                required
              />
              <label>Hạn sử dụng</label>
              <input
                type="date"
                value={importForm.expiryDate}
                onChange={(e) => setImportForm((f) => ({ ...f, expiryDate: e.target.value }))}
              />
              <label>Vị trí kho</label>
              <input
                type="text"
                placeholder="VD: Kho Lạnh A2"
                value={importForm.warehouseLocation}
                onChange={(e) => setImportForm((f) => ({ ...f, warehouseLocation: e.target.value }))}
              />
              <label>Ghi chú</label>
              <input
                type="text"
                placeholder="VD: Thịt heo VietGAP"
                value={importForm.note}
                onChange={(e) => setImportForm((f) => ({ ...f, note: e.target.value }))}
              />
              <div className="inv-modal-foot" style={{ marginTop: '1rem' }}>
                <button type="button" className="ghost" onClick={() => setShowImportModal(false)}>Hủy</button>
                <button type="submit" className="primary" disabled={importSubmitting}>
                  {importSubmitting ? <Loader2 size={18} className="spin" /> : 'Tạo lô hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExportModal && exportTargetBatch && (
        <div className="inv-modal-overlay" onClick={closeExportModal}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-head">
              <h3>
                <ArrowUpToLine size={18} />
                Xác nhận Xuất kho - {exportTargetBatch.material}
              </h3>
              <button type="button" onClick={closeExportModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmExport} className="inv-modal-body">
              <div className="batch-info-box">
                <div>
                  <span>Thông tin lô hàng</span>
                  <strong>{exportTargetBatch.batchCode}</strong>
                </div>
                <div className="right">
                  <span>Tồn kho hiện tại</span>
                  <strong>{exportTargetBatch.quantityOnHand} {exportTargetBatch.unit}</strong>
                </div>
              </div>

              <label>Số lượng xuất ({exportTargetBatch.unit}) <span className="inv-required">*</span></label>
              <input
                type="number"
                step="0.0001"
                min="0"
                max={maxExportQty}
                placeholder="0"
                value={exportQty}
                onChange={(e) => setExportQty(e.target.value)}
                required
              />
              {hasQty && isExportInvalid && (
                <p className="error-text">
                  <CircleAlert size={14} />
                  Số lượng xuất phải lớn hơn 0 và không vượt quá tồn kho ({maxExportQty} {exportTargetBatch.unit}).
                </p>
              )}

              <label>Lý do xuất kho <span className="inv-required">*</span></label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Xuất cho ca sáng, chế biến món..."
                value={exportReason}
                onChange={(e) => setExportReason(e.target.value)}
                required
              />
            </form>

            <div className="inv-modal-foot">
              <button type="button" className="ghost" onClick={closeExportModal}>Hủy</button>
              <button
                type="button"
                className="danger"
                disabled={!hasQty || isExportInvalid || !exportReason.trim() || exportSubmitting}
                onClick={handleConfirmExport}
              >
                {exportSubmitting ? <Loader2 size={18} className="spin" /> : 'Xác nhận xuất'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && returnTargetBatch && (
        <div className="inv-modal-overlay" onClick={closeReturnModal}>
          <div className="inv-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-head">
              <h3>
                <RotateCcw size={18} />
                Xác nhận Hoàn kho - {returnTargetBatch.material}
              </h3>
              <button type="button" onClick={closeReturnModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmReturn} className="inv-modal-body">
              <div className="batch-info-box neutral">
                <div>
                  <span>Thông tin lô hàng</span>
                  <strong>{returnTargetBatch.batchCode}</strong>
                </div>
                <div className="right">
                  <span>Tồn kho hiện tại</span>
                  <strong>{returnTargetBatch.quantityOnHand} {returnTargetBatch.unit}</strong>
                </div>
              </div>

              <label>Số lượng hoàn trả ({returnTargetBatch.unit}) <span className="inv-required">*</span></label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                placeholder="0"
                value={returnQty}
                onChange={(e) => setReturnQty(e.target.value)}
                required
              />
              {hasReturnQty && isReturnInvalid && (
                <p className="error-text">
                  <CircleAlert size={14} />
                  Số lượng hoàn trả phải lớn hơn 0.
                </p>
              )}

              <label>Lý do hoàn kho <span className="inv-required">*</span></label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                required
              >
                <option value="">Chọn lý do</option>
                <option value="Dư thừa cuối ngày">Dư thừa cuối ngày</option>
                <option value="Đổi trả NCC">Đổi trả NCC</option>
                <option value="Sai sót nhập liệu">Sai sót nhập liệu</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </form>

            <div className="inv-modal-foot">
              <button type="button" className="ghost" onClick={closeReturnModal}>Đóng</button>
              <button
                type="button"
                className="primary"
                disabled={!hasReturnQty || isReturnInvalid || !returnReason.trim() || returnSubmitting}
                onClick={handleConfirmReturn}
              >
                {returnSubmitting ? <Loader2 size={18} className="spin" /> : 'Hoàn tất'}
              </button>
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
