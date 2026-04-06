/**
 * Admin Dashboard API — Swagger: /api/admin/dashboard/*
 * Base: REACT_APP_API_URL hoặc https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api
 */

const AZURE_API = 'https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api';

function getApiRoot() {
  const env = (process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '');
  return env || AZURE_API;
}

function getAuthHeaders() {
  const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  const h = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function authGet(path, query) {
  const root = getApiRoot();
  let url = `${root}${path.startsWith('/') ? path : `/${path}`}`;
  if (query && typeof query === 'object') {
    const sp = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== '') sp.set(k, String(v));
    });
    const q = sp.toString();
    if (q) url += `?${q}`;
  }
  const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message || j.title || msg;
    } catch (_) {
      try {
        msg = (await res.text()) || msg;
      } catch (_) {}
    }
    throw new Error(msg);
  }
  return res.json();
}

const num = (v) => {
  if (v == null || v === '') return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).replace(/[^\d.-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const arrNum = (a) => (Array.isArray(a) ? a.map((x) => num(x)) : []);

/** Định dạng số lớn → "1.2 tỷ VND" / "450tr VND" */
export function formatVndDisplay(value) {
  const n = num(value);
  if (n >= 1e9) {
    const t = n / 1e9;
    const s = t >= 10 ? t.toFixed(0) : t.toFixed(1).replace(/\.0$/, '');
    return `${s} tỷ VND`;
  }
  if (n >= 1e6) return `${Math.round(n / 1e6)}tr VND`;
  if (n >= 1e3) return `${n.toLocaleString('vi-VN')} đ`;
  return `${n.toLocaleString('vi-VN')} đ`;
}

const DEFAULT_SPARK = {
  revenue: [10, 15, 8, 25, 18, 22],
  costs: [20, 10, 25, 15, 30, 20],
  contracts: [5, 20, 15, 25, 10, 30],
  customers: [12, 18, 14, 28, 20, 25],
};

/**
 * Chuẩn hóa GET /api/admin/dashboard/summary
 */
export function normalizeSummary(raw) {
  /** Khi raw == null (lỗi mạng) — không dùng số mẫu 12/156 */
  const isMissing = raw == null;
  const r = isMissing ? {} : raw?.data ?? raw?.Data ?? raw ?? {};
  const pick = (...keys) => {
    for (const k of keys) {
      if (r[k] != null && r[k] !== '') return r[k];
    }
    return null;
  };

  const totalRevenue = num(pick('totalRevenue', 'TotalRevenue', 'total_revenue', 'revenue'));
  const warehouseCosts = num(
    pick(
      'warehouseCosts',
      'WarehouseCosts',
      'warehouse_costs',
      'warehouseCost',
      'WarehouseCost',
      'warehouse_cost',
      'importCosts',
      'import_costs',
      'cost'
    )
  );
  /** Swagger: newContracts, newCustomers — thêm PascalCase cho JSON .NET */
  const ncRaw = pick('newContracts', 'NewContracts', 'new_contracts');
  const ncuRaw = pick('newCustomers', 'NewCustomers', 'new_customers');
  const newContracts = isMissing ? null : num(ncRaw ?? 0);
  const newCustomers = isMissing ? null : num(ncuRaw ?? 0);

  const rs = arrNum(pick('revenueSparkline', 'revenue_sparkline', 'revenueTrend', 'revenue_trend'));
  const cs = arrNum(pick('costsSparkline', 'costs_sparkline', 'costSparkline', 'warehouseSparkline'));
  const cts = arrNum(pick('contractsSparkline', 'contracts_sparkline'));
  const cus = arrNum(pick('customersSparkline', 'customers_sparkline'));
  const revenueSparkline = rs.length ? rs : DEFAULT_SPARK.revenue;
  const costsSparkline = cs.length ? cs : DEFAULT_SPARK.costs;
  const contractsSparkline = cts.length ? cts : DEFAULT_SPARK.contracts;
  const customersSparkline = cus.length ? cus : DEFAULT_SPARK.customers;

  const displayRevenue =
    pick('totalRevenueDisplay', 'total_revenue_display') || formatVndDisplay(totalRevenue);
  const displayCosts =
    pick('warehouseCostsDisplay', 'warehouse_costs_display', 'warehouseCostDisplay') ||
    formatVndDisplay(warehouseCosts);

  return {
    totalRevenueDisplay: displayRevenue,
    warehouseCostsDisplay: displayCosts,
    newContracts,
    newCustomers,
    revenueSparkline: revenueSparkline.length ? revenueSparkline : DEFAULT_SPARK.revenue,
    costsSparkline: costsSparkline.length ? costsSparkline : DEFAULT_SPARK.costs,
    contractsSparkline: contractsSparkline.length ? contractsSparkline : DEFAULT_SPARK.contracts,
    customersSparkline: customersSparkline.length ? customersSparkline : DEFAULT_SPARK.customers,
  };
}

/**
 * Chuẩn hóa GET /api/admin/dashboard/revenue-chart
 * Swagger: data là mảng [{ month, revenue, cost }] (có thể PascalCase)
 */
export function normalizeRevenueChart(raw) {
  const empty = () => ({ labels: [], revenues: [], costs: [] });
  if (raw == null) return empty();

  const d = raw?.data ?? raw?.Data ?? raw;

  if (raw.success === true && (d == null || (Array.isArray(d) && d.length === 0))) {
    return empty();
  }

  let list = null;
  if (Array.isArray(d)) list = d;
  else if (d && typeof d === 'object') {
    if (Array.isArray(d.items)) list = d.items;
    else if (Array.isArray(d.$values)) list = d.$values;
  }

  if (Array.isArray(list) && list.length > 0) {
    const labels = list.map((x) => String(x.month ?? x.Month ?? x.label ?? x.Label ?? x.name ?? x.Name ?? ''));
    const revenues = list.map((x) => num(x.revenue ?? x.Revenue ?? x.doanhThu ?? x.value ?? x.Value));
    const costs = list.map((x) => num(x.cost ?? x.Cost ?? x.chiPhi ?? x.expense ?? x.Expense));
    return { labels, revenues, costs };
  }

  if (Array.isArray(list) && list.length === 0) return empty();

  const r = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  if (Array.isArray(r.items) && r.items.length > 0) {
    const labels = r.items.map((x) => String(x.month ?? x.Month ?? x.label ?? x.name ?? ''));
    const revenues = r.items.map((x) => num(x.revenue ?? x.Revenue ?? x.doanhThu ?? x.value));
    const costs = r.items.map((x) => num(x.cost ?? x.Cost ?? x.chiPhi ?? x.expense));
    return { labels, revenues, costs };
  }

  const labels = r.labels || r.months || [];
  const revArr = arrNum(r.revenues || r.revenue || r.doanhThu);
  const costArr = arrNum(r.costs || r.cost || r.chiPhi);
  if (labels.length && (revArr.length || costArr.length)) {
    const n = Math.max(labels.length, revArr.length, costArr.length);
    const L = [];
    const R = [];
    const C = [];
    for (let i = 0; i < n; i++) {
      L.push(String(labels[i] || `T${i + 1}`));
      R.push(revArr[i] ?? 0);
      C.push(costArr[i] ?? 0);
    }
    return { labels: L, revenues: R, costs: C };
  }

  return empty();
}

export const ORDER_STRUCTURE_LABELS = ['Tại chỗ', 'Mang về', 'Giao hàng', 'Sự kiện'];

/**
 * Chuẩn hóa GET /api/admin/dashboard/order-structure
 * Swagger: data { dineIn, takeAway, delivery, event, total }
 */
export function normalizeOrderStructure(raw) {
  const empty = () => ({
    labels: [...ORDER_STRUCTURE_LABELS],
    values: [0, 0, 0, 0],
    total: 0,
  });
  if (raw == null) return empty();

  const d = raw?.data ?? raw?.Data ?? raw;
  const r = d && typeof d === 'object' && !Array.isArray(d) ? d : {};

  if (Array.isArray(r.items) && r.items.length > 0) {
    const labels = r.items.map((x) => x.label || x.name || x.type || '');
    const values = r.items.map((x) => num(x.value ?? x.count ?? x.percent));
    const total = values.reduce((a, b) => a + b, 0);
    return { labels, values, total };
  }
  if (Array.isArray(r.labels) && Array.isArray(r.values)) {
    const values = r.values.map((v) => num(v));
    const total = values.reduce((a, b) => a + b, 0);
    return { labels: r.labels, values, total };
  }

  const v1 = num(r.dineIn ?? r.DineIn ?? r.taiCho ?? r.tai_cho ?? r.onSite);
  const v2 = num(r.takeAway ?? r.TakeAway ?? r.mangVe ?? r.mang_ve ?? r.takeaway);
  const v3 = num(r.delivery ?? r.Delivery ?? r.giaoHang ?? r.giao_hang);
  const v4 = num(r.event ?? r.Event ?? r.suKien ?? r.su_kien);
  const sum = v1 + v2 + v3 + v4;
  const totalRaw = r.total ?? r.Total;
  const total = totalRaw != null && totalRaw !== '' ? num(totalRaw) : sum;

  return {
    labels: [...ORDER_STRUCTURE_LABELS],
    values: [v1, v2, v3, v4],
    total,
  };
}

function normalizeTxStatus(s) {
  const t = String(s || '').toLowerCase();
  if (t.includes('hủy') || t.includes('cancel')) return { key: 'cancelled', label: 'Đã hủy' };
  if (t.includes('chờ') || t.includes('pending') || t.includes('thanh toán')) return { key: 'pending', label: 'Chờ thanh toán' };
  return { key: 'done', label: 'Hoàn thành' };
}

/**
 * Chuẩn hóa GET /api/admin/dashboard/warehouse-transactions
 */
export function normalizeWarehouseTransactions(raw) {
  const r = raw?.data ?? raw ?? {};
  const list = Array.isArray(r.transactions)
    ? r.transactions
    : Array.isArray(r.items)
      ? r.items
      : Array.isArray(r)
        ? r
        : r.$values || [];
  if (!list.length) {
    return [
      { code: '#TK-9021', supplier: 'Nông trại xanh Đà Lạt', amount: 45_000_000, statusKey: 'done', statusLabel: 'Hoàn thành' },
      { code: '#TK-8942', supplier: 'Thủy hải sản Miền Đông', amount: 32_500_000, statusKey: 'pending', statusLabel: 'Chờ thanh toán' },
      { code: '#TK-8851', supplier: 'CP Food Logistics', amount: 12_800_000, statusKey: 'done', statusLabel: 'Hoàn thành' },
      { code: '#TK-8840', supplier: 'Rượu vang Hoàng Gia', amount: 85_200_000, statusKey: 'cancelled', statusLabel: 'Đã hủy' },
      { code: '#TK-8711', supplier: 'Công ty Bao bì Hợp Nhất', amount: 5_400_000, statusKey: 'done', statusLabel: 'Hoàn thành' },
    ];
  }
  return list.map((row) => {
    const code =
      row.transactionCode ||
      row.transactionId ||
      row.code ||
      row.maGiaoDich ||
      `#TK-${row.id ?? ''}`;
    const supplier = row.supplierName || row.supplier || row.nhaCungCap || '';
    const amount = num(row.totalAmount ?? row.total ?? row.amount ?? row.tongTien);
    const st = normalizeTxStatus(row.status || row.trangThai);
    return {
      code,
      supplier,
      amount,
      statusKey: st.key,
      statusLabel: row.statusLabel || row.trangThai || st.label,
    };
  });
}

/** @param {{ month?: number; year?: number }} [opts] — mặc định tháng/năm hiện tại (Swagger: month, year bắt buộc) */
export async function fetchDashboardSummary(opts = {}) {
  const now = new Date();
  const month = opts.month ?? now.getMonth() + 1;
  const year = opts.year ?? now.getFullYear();
  const j = await authGet('/admin/dashboard/summary', { month, year });
  return normalizeSummary(j);
}

/** @param {{ months?: number; year?: number }} [opts] — Swagger: months, year */
export async function fetchRevenueChart(opts = {}) {
  const now = new Date();
  const months = opts.months ?? 6;
  const year = opts.year ?? now.getFullYear();
  const j = await authGet('/admin/dashboard/revenue-chart', { months, year });
  return normalizeRevenueChart(j);
}

/** @param {{ month?: number; year?: number }} [opts] — Swagger: month, year */
export async function fetchOrderStructure(opts = {}) {
  const now = new Date();
  const month = opts.month ?? now.getMonth() + 1;
  const year = opts.year ?? now.getFullYear();
  const j = await authGet('/admin/dashboard/order-structure', { month, year });
  return normalizeOrderStructure(j);
}

export async function fetchWarehouseTransactions() {
  const j = await authGet('/admin/dashboard/warehouse-transactions');
  return normalizeWarehouseTransactions(j);
}

/**
 * @param {{ month?: number; year?: number; chartMonths?: number }} [opts]
 * chartMonths → query `months` của GET /admin/dashboard/revenue-chart
 */
export async function fetchAdminDashboardAll(opts = {}) {
  const now = new Date();
  const year = opts.year ?? now.getFullYear();
  const chartMonths = opts.chartMonths ?? 6;
  const results = await Promise.allSettled([
    fetchDashboardSummary(opts),
    fetchRevenueChart({ months: chartMonths, year }),
    fetchOrderStructure({ month: opts.orderMonth, year: opts.orderYear }),
    fetchWarehouseTransactions(),
  ]);
  const summary = results[0].status === 'fulfilled' ? results[0].value : normalizeSummary(null);
  const revenue = results[1].status === 'fulfilled' ? results[1].value : normalizeRevenueChart(null);
  const orders = results[2].status === 'fulfilled' ? results[2].value : normalizeOrderStructure(null);
  const txs = results[3].status === 'fulfilled' ? results[3].value : normalizeWarehouseTransactions(null);
  const errors = results
    .map((r, i) => (r.status === 'rejected' ? r.reason?.message || String(r.reason) : null))
    .filter(Boolean);
  return { summary, revenue, orders, txs, errors };
}
