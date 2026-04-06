// TableQrListPage.js
// Hiển thị danh sách tất cả các bàn, bấm vào từng bàn sẽ hiện QR code
import React, { useEffect, useState } from 'react';
import { getWaiterTables } from '../../api/waiterApiTable';
import TableQRCode from '../../components/TableQRCode';

const TableQrListPage = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div style={{ maxWidth: 900, margin: '32px auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Danh sách bàn & QR Code</h2>
      {loading ? (
        <div>Đang tải danh sách bàn...</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
          {tables.map((table) => (
            <div
              key={table.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 12,
                padding: 18,
                minWidth: 120,
                textAlign: 'center',
                background: selectedTable?.id === table.id ? '#fff7ed' : '#fff',
                boxShadow: selectedTable?.id === table.id ? '0 2px 12px #ffb26b33' : '0 1px 4px #0001',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onClick={() => setSelectedTable(table)}
            >
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Bàn {table.name}</div>
              <div style={{ color: '#888', fontSize: 14 }}>{table.seats} ghế</div>
              <div style={{ marginTop: 8, color: '#f5a623', fontWeight: 600 }}>{table.status === 'AVAILABLE' ? 'Bàn trống' : 'Đang có khách'}</div>
            </div>
          ))}
        </div>
      )}
      {selectedTable && (
        <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center' }}>
          <TableQRCode qrValue={selectedTable.qrCode} tableName={selectedTable.name} />
        </div>
      )}
    </div>
  );
};

export default TableQrListPage;
