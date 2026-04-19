import instance from './axiosInstance';

/**
 * GET /api/pdf-export/invoice/{ordercode}
 * GET /api/pdf-export/contract/{contraccode}  (đúng theo Swagger BE)
 */

function triggerBlobDownload(blob, filename) {
  const safeName = String(filename || 'export.pdf').replace(/[/\\?%*:|"<>]/g, '_');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

/** Đọc message lỗi khi response là Blob (JSON/text) */
export async function getPdfErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  if (data instanceof Blob) {
    const ct = String(error.response.headers['content-type'] || '');
    if (ct.includes('application/json') || ct.includes('text/plain') || data.size < 4096) {
      try {
        const text = await data.text();
        try {
          const j = JSON.parse(text);
          return j.message || j.detail || j.title || String(text).slice(0, 400);
        } catch {
          return text ? String(text).slice(0, 400) : `Lỗi HTTP ${status || ''}`.trim();
        }
      } catch {
        return `Lỗi HTTP ${status || 'mạng'}`;
      }
    }
  }
  if (data && typeof data === 'object' && typeof data.message === 'string') return data.message;
  if (typeof error?.message === 'string') return error.message;
  return status ? `Lỗi HTTP ${status}` : 'Không tải được PDF.';
}

async function ensurePdfBlob(response) {
  const blob = response.data;
  if (!(blob instanceof Blob)) {
    throw new Error('Phản hồi không phải file PDF.');
  }
  const ct = String(response.headers['content-type'] || '').toLowerCase();
  if (ct.includes('application/json') || (blob.size < 500 && ct.includes('text'))) {
    const text = await blob.text();
    let msg = 'Server trả lỗi thay vì PDF.';
    try {
      const j = JSON.parse(text);
      msg = j.message || j.detail || j.title || msg;
    } catch {
      if (text) msg = String(text).slice(0, 400);
    }
    throw new Error(msg);
  }
  return blob;
}

/**
 * @param {string} orderCode — mã đơn (orderCode)
 */
export async function downloadInvoicePdf(orderCode) {
  const code = String(orderCode || '').trim();
  if (!code) throw new Error('Thiếu mã đơn hàng.');
  const res = await instance.get(`pdf-export/invoice/${encodeURIComponent(code)}`, {
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf, application/octet-stream, */*',
    },
  });
  const blob = await ensurePdfBlob(res);
  triggerBlobDownload(blob, `Hoa_don_${code}.pdf`);
}

/**
 * @param {string} contractCode — mã hợp đồng (theo route Swagger: contraccode)
 */
export async function downloadContractPdf(contractCode) {
  const code = String(contractCode || '').trim();
  if (!code) throw new Error('Thiếu mã hợp đồng.');
  const res = await instance.get(`pdf-export/contract/${encodeURIComponent(code)}`, {
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf, application/octet-stream, */*',
    },
  });
  const blob = await ensurePdfBlob(res);
  triggerBlobDownload(blob, `Hop_dong_${code}.pdf`);
}
