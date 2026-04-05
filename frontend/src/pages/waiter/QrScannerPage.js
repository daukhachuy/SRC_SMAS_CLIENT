import React, { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';
import { getWaiterTables } from '../../api/waiterApiTable';
import TableQRCode from '../../components/TableQRCode';
import '../../styles/QrScannerPage.css';

/**
 * QrScannerPage - Trang quét QR code cho waiter
 * - Waiter quét QR code của bàn để mở bàn
 * - Hoặc chọn bàn từ danh sách
 * - Nhận được QR ticket để chia sẻ cho khách hàng
 */
const QrScannerPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchTables() {
      setLoading(true);
      try {
        const data = await getWaiterTables();
        setTables(data);
      } catch (err) {
        setTables([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTables();
  }, []);

  return (
    <div className="qr-scanner-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ffe0b2 0%, #ffb26b 100%)', padding: '40px 0' }}>
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '32px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          <QrCode size={32} color="#ff9800" />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#ff9800', letterSpacing: 1 }}>QR Bàn</h1>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#ff9800', fontWeight: 600 }}>Đang tải danh sách bàn...</div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 28,
              justifyItems: 'center',
              marginBottom: 24,
            }}>
              {tables.slice((currentPage-1)*16, currentPage*16).map(table => (
                <div key={table.id} style={{
                  background: '#fff',
                  borderRadius: 18,
                  boxShadow: '0 4px 16px #ffb26b33',
                  padding: 18,
                  minWidth: 180,
                  maxWidth: 210,
                  textAlign: 'center',
                  marginBottom: 8,
                  border: '2px solid #ffb26b',
                  transition: 'box-shadow 0.2s, border 0.2s',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 24px #ff980055'}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 16px #ffb26b33'}
                >
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, color: '#ff9800', letterSpacing: 0.5 }}>Bàn {table.name}</div>
                  <div style={{ color: '#ff9800cc', fontSize: 14, marginBottom: 4 }}>{table.seats} ghế</div>
                  <TableQRCode qrValue={table.qrCode} tableName={table.name} size={100} />
                  <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>Quét mã để gọi món & thanh toán</div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {tables.length > 16 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} style={{ padding: '7px 18px', borderRadius: 8, border: '1.5px solid #ff9800', background: currentPage === 1 ? '#ffe0b2' : '#fff', color: '#ff9800', fontWeight: 700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 15 }}>Trước</button>
                <span style={{ fontWeight: 700, color: '#ff9800', fontSize: 17 }}>Trang {currentPage} / {Math.ceil(tables.length/16)}</span>
                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(tables.length/16), p+1))} disabled={currentPage === Math.ceil(tables.length/16)} style={{ padding: '7px 18px', borderRadius: 8, border: '1.5px solid #ff9800', background: currentPage === Math.ceil(tables.length/16) ? '#ffe0b2' : '#fff', color: '#ff9800', fontWeight: 700, cursor: currentPage === Math.ceil(tables.length/16) ? 'not-allowed' : 'pointer', fontSize: 15 }}>Sau</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QrScannerPage;
