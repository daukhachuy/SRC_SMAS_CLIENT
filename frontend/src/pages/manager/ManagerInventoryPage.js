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
import {
  getFoodCategories,
  normalizeFoodCategoryPayload,
  resolveFoodImageUrl,
  getComboLists,
  getBuffetLists,
  updateFoodStatus,
  updateBuffetStatus,
  patchComboStatus
} from '../../api/foodApi';

const FIXED_MENU_IMG = 'https://res.cloudinary.com/dmzuier4p/image/upload/v1773138906/OIP_devlp6.jpg';

const formatVnd = (n) => {
  if (n == null || n === '') return '0đ';
  const num = Number(n);
  if (Number.isNaN(num)) return '0đ';
  return `${num.toLocaleString('vi-VN')}đ`;
};

const normalizeFoodRow = (raw) => {
  const rawId = raw.foodId ?? raw.id;
  const id = Number.isFinite(Number(rawId)) ? Number(rawId) : rawId;
  const available = raw.isAvailable !== false;
  return {
    kind: 'food',
    id,
    name: raw.foodName || raw.name || '',
    description: raw.description || '',
    priceLine: formatVnd(raw.price),
    image: resolveFoodImageUrl(raw.image),
    state: available ? 'active' : 'sold-out',
    available
  };
};

const normalizeComboRow = (raw) => {
  const id = raw.comboId ?? raw.id;
  const available = raw.isAvailable !== false;
  return {
    kind: 'combo',
    id,
    name: raw.comboName || raw.name || '',
    description: raw.description || '',
    priceLine: formatVnd(raw.comboPrice ?? raw.price),
    image: resolveFoodImageUrl(raw.image),
    state: available ? 'active' : 'sold-out',
    available,
    isAvailable: available
  };
};

