// TableQRCode.js
// Hiển thị QR code cho một bàn cụ thể
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * @param {Object} props
 * @param {string} qrValue - Giá trị QR code (nên là URL hoặc mã bàn)
 * @param {string|number} tableName - Tên hoặc số bàn
 * @param {number} [size=180] - Kích thước QR code
 */
const TableQRCode = ({ qrValue, tableName, size = 180 }) => {
  if (!qrValue) return <div>Không có mã QR cho bàn này.</div>;
  return (
    <div style={{ textAlign: 'center', padding: 16 }}>
      <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 18 }}>QR Bàn {tableName}</div>
      <QRCodeCanvas value={qrValue} size={size} />
      <div style={{ marginTop: 8, color: '#888', fontSize: 14 }}>
        Quét mã để gọi món & thanh toán
      </div>
    </div>
  );
};

export default TableQRCode;
