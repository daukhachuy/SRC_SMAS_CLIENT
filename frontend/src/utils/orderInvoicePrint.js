/**
 * In / xuất hóa đơn (cửa sổ mới + window.print — có thể lưu PDF).
 */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function fmtInvoiceMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `${x.toLocaleString('vi-VN')} đ`;
}

const DEFAULT_RESTAURANT =
  (typeof process !== 'undefined' && process.env?.REACT_APP_RESTAURANT_NAME) || 'NHÀ HÀNG SMAS';

function openPrintWindow(title, innerHtml) {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=820,height=960');
  if (!w) {
    window.alert('Trình duyệt đã chặn cửa sổ mới. Vui lòng cho phép popup để in hóa đơn.');
    return;
  }
  const doc = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #111; margin: 24px; font-size: 13px; }
    h1 { font-size: 18px; margin: 0 0 4px; text-align: center; }
    .sub { text-align: center; color: #555; font-size: 12px; margin-bottom: 16px; }
    .meta { margin-bottom: 14px; line-height: 1.55; }
    .meta strong { color: #333; }
    table.items { width: 100%; border-collapse: collapse; margin: 12px 0; }
    table.items th, table.items td { border: 1px solid #ccc; padding: 6px 8px; }
    table.items th { background: #f3f4f6; text-align: left; font-size: 12px; }
    table.items td.n, table.items th.n { text-align: right; }
    table.items td.c { text-align: center; }
    .totals { max-width: 320px; margin-left: auto; margin-top: 10px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e5e7eb; }
    .totals .grand { font-weight: 800; font-size: 15px; border-bottom: none; margin-top: 6px; color: #c2410c; }
    .foot { margin-top: 20px; font-size: 11px; color: #64748b; text-align: center; }
    @media print {
      body { margin: 12px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
${innerHtml}
  <p class="foot">Hóa đơn tạm tính — không thay thế hóa đơn GTGT theo quy định thuế (nếu có).</p>
</body>
</html>`;
  w.document.open();
  w.document.write(doc);
  w.document.close();
  w.focus();
  setTimeout(() => {
    try {
      w.print();
    } catch {
      /* ignore */
    }
  }, 200);
}

/**
 * Hóa đơn đơn hàng (giao hàng / mang đi / tại chỗ).
 * @param {object} p
 * @param {string} [p.restaurantName]
 * @param {string} [p.invoiceTitle]
 * @param {string} p.orderCode
 * @param {string} [p.orderTypeLabel]
 * @param {string} [p.dateTime]
 * @param {string} [p.buyerName]
 * @param {string} [p.buyerPhone]
 * @param {string} [p.buyerAddress]
 * @param {string} [p.tableInfo]
 * @param {{ name: string, qty: number, unitPrice: number, lineTotal: number }[]} p.lines
 * @param {number} p.subtotal
 * @param {number} [p.shippingFee]
 * @param {number} [p.discountAmount]
 * @param {number} [p.vatAmount]
 * @param {number} p.grandTotal
 * @param {string} [p.note]
 */
export function printSalesInvoice(p) {
  const restaurant = escapeHtml(p.restaurantName || DEFAULT_RESTAURANT);
  const invTitle = escapeHtml(p.invoiceTitle || 'HÓA ĐƠN BÁN HÀNG');
  const code = escapeHtml(p.orderCode || '—');
  const typeLbl = p.orderTypeLabel ? escapeHtml(p.orderTypeLabel) : '';
  const dt = escapeHtml(p.dateTime || '—');

  const lines = (p.lines || []).map((l) => {
    const name = escapeHtml(l.name || '—');
    const qty = Number(l.qty) || 0;
    const unit = fmtInvoiceMoney(l.unitPrice);
    const line = fmtInvoiceMoney(l.lineTotal);
    return `<tr><td>${name}</td><td class="c">${qty}</td><td class="n">${unit}</td><td class="n">${line}</td></tr>`;
  }).join('');

  const ship = Number(p.shippingFee) || 0;
  const disc = Number(p.discountAmount) || 0;
  const vat = Number(p.vatAmount) || 0;

  const rowsTotals = [];
  rowsTotals.push(`<div><span>Tạm tính</span><span>${fmtInvoiceMoney(p.subtotal)}</span></div>`);
  if (vat > 0) {
    rowsTotals.push(`<div><span>VAT (10%)</span><span>${fmtInvoiceMoney(vat)}</span></div>`);
  }
  if (ship > 0) {
    rowsTotals.push(`<div><span>Phí vận chuyển</span><span>${fmtInvoiceMoney(ship)}</span></div>`);
  }
  if (disc > 0) {
    rowsTotals.push(`<div><span>Giảm giá</span><span>-${fmtInvoiceMoney(disc)}</span></div>`);
  }
  rowsTotals.push(
    `<div class="grand"><span>TỔNG CỘNG</span><span>${fmtInvoiceMoney(p.grandTotal)}</span></div>`
  );

  const buyerBlock = `
    <div class="meta">
      <div><strong>Khách hàng:</strong> ${escapeHtml(p.buyerName || '—')}</div>
      <div><strong>Số điện thoại:</strong> ${escapeHtml(p.buyerPhone || '—')}</div>
      <div><strong>Địa chỉ:</strong> ${escapeHtml(p.buyerAddress || '—')}</div>
      ${p.tableInfo ? `<div><strong>Bàn / khu:</strong> ${escapeHtml(p.tableInfo)}</div>` : ''}
      ${p.note ? `<div><strong>Ghi chú:</strong> ${escapeHtml(p.note)}</div>` : ''}
    </div>`;

  const inner = `
    <h1>${restaurant}</h1>
    <div class="sub">${invTitle}</div>
    <div class="meta">
      <div><strong>Mã đơn:</strong> #${code}</div>
      ${typeLbl ? `<div><strong>Loại đơn:</strong> ${typeLbl}</div>` : ''}
      <div><strong>Thời gian:</strong> ${dt}</div>
    </div>
    ${buyerBlock}
    <table class="items">
      <thead><tr><th>Tên món</th><th class="c">SL</th><th class="n">Đơn giá</th><th class="n">Thành tiền</th></tr></thead>
      <tbody>${lines || '<tr><td colspan="4">Không có dòng món.</td></tr>'}</tbody>
    </table>
    <div class="totals">${rowsTotals.join('')}</div>
  `;

  const winTitle = `${p.invoiceTitle || 'Hóa đơn bán hàng'} #${p.orderCode || ''}`;
  openPrintWindow(winTitle, inner);
}

/**
 * Hóa đơn / phiếu thanh toán đặt sự kiện.
 */
export function printEventBookingInvoice(p) {
  const restaurant = escapeHtml(p.restaurantName || DEFAULT_RESTAURANT);
  const code = escapeHtml(p.bookingCode || '—');
  const evType = escapeHtml(p.eventTypeName || 'Sự kiện');
  const dt = escapeHtml(p.dateTime || '—');

  const menuRows = (p.menuLines || [])
    .map(
      (m) =>
        `<tr><td>${escapeHtml(m.name)}</td><td class="c">${escapeHtml(String(m.qty ?? ''))}</td><td class="n">${fmtInvoiceMoney(m.amount)}</td></tr>`
    )
    .join('');

  const svcRows = (p.serviceLines || [])
    .map((s) => `<tr><td colspan="2">${escapeHtml(s.name)}</td><td class="n">${fmtInvoiceMoney(s.amount)}</td></tr>`)
    .join('');

  const parts = [];
  if (p.subtotal != null && Number(p.subtotal) > 0) {
    parts.push(`<div><span>Tạm tính</span><span>${fmtInvoiceMoney(p.subtotal)}</span></div>`);
  }
  if (p.vat != null && Number(p.vat) > 0) {
    parts.push(`<div><span>VAT</span><span>${fmtInvoiceMoney(p.vat)}</span></div>`);
  }
  parts.push(`<div class="grand"><span>TỔNG CHI PHÍ</span><span>${fmtInvoiceMoney(p.grandTotal)}</span></div>`);

  const inner = `
    <h1>${restaurant}</h1>
    <div class="sub">PHIẾU ĐẶT SỰ KIỆN / TẠM TÍNH</div>
    <div class="meta">
      <div><strong>Mã:</strong> #${code}</div>
      <div><strong>Loại sự kiện:</strong> ${evType}</div>
      <div><strong>Thời gian tổ chức:</strong> ${dt}</div>
      ${p.tables ? `<div><strong>Số bàn:</strong> ${escapeHtml(String(p.tables))}</div>` : ''}
    </div>
    <div class="meta">
      <div><strong>Khách hàng:</strong> ${escapeHtml(p.buyerName || '—')}</div>
      <div><strong>SĐT:</strong> ${escapeHtml(p.buyerPhone || '—')}</div>
      <div><strong>Email:</strong> ${escapeHtml(p.buyerEmail || '—')}</div>
      ${p.note ? `<div><strong>Ghi chú:</strong> ${escapeHtml(p.note)}</div>` : ''}
    </div>
    <p style="font-weight:700;margin:14px 0 6px;">Thực đơn</p>
    <table class="items">
      <thead><tr><th>Món</th><th class="c">SL</th><th class="n">Thành tiền</th></tr></thead>
      <tbody>${menuRows || '<tr><td colspan="3">—</td></tr>'}</tbody>
    </table>
    ${svcRows ? `<p style="font-weight:700;margin:14px 0 6px;">Dịch vụ</p><table class="items"><tbody>${svcRows}</tbody></table>` : ''}
    <div class="totals">${parts.join('')}</div>
  `;

  openPrintWindow(`Phiếu sự kiện #${p.bookingCode || ''}`, inner);
}