const normalizeBuffetRow = (raw) => {
  const rawId = raw.buffetId ?? raw.id;
  const id = Number.isFinite(Number(rawId)) ? Number(rawId) : rawId;
  const available = raw.isAvailable !== false;
  const adult = raw.mainPrice ?? raw.adultPrice ?? raw.price ?? 0;
  const child = raw.childrenPrice ?? raw.childPrice ?? 0;
  return {
    kind: 'buffet',
    id,
    name: raw.name || '',
    description: raw.description || '',
    nlPriceText: formatVnd(adult),
    tePriceText: formatVnd(child),
    priceLine: `NL ${formatVnd(adult)} · TE ${formatVnd(child)}`,
    image: resolveFoodImageUrl(raw.image),
    state: available ? 'active' : 'sold-out',
    available,
    isAvailable: available
  };
};

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
  const [catalogFoods, setCatalogFoods] = useState([]);
  const [catalogCombos, setCatalogCombos] = useState([]);
  const [catalogBuffets, setCatalogBuffets] = useState([]);
  const [menuCatalogLoading, setMenuCatalogLoading] = useState(false);
  const [menuCatalogError, setMenuCatalogError] = useState(null);
  const [foodTogglingId, setFoodTogglingId] = useState(null);
  const [buffetTogglingId, setBuffetTogglingId] = useState(null);
  const [comboTogglingId, setComboTogglingId] = useState(null);
  /** Optimistic UI: foodId → isAvailable (chờ API; lỗi thì xóa key để revert) */
  const [foodAvailOverride, setFoodAvailOverride] = useState({});
  /** Optimistic UI: buffetId → isAvailable (tách khỏi food để trùng id) */
  const [buffetAvailOverride, setBuffetAvailOverride] = useState({});
  /** Optimistic UI: comboId → isAvailable */
  const [comboAvailOverride, setComboAvailOverride] = useState({});
  const [menuPage, setMenuPage] = useState(1);
  const MENU_PAGE_SIZE = 6;
  const PAGE_SIZE = 5;
  const [matPage, setMatPage] = useState(1);
  const [batchPage, setBatchPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  /** Mặc định «Tất cả» — tắt món → API → món biến mất (lọc bỏ sold-out khi default selling) */
  const [menuStatusFilter, setMenuStatusFilter] = useState('all');
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

  const fetchMenuCatalog = async () => {
    setMenuCatalogLoading(true);
    setMenuCatalogError(null);
    try {
      const [foodRes, comboRes, buffetRes] = await Promise.allSettled([
        getFoodCategories(),
        getComboLists(),
        getBuffetLists()
      ]);

      if (foodRes.status === 'fulfilled') {
        const arr = normalizeFoodCategoryPayload(foodRes.value);
        setCatalogFoods(arr.map(normalizeFoodRow));
      } else {
        setCatalogFoods([]);
      }

      if (comboRes.status === 'fulfilled') {
        const raw = comboRes.value;
        const arr = Array.isArray(raw) ? raw : raw?.$values || [];
        setCatalogCombos(arr.map(normalizeComboRow));
      } else {
        setCatalogCombos([]);
      }

      if (buffetRes.status === 'fulfilled') {
        const raw = buffetRes.value;
        const arr = Array.isArray(raw) ? raw : raw?.$values || [];
        setCatalogBuffets(arr.map(normalizeBuffetRow));
      } else {
        setCatalogBuffets([]);
      }
      setFoodAvailOverride({});
      setBuffetAvailOverride({});
    } catch (err) {
      console.error('fetchMenuCatalog:', err);
      setMenuCatalogError(err.message || 'Không tải được thực đơn');
    } finally {
      setMenuCatalogLoading(false);
    }
  };

  const catalogFoodsEffective = useMemo(() => {
    return catalogFoods.map((f) => {
      const key = Number.isFinite(Number(f.id)) ? Number(f.id) : f.id;
      const o = foodAvailOverride[key];
      if (o === undefined) return f;
      return { ...f, available: o, state: o ? 'active' : 'sold-out', isAvailable: o };
    });
  }, [catalogFoods, foodAvailOverride]);

  const catalogCombosEffective = useMemo(() => {
    return catalogCombos.map((c) => {
      const key = Number.isFinite(Number(c.id)) ? Number(c.id) : c.id;
      const o = comboAvailOverride[key];
      if (o === undefined) return c;
      return { ...c, available: o, state: o ? 'active' : 'sold-out', isAvailable: o };
    });
  }, [catalogCombos, comboAvailOverride]);

  const catalogBuffetsEffective = useMemo(() => {
    return catalogBuffets.map((b) => {
      const key = Number.isFinite(Number(b.id)) ? Number(b.id) : b.id;
      const o = buffetAvailOverride[key];
      if (o === undefined) return b;
      return { ...b, available: o, state: o ? 'active' : 'sold-out', isAvailable: o };
    });
  }, [catalogBuffets, buffetAvailOverride]);

  const handleFoodToggle = async (row) => {
    if (row.kind !== 'food' || row.id == null) return;
    const id = Number(row.id);
    if (!Number.isFinite(id)) return;
    const nextAvailable = !row.available;
    setFoodAvailOverride((prev) => ({ ...prev, [id]: nextAvailable }));
    setFoodTogglingId(id);
    setMenuCatalogError(null);
    try {
      const res = await updateFoodStatus(id);
      if (res?.msgCode && res.msgCode !== 'MSG_022') {
        console.warn('msgCode không phải MSG_022:', res.msgCode);
      }
      await fetchMenuCatalog();
    } catch (err) {
      setFoodAvailOverride((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      setMenuCatalogError(err.message || 'Không thể cập nhật trạng thái món');
    } finally {
      setFoodTogglingId(null);
    }
  };

  const handleBuffetToggle = async (row) => {
    if (row.kind !== 'buffet' || row.id == null) return;
    const id = Number(row.id);
    if (!Number.isFinite(id)) return;
    const nextAvailable = !row.available;
    setBuffetAvailOverride((prev) => ({ ...prev, [id]: nextAvailable }));
    setBuffetTogglingId(id);
    setMenuCatalogError(null);
    try {
      const res = await updateBuffetStatus(id);
      if (res?.msgCode && res.msgCode !== 'MSG_022') {
        console.warn('Buffet status msgCode không phải MSG_022:', res.msgCode);
      }
      await fetchMenuCatalog();
    } catch (err) {
      setBuffetAvailOverride((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      setMenuCatalogError(err.message || 'Không thể cập nhật trạng thái buffet');
    } finally {
      setBuffetTogglingId(null);
    }
  };

  const handleComboToggle = async (row) => {
    if (row.kind !== 'combo' || row.id == null) return;
    const id = Number(row.id);
    if (!Number.isFinite(id)) return;
    const nextAvailable = !row.available;
    setComboAvailOverride((prev) => ({ ...prev, [id]: nextAvailable }));
    setComboTogglingId(id);
    setMenuCatalogError(null);
    try {
      await patchComboStatus(id, nextAvailable);
      await fetchMenuCatalog();
    } catch (err) {
      setComboAvailOverride((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      setMenuCatalogError(err.message || 'Không thể cập nhật trạng thái combo');
    } finally {
      setComboTogglingId(null);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchMenuCatalog();
  }, []);

  useEffect(() => {
    setMenuPage(1);
  }, [menuModalTab, menuSearchQuery, menuStatusFilter]);

  useEffect(() => {
    if (showMenuModal) {
      setMenuStatusFilter('all');
      setMenuPage(1);
      setMenuSearchQuery('');
    }
  }, [showMenuModal]);

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

  /** GET /api/inventory/logs: inventoryLogId, ingredientName, unitOfMeasurement, batchCode, action, oldQuantity, newQuantity, details, timestamp, fullname */
  const transformLogs = (data) => {
    if (!data) return [];
    const arr = Array.isArray(data) ? data : data.$values || [];

    const isImportAction = (action) => {
      const s = String(action ?? '').trim().toLowerCase();
      if (!s) return null;
      if (s.includes('import') || s.includes('nhập') || s === 'in' || s === '1') return true;
      if (s.includes('export') || s.includes('xuất') || s === 'out' || s === '2') return false;
      return null;
    };

    return arr.map((item) => {
      const tsRaw = item.timestamp ?? item.createdAt;
      const d = tsRaw ? new Date(tsRaw) : null;
      const oldQ = Number(item.oldQuantity) || 0;
      const newQ = Number(item.newQuantity) || 0;
      const delta = newQ - oldQ;
      const magnitude = Math.abs(delta);
      const fromAction = isImportAction(item.action);
      const type =
        fromAction !== null
          ? (fromAction ? 'import' : 'export')
          : delta >= 0
            ? 'import'
            : 'export';
      const quantity = `${type === 'import' ? '+' : '-'}${magnitude}`;

      const fullname = String(item.fullname || '').trim();
      const avatar = fullname ? fullname.charAt(0).toUpperCase() : '?';

      return {
        id: item.inventoryLogId ?? item.id,
        batchCode: item.batchCode || '',
        date: d ? d.toLocaleDateString('vi-VN') : '',
        time: d ? d.toLocaleTimeString('vi-VN') : '',
        type,
        material: item.ingredientName || '',
        quantity,
        unit: item.unitOfMeasurement || 'kg',
        reason: item.details ?? item.note ?? '',
        operator: fullname || '—',
        avatar
      };
    });
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
    return materialsData.filter((item) => {
      const name = String(item.name ?? '').toLowerCase();
      const idStr = String(item.id ?? '').toLowerCase();
      return name.includes(q) || idStr.includes(q);
    });
  }, [searchQuery, materialsData]);

  const filteredBatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return batchesData;
    return batchesData.filter((item) => {
      const mat = String(item.material ?? '').toLowerCase();
      const code = String(item.batchCode ?? '').toLowerCase();
      return mat.includes(q) || code.includes(q);
    });
  }, [searchQuery, batchesData]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return logsData;
    return logsData.filter((item) => {
      const mat = String(item.material ?? '').toLowerCase();
      const reason = String(item.reason ?? '').toLowerCase();
      const batch = String(item.batchCode ?? '').toLowerCase();
      const op = String(item.operator ?? '').toLowerCase();
      return mat.includes(q) || reason.includes(q) || batch.includes(q) || op.includes(q);
    });
  }, [searchQuery, logsData]);

  /** Chỉ 2 log mới nhất cho sidebar "Nhật ký Kho gần đây" */
  const recentLogs = useMemo(() => filteredLogs.slice(0, 2), [filteredLogs]);

  // Reset page when search changes
  useEffect(() => {
    setMatPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setBatchPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setLogPage(1);
  }, [searchQuery]);

  // Clamp page when filtered list shrinks
  useEffect(() => {
    setMatPage(p => Math.min(p, Math.max(1, Math.ceil(filteredMaterials.length / PAGE_SIZE) || 1)));
  }, [filteredMaterials.length]);

  useEffect(() => {
    setBatchPage(p => Math.min(p, Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE) || 1)));
  }, [filteredBatches.length]);

  useEffect(() => {
    setLogPage(p => Math.min(p, Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE) || 1)));
  }, [filteredLogs.length]);

  // Reset page when switching tabs
  useEffect(() => {
    setMatPage(1);
    setBatchPage(1);
    setLogPage(1);
  }, [activeTab]);

  const filteredModalItems = useMemo(() => {
    let list =
      menuModalTab === 'menu'
        ? catalogFoodsEffective
        : menuModalTab === 'combo'
          ? catalogCombosEffective
          : catalogBuffetsEffective;
    const q = menuSearchQuery.trim().toLowerCase();
    return list.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      if (q) {
        if (menuModalTab === 'buffet') {
          if (!name.includes(q)) return false;
        } else if (!name.includes(q) && !desc.includes(q)) {
          return false;
        }
      }
      if (menuStatusFilter === 'selling' && item.state === 'sold-out') return false;
      if (menuStatusFilter === 'soldout' && item.state !== 'sold-out') return false;
      return true;
    });
  }, [menuModalTab, menuSearchQuery, menuStatusFilter, catalogFoodsEffective, catalogCombosEffective, catalogBuffetsEffective]);

  const modalTotalPages = Math.max(1, Math.ceil(filteredModalItems.length / MENU_PAGE_SIZE) || 1);

  useEffect(() => {
    setMenuPage((p) => Math.min(p, modalTotalPages));
  }, [modalTotalPages]);

  const modalPageItems = useMemo(() => {
    const start = (menuPage - 1) * MENU_PAGE_SIZE;
    return filteredModalItems.slice(start, start + MENU_PAGE_SIZE);
  }, [filteredModalItems, menuPage]);

  /** Trang 1 … 12 (có …) cho thanh phân trang modal thực đơn */
  const menuModalPageNumbers = useMemo(() => {
    const total = modalTotalPages;
    const cur = menuPage;
    if (total <= 1) return [1];
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const set = new Set([1, total]);
    for (let d = -2; d <= 2; d++) {
      const p = cur + d;
      if (p >= 1 && p <= total) set.add(p);
    }
    const sorted = [...set].sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        out.push('ellipsis');
      }
      out.push(sorted[i]);
    }
    return out;
  }, [modalTotalPages, menuPage]);

  const servingCount = useMemo(
    () => catalogFoodsEffective.filter((f) => f.available).length,
    [catalogFoodsEffective]
  );
  const suspendedCount = useMemo(
    () => catalogFoodsEffective.filter((f) => !f.available).length,
    [catalogFoodsEffective]
  );
  const menuPreviewRows = useMemo(
    () => catalogFoodsEffective.filter((f) => f.state !== 'sold-out').slice(0, 2),
    [catalogFoodsEffective]
  );

  const menuSearchPlaceholder =
    menuModalTab === 'combo'
      ? 'Tìm tên combo...'
      : menuModalTab === 'buffet'
        ? 'Tìm gói buffet...'
        : 'Tìm tên món ăn...';

  const renderMaterialsTable = () => {
    const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / PAGE_SIZE) || 1);
    const pageItems = filteredMaterials.slice((matPage - 1) * PAGE_SIZE, matPage * PAGE_SIZE);
    return (
    <>
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
          {pageItems.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Không có nguyên liệu nào</td>
            </tr>
          ) : (
            pageItems.map((item, idx) => {
              const pct = Math.round((item.current / item.max) * 100);
              return (
                <tr key={`mat-${item.id}-${idx}`} className={item.level === 'danger' ? 'row-danger' : ''}>
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
            })
          )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          {filteredMaterials.length === 0
            ? 'Không có nguyên liệu nào'
            : `Hiển thị ${(matPage - 1) * PAGE_SIZE + 1}–${Math.min(matPage * PAGE_SIZE, filteredMaterials.length)} trên ${filteredMaterials.length} nguyên liệu`}
        </span>
        <div className="page-row">
          <button className="page-btn" disabled={matPage <= 1} onClick={() => setMatPage(p => Math.max(1, p - 1))}>Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button key={n} className={`page-btn ${matPage === n ? 'active' : ''}`} onClick={() => setMatPage(n)}>{n}</button>
          ))}
          <button className="page-btn" disabled={matPage >= totalPages} onClick={() => setMatPage(p => Math.min(totalPages, p + 1))}>Sau</button>
        </div>
      </div>
    </>
    );
  };

  const renderBatchesTable = () => {
    const totalPages = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE) || 1);
    const pageItems = filteredBatches.slice((batchPage - 1) * PAGE_SIZE, batchPage * PAGE_SIZE);
    return (
    <>
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
          {pageItems.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Không có lô hàng nào</td>
            </tr>
          ) : (
            pageItems.map((item, idx) => (
              <tr key={`batch-${item.batchCode}-${idx}`}>
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
            ))
          )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          {filteredBatches.length === 0
            ? 'Không có lô hàng nào'
            : `Hiển thị ${(batchPage - 1) * PAGE_SIZE + 1}–${Math.min(batchPage * PAGE_SIZE, filteredBatches.length)} trên ${filteredBatches.length} lô hàng`}
        </span>
        <div className="page-row">
          <button className="page-btn" disabled={batchPage <= 1} onClick={() => setBatchPage(p => Math.max(1, p - 1))}>Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button key={n} className={`page-btn ${batchPage === n ? 'active' : ''}`} onClick={() => setBatchPage(n)}>{n}</button>
          ))}
          <button className="page-btn" disabled={batchPage >= totalPages} onClick={() => setBatchPage(p => Math.min(totalPages, p + 1))}>Sau</button>
        </div>
      </div>
    </>
    );
  };

  const renderLogsTable = () => {
    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE) || 1);
    const pageItems = filteredLogs.slice((logPage - 1) * PAGE_SIZE, logPage * PAGE_SIZE);
    return (
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
          {pageItems.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Không có nhật ký nào</td>
            </tr>
          ) : (
            pageItems.map((log, idx) => (
              <tr key={log.id != null ? `log-${log.id}` : `log-${idx}-${log.time}`}>
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
            ))
          )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>
          {filteredLogs.length === 0
            ? 'Không có nhật ký nào'
            : `Hiển thị ${(logPage - 1) * PAGE_SIZE + 1}–${Math.min(logPage * PAGE_SIZE, filteredLogs.length)} trên ${filteredLogs.length} bản ghi`}
        </span>
        <div className="page-row">
          <button className="page-btn" disabled={logPage <= 1} onClick={() => setLogPage(p => Math.max(1, p - 1))}>Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button key={n} className={`page-btn ${logPage === n ? 'active' : ''}`} onClick={() => setLogPage(n)}>{n}</button>
          ))}
          <button className="page-btn" disabled={logPage >= totalPages} onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}>Sau</button>
        </div>
      </div>
    </>
    );
  };

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
                onClick={() => { setActiveTab('materials'); setMatPage(1); }}
              >
                Nguyên liệu
              </button>
              <button
                className={`tab-btn ${activeTab === 'batches' ? 'active' : ''}`}
                onClick={() => { setActiveTab('batches'); setBatchPage(1); }}
              >
                Lô hàng tồn kho
              </button>
              <button
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => { setActiveTab('history'); setLogPage(1); }}
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
                {menuCatalogLoading && (
                  <p className="recent-log-empty">Đang tải thực đơn...</p>
                )}
                {!menuCatalogLoading && menuCatalogError && (
                  <p className="recent-log-empty">{menuCatalogError}</p>
                )}
                {!menuCatalogLoading && !menuCatalogError && menuPreviewRows.length === 0 && (
                  <p className="recent-log-empty">Chưa có món từ API</p>
                )}
                {!menuCatalogLoading &&
                  !menuCatalogError &&
                  menuPreviewRows.map((row, idx) => {
                    const Icon = idx % 2 === 0 ? Beef : Fish;
                    const ok = row.state !== 'sold-out';
                    return (
                      <div key={`preview-${row.id}-${idx}`} className={`menu-mini-item ${ok ? '' : 'sold-out'}`}>
                        <div className="menu-mini-icon">
                          <Icon size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{row.name || '—'}</strong>
                          <span>
                            {ok ? `${row.priceLine} • Sẵn sàng` : 'HẾT NGUYÊN LIỆU'}
                          </span>
                        </div>
                        {row.kind === 'food' && (
                          <button
                            type="button"
                            className="mini-switch-btn"
                            role="switch"
                            aria-checked={ok}
                            title={ok ? 'Tắt bán' : 'Bật bán'}
                            disabled={foodTogglingId === row.id}
                            onClick={() => handleFoodToggle(row)}
                          >
                            <span className={`mini-toggle-track ${ok ? 'is-on' : ''} ${foodTogglingId === row.id ? 'is-loading' : ''}`}>
                              {foodTogglingId === row.id && (
                                <Loader2 size={11} className="spin" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#fff', zIndex: 1 }} />
                              )}
                            </span>
                          </button>
                        )}
                        {row.kind !== 'food' && (
                          <span className={`toggle-label ${ok ? 'on' : 'off'}`} style={{ fontSize: '0.58rem' }}>
                            {ok ? 'ON' : 'OFF'}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="mini-stats">
                <div>
                  <strong>{menuCatalogLoading ? '—' : servingCount}</strong>
                  <span>Phục vụ</span>
                </div>
                <div>
                  <strong>{menuCatalogLoading ? '—' : suspendedCount}</strong>
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
                <p>
                  {menuModalTab === 'buffet'
                    ? 'Cập nhật danh sách gói buffet và trạng thái phục vụ (Đang bán / Hết hàng).'
                    : menuModalTab === 'combo'
                      ? 'Cập nhật danh sách combo và trạng thái (chỉ món lẻ có thể bật/tắt bán qua API).'
                      : 'Cập nhật danh sách món và trạng thái phục vụ.'}
                </p>
              </div>
              <button type="button" onClick={() => setShowMenuModal(false)}><X size={18} /></button>
            </div>

            {menuCatalogError && (
              <div className="error-banner" style={{ margin: '0 1rem' }}>
                <CircleAlert size={16} />
                <span>{menuCatalogError}</span>
              </div>
            )}

            <div className="menu-modal-tabs">
              <button type="button" className={menuModalTab === 'menu' ? 'active' : ''} onClick={() => setMenuModalTab('menu')}>Món lẻ (Menu)</button>
              <button type="button" className={menuModalTab === 'combo' ? 'active' : ''} onClick={() => setMenuModalTab('combo')}>Combo</button>
              <button type="button" className={menuModalTab === 'buffet' ? 'active' : ''} onClick={() => setMenuModalTab('buffet')}>Buffet</button>
            </div>

            <div className="menu-modal-search">
              <div className="input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  placeholder={menuSearchPlaceholder}
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-wrap">
                <span>Trạng thái:</span>
                <select value={menuStatusFilter} onChange={(e) => setMenuStatusFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="selling">Đang bán</option>
                  <option value="soldout">Hết hàng</option>
                </select>
              </div>
            </div>
            <p className="menu-modal-filter-hint">
              {menuModalTab === 'buffet'
                ? 'Tắt gói buffet → API cập nhật → ẩn với khách. Chọn «Hết hàng» để lọc và bật lại.'
                : 'Tắt món → API cập nhật → món biến mất khỏi lưới. Chọn «Hết hàng» để tìm và bật lại.'}
            </p>

            <div className="menu-modal-body">
              {menuCatalogLoading && (
                <div className="loading-container" style={{ padding: '2rem' }}>
                  <Loader2 size={28} className="spin" />
                  <p>Đang tải thực đơn...</p>
                </div>
              )}
              {!menuCatalogLoading && (
                <>
                  <div className="menu-grid">
                    {modalPageItems.length === 0 && (
                      <p className="recent-log-empty" style={{ gridColumn: '1 / -1' }}>Không có mục nào.</p>
                    )}
                    {modalPageItems.map((item) => (
                      <div
                        key={`${item.kind}-${item.id}`}
                        className={`menu-card menu-card--compact ${item.state === 'sold-out' ? 'sold-out' : ''}`}
                      >
                        <div className="menu-card-thumb-wrap">
                          <img
                            className="menu-card-thumb"
                            src={item.image}
                            alt=""
                            onError={(e) => {
                              e.target.src = FIXED_MENU_IMG;
                            }}
                          />
                          {item.state === 'sold-out' && (
                            <span className="menu-card-badge-oos">Hết hàng</span>
                          )}
                        </div>
                        <div className="menu-card-main">
                          <div className="menu-card-text">
                            <h4>{item.name}</h4>
                            {item.kind === 'buffet' ? (
                              <div className="menu-card-buffet-prices">
                                <div className="buffet-price-row">
                                  <span className="buffet-price-label">NL</span>
                                  <span className="buffet-price-value">{item.nlPriceText}</span>
                                </div>
                                <div className="buffet-price-row">
                                  <span className="buffet-price-label">TE</span>
                                  <span className="buffet-price-value">{item.tePriceText}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="menu-card-price">{item.priceLine}</p>
                            )}
                          </div>
                          <div className="menu-card-actions">
                            {item.kind === 'food' ? (
                              <div className="toggle-wrap menu-card-toggle-inner">
                                <button
                                  type="button"
                                  className="menu-switch-btn"
                                  role="switch"
                                  aria-checked={item.state !== 'sold-out'}
                                  title={item.state === 'sold-out' ? 'Bật bán' : 'Tắt bán'}
                                  disabled={foodTogglingId === item.id}
                                  onClick={() => handleFoodToggle(item)}
                                >
                                  <span
                                    className={`toggle-track ${item.state !== 'sold-out' ? 'is-on' : ''} ${foodTogglingId === item.id ? 'is-loading' : ''}`}
                                  >
                                    {foodTogglingId === item.id && (
                                      <Loader2 size={13} className="spin" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#fff', zIndex: 1 }} />
                                    )}
                                  </span>
                                  <span className={`toggle-label ${item.state === 'sold-out' ? 'off' : 'on'}`}>
                                    {item.state === 'sold-out' ? 'HẾT HÀNG' : 'ĐANG BÁN'}
                                  </span>
                                </button>
                              </div>
                            ) : item.kind === 'buffet' ? (
                              <div className="toggle-wrap menu-card-toggle-inner">
                                <button
                                  type="button"
                                  className="menu-switch-btn"
                                  role="switch"
                                  aria-checked={item.state !== 'sold-out'}
                                  title={item.state === 'sold-out' ? 'Bật bán' : 'Tắt bán'}
                                  disabled={buffetTogglingId === item.id}
                                  onClick={() => handleBuffetToggle(item)}
                                >
                                  <span
                                    className={`toggle-track ${item.state !== 'sold-out' ? 'is-on' : ''} ${buffetTogglingId === item.id ? 'is-loading' : ''}`}
                                  >
                                    {buffetTogglingId === item.id && (
                                      <Loader2 size={13} className="spin" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#fff', zIndex: 1 }} />
                                    )}
                                  </span>
                                  <span className={`toggle-label ${item.state === 'sold-out' ? 'off' : 'on'}`}>
                                    {item.state === 'sold-out' ? 'HẾT HÀNG' : 'ĐANG BÁN'}
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <div className="toggle-wrap menu-card-toggle-inner">
                                <button
                                  type="button"
                                  className="menu-switch-btn"
                                  role="switch"
                                  aria-checked={item.state !== 'sold-out'}
                                  title={item.state === 'sold-out' ? 'Bật bán' : 'Tắt bán'}
                                  disabled={comboTogglingId === item.id}
                                  onClick={() => handleComboToggle(item)}
                                >
                                  <span
                                    className={`toggle-track ${item.state !== 'sold-out' ? 'is-on' : ''} ${comboTogglingId === item.id ? 'is-loading' : ''}`}
                                  >
                                    {comboTogglingId === item.id && (
                                      <Loader2 size={13} className="spin" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#fff', zIndex: 1 }} />
                                    )}
                                  </span>
                                  <span className={`toggle-label ${item.state === 'sold-out' ? 'off' : 'on'}`}>
                                    {item.state === 'sold-out' ? 'HẾT HÀNG' : 'ĐANG BÁN'}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="menu-pagination">
                    <p className="menu-pagination-summary">
                      {filteredModalItems.length === 0
                        ? '0 mục'
                        : `Hiển thị ${(menuPage - 1) * MENU_PAGE_SIZE + 1}–${Math.min(menuPage * MENU_PAGE_SIZE, filteredModalItems.length)} trên ${filteredModalItems.length} ${menuModalTab === 'menu' ? 'món ăn' : menuModalTab === 'combo' ? 'combo' : 'gói buffet'}`}
                    </p>
                    <div className="menu-pagination-controls">
                      <button
                        type="button"
                        className="menu-page-nav menu-page-nav--prev"
                        disabled={menuPage <= 1}
                        onClick={() => setMenuPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft size={14} />
                        <span>Trước</span>
                      </button>
                      <div className="menu-page-numbers" role="navigation" aria-label="Chọn trang">
                        {menuModalPageNumbers.map((entry, idx) =>
                          entry === 'ellipsis' ? (
                            <span key={`e-${idx}`} className="menu-page-ellipsis">
                              …
                            </span>
                          ) : (
                            <button
                              key={entry}
                              type="button"
                              className={`menu-page-num ${menuPage === entry ? 'active' : ''}`}
                              onClick={() => setMenuPage(entry)}
                            >
                              {entry}
                            </button>
                          )
                        )}
                      </div>
                      <button
                        type="button"
                        className="menu-page-nav menu-page-nav--next"
                        disabled={menuPage >= modalTotalPages}
                        onClick={() => setMenuPage((p) => Math.min(modalTotalPages, p + 1))}
                      >
                        <span>Sau</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="inv-modal-foot">
              <button type="button" className="ghost" onClick={() => setShowMenuModal(false)}>Đóng</button>
              <button
                type="button"
                className="primary"
                disabled={menuCatalogLoading}
                onClick={async () => {
                  await fetchMenuCatalog();
                  setShowMenuModal(false);
                }}
              >
                <Check size={14} />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="inventory-footer">
        
        <div>
          <a href="#support">Hỗ trợ</a>
          <a href="#docs">Tài liệu hệ thống</a>
        </div>
      </footer>
    </div>
  );
};

export default ManagerInventoryPage;
