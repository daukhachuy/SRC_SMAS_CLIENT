import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, X, Copy, Share2, AlertCircle, Loader } from 'lucide-react';
import { openTable } from '../../api/tableSessionApi';
import '../../styles/QrScannerPage.css';

/**
 * QrScannerPage - Trang quét QR code cho waiter
 * - Waiter quét QR code của bàn để mở bàn
 * - Hoặc chọn bàn từ danh sách
 * - Nhận được QR ticket để chia sẻ cho khách hàng
 */
const QrScannerPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [openedTable, setOpenedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [selectedTable, setSelectedTable] = useState('');
  
  // Danh sách bàn mẫu (sẽ được thay thế bằng API)
  const [tables] = useState([
    { tableCode: 'TABLE-01', tableId: 1 },
    { tableCode: 'TABLE-02', tableId: 2 },
    { tableCode: 'TABLE-03', tableId: 3 },
    { tableCode: 'TABLE-04', tableId: 4 },
    { tableCode: 'TABLE-05', tableId: 5 },
  ]);

  // Lấy thông tin user đang đăng nhập
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user.id || user.userId;
    } catch (error) {
      console.error('Cannot parse user info:', error);
      return null;
    }
  };

  // Khởi động camera để quét QR
  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Trong thực tế, cần thư viện như jsQR hoặc quagga để decode QR
      // Đây là ví dụ đơn giản
      console.log('📸 Camera started. Please scan QR code.');
    } catch (err) {
      setError('Không thể truy cập camera: ' + err.message);
      setScanning(false);
    }
  };

  // Dừng camera
  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  // Mở bàn
  const handleOpenTable = async (tableCode) => {
    try {
      setLoading(true);
      setError(null);

      const userId = getCurrentUserId();
      if (!userId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      const response = await openTable(tableCode, userId);

      // Tạo link chia sẻ cho khách
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/table/${tableCode}/session?ticket=${response.qrTicket}`;

      setOpenedTable({
        tableCode,
        sessionId: response.sessionId,
        qrTicket: response.qrTicket,
      });
      setShareLink(link);

      if (scanning) {
        stopScanning();
      }
    } catch (err) {
      setError(err.message || 'Không thể mở bàn. Vui lòng thử lại.');
      console.error('Error opening table:', err);
    } finally {
      setLoading(false);
    }
  };

  // Copy link vào clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      alert('Đã sao chép link!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Không thể sao chép. Vui lòng thử lại.');
    }
  };

  // Chia sẻ link (nếu hỗ trợ)
  const shareLink_fn = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gọi món tại bàn',
          text: `Vui lòng quét mã QR hoặc click vào link để gọi món`,
          url: shareLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  // Reset
  const handleReset = () => {
    setOpenedTable(null);
    setShareLink(null);
    setSelectedTable('');
  };

  return (
    <div className="qr-scanner-page">
      <div className="qr-scanner-container">
        <h1 className="page-title">
          <QrCode size={28} />
          Mở bàn
        </h1>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="btn-close">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Chưa mở bàn - Chọn phương thức */}
        {!openedTable && (
          <div className="scanner-methods">
            {/* Phương thức 1: Quét QR */}
            <div className="method-card">
              <h3>Quét mã QR bàn</h3>
              {!scanning ? (
                <button
                  className="btn btn-primary"
                  onClick={startScanning}
                  disabled={loading}
                >
                  <QrCode size={20} />
                  {loading ? 'Đang xử lý...' : 'Bắt đầu quét'}
                </button>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="qr-video"
                    autoPlay
                    playsInline
                  />
                  <button className="btn btn-secondary" onClick={stopScanning}>
                    <X size={20} />
                    Dừng quét
                  </button>
                </>
              )}
            </div>

            {/* Phương thức 2: Chọn bàn từ danh sách */}
            <div className="method-card">
              <h3>Chọn bàn từ danh sách</h3>
              <select
                className="table-select"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Chọn bàn --</option>
                {tables.map((table) => (
                  <option key={table.tableCode} value={table.tableCode}>
                    {table.tableCode}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={() => handleOpenTable(selectedTable)}
                disabled={!selectedTable || loading}
              >
                {loading ? (
                  <>
                    <Loader size={20} className="spinner" />
                    Đang mở bàn...
                  </>
                ) : (
                  'Mở bàn'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Đã mở bàn - Chia sẻ link */}
        {openedTable && (
          <div className="opened-table-section">
            <div className="success-box">
              <div className="success-icon">✓</div>
              <h2>Bàn {openedTable.tableCode} đã được mở</h2>
              <p>Chia sẻ link sau với khách để gọi món:</p>
            </div>

            {/* Hiển thị link chia sẻ */}
            <div className="share-section">
              <div className="share-link-box">
                <input
                  type="text"
                  className="share-link-input"
                  value={shareLink}
                  readOnly
                />
                <button
                  className="btn-copy"
                  onClick={copyToClipboard}
                  title="Sao chép link"
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="share-actions">
                <button className="btn btn-primary" onClick={shareLink_fn}>
                  <Share2 size={18} />
                  Chia sẻ
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                  Mở bàn khác
                </button>
              </div>
            </div>

            {/* QR Ticket Info */}
            <div className="ticket-info">
              <p className="label">Mã ticket:</p>
              <div className="ticket-code">{openedTable.qrTicket.substring(0, 20)}...</div>
              <p className="label">Session ID:</p>
              <div className="session-id">{openedTable.sessionId}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrScannerPage;
