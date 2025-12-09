import React from 'react';
import { 
  FiHome, 
  FiUsers, 
  FiDollarSign, 
  FiPieChart, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiBell, 
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

const DashboardPage = () => {
  // Dữ liệu biểu đồ doanh thu
  const salesData = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [{
      label: 'Doanh thu',
      data: [12000000, 19000000, 15000000, 25000000, 22000000, 30000000, 28000000],
      backgroundColor: '#4F46E5',
      borderRadius: 4
    }]
  };

  // Dữ liệu biểu đồ loại món
  const categoryData = {
    labels: ['Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống', 'Khác'],
    datasets: [{
      data: [15, 40, 20, 15, 10],
      backgroundColor: [
        '#4F46E5', // Màu xanh dương
        '#10B981', // Màu xanh lá
        '#F59E0B', // Màu cam
        '#EF4444', // Màu đỏ
        '#8B5CF6'  // Màu tím
      ]
    }]
  };

  // Thống kê chính
  const stats = [
    { 
      name: 'Tổng doanh thu', 
      value: '125.400.000đ', 
      change: '+12%', 
      changeType: 'increase' 
    },
    { 
      name: 'Đơn hàng', 
      value: '1.245', 
      change: '+8%', 
      changeType: 'increase' 
    },
    { 
      name: 'Giá trị đơn TB', 
      value: '1.250.000đ', 
      change: '+5%', 
      changeType: 'increase' 
    },
    { 
      name: 'Bàn đang phục vụ', 
      value: '12/20', 
      change: '+3%', 
      changeType: 'increase' 
    }
  ];

  // Đơn hàng gần đây
  const recentOrders = [
    { 
      id: '#ORD-001', 
      customer: 'Nguyễn Văn A', 
      status: 'Hoàn thành', 
      total: '1.250.000đ', 
      time: '10 phút trước',
      statusType: 'completed'
    },
    { 
      id: '#ORD-002', 
      customer: 'Trần Thị B', 
      status: 'Đang chuẩn bị', 
      total: '850.000đ', 
      time: '25 phút trước',
      statusType: 'preparing'
    },
    { 
      id: '#ORD-003', 
      customer: 'Lê Văn C', 
      status: 'Chờ xác nhận', 
      total: '2.150.000đ', 
      time: '42 phút trước',
      statusType: 'pending'
    },
    { 
      id: '#ORD-004', 
      customer: 'Phạm Thị D', 
      status: 'Hoàn thành', 
      total: '950.000đ', 
      time: '1 giờ trước',
      statusType: 'completed'
    },
  ];

  // Hàm định dạng tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="flex items-center justify-center h-16 px-4 bg-indigo-600">
            <h1 className="text-xl font-bold text-white">Nhà Hàng VN</h1>
          </div>
          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md group">
                <FiHome className="mr-3 text-indigo-500" />
                Bảng điều khiển
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                <FiUsers className="mr-3 text-gray-400 group-hover:text-gray-500" />
                Nhân viên
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                <FiDollarSign className="mr-3 text-gray-400 group-hover:text-gray-500" />
                Bán hàng
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                <FiPieChart className="mr-3 text-gray-400 group-hover:text-gray-500" />
                Báo cáo
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                <FiSettings className="mr-3 text-gray-400 group-hover:text-gray-500" />
                Cài đặt
              </a>
            </nav>
          </div>
          <div className="p-4 border-t border-gray-200">
            <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50">
              <FiLogOut className="mr-3 text-gray-400" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Thanh điều hướng trên cùng */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button className="p-2 text-gray-500 rounded-md md:hidden hover:bg-gray-100">
                <FiMenu className="w-6 h-6" />
              </button>
              <div className="relative ml-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiSearch className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full py-2 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Tìm kiếm..."
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 rounded-full hover:bg-gray-100">
                <FiBell className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <img
                  className="w-8 h-8 rounded-full"
                  src="https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff"
                  alt="Avatar quản trị viên"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Nội dung chính */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Bảng điều khiển</h1>
            
            {/* Thống kê */}
            <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="px-4 py-5 overflow-hidden bg-white rounded-lg shadow">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        stat.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Biểu đồ */}
            <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
              <div className="p-5 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Doanh thu tuần</h3>
                <div className="mt-4 h-80">
                  <Bar
                    data={salesData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            drawBorder: false
                          },
                          ticks: {
                            callback: function(value) {
                              return new Intl.NumberFormat('vi-VN', { 
                                style: 'currency', 
                                currency: 'VND',
                                maximumFractionDigits: 0
                              }).format(value).replace('₫', '') + 'đ';
                            }
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="p-5 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Phân loại món</h3>
                <div className="flex flex-col items-center justify-center h-80">
                  <div className="w-64">
                    <Pie
                      data={categoryData}
                      options={{
                        plugins: {
                          legend: {
                            position: 'right'
                          }
                        },
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Đơn hàng gần đây */}
            <div className="mt-6">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Đơn hàng gần đây</h3>
                    <p className="mt-1 text-sm text-gray-500">Danh sách các đơn hàng mới nhất.</p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Xem tất cả
                    </button>
                  </div>
                </div>
                <div className="mt-4 -mx-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Mã đơn</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Khách hàng</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tổng tiền</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Thời gian</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Xem</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-6">
                            {order.id}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{order.customer}</td>
                          <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.statusType === 'completed' ? 'bg-green-100 text-green-800' :
                              order.statusType === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.statusType === 'completed' && <FiCheckCircle className="mr-1" />}
                              {order.statusType === 'preparing' && <FiClock className="mr-1" />}
                              {order.statusType === 'pending' && <FiAlertCircle className="mr-1" />}
                              {order.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{order.total}</td>
                          <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{order.time}</td>
                          <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                            <a href="#" className="text-indigo-600 hover:text-indigo-900">
                              Xem<span className="sr-only">, {order.id}</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;