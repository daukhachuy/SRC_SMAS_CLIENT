import React from 'react';

const inventory = [
  { item: 'Tôm sú', stock: '28 kg', min: '20 kg', supplier: 'Hải Sản BlueSea', status: 'Ổn định' },
  { item: 'Cá hồi', stock: '12 kg', min: '15 kg', supplier: 'Nordic Fish', status: 'Sắp hết' },
  { item: 'Rau củ mix', stock: '40 kg', min: '25 kg', supplier: 'Green Farm', status: 'Ổn định' },
  { item: 'Than nướng', stock: '8 bao', min: '10 bao', supplier: 'BBQ Fuel', status: 'Cần đặt gấp' }
];

const AdminInventoryPage = () => {
  return (
    <div className="admin-page-grid">
      <div className="admin-page-header">
        <h1>Quản lý kho hàng</h1>
        <p>Kiểm soát tồn kho, ngưỡng cảnh báo và lịch nhập hàng từ nhà cung cấp.</p>
      </div>

      <article className="admin-card">
        <div className="admin-card-head">
          <h2>Vật tư và nguyên liệu</h2>
          <button className="admin-secondary-btn">Tạo phiếu nhập</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mặt hàng</th>
                <th>Tồn kho</th>
                <th>Mức tối thiểu</th>
                <th>Nhà cung cấp</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((i) => (
                <tr key={i.item}>
                  <td>{i.item}</td>
                  <td>{i.stock}</td>
                  <td>{i.min}</td>
                  <td>{i.supplier}</td>
                  <td>
                    <span className={`admin-pill ${i.status === 'Ổn định' ? 'done' : 'pending'}`}>
                      {i.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};

export default AdminInventoryPage;
