

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineMinusCircle } from 'react-icons/hi';

const MOCK = {
  name: 'Nguyễn Văn An',
  code: 'NV001',
  role: 'Đầu bếp',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  totalShifts: 24,
  totalShiftsChange: 2,
  totalHours: 192.5,
  totalAbsent: 0,
  details: [
    { date: '15/03/2024', shift: 'Sáng', checkIn: '07.55', checkOut: '16.05', hours: 8.0, status: 'Đúng giờ' },
    { date: '14/03/2024', shift: 'Tối', checkIn: '17.15', checkOut: '22.00', hours: 4.75, status: 'Muộn (15p)' },
    { date: '13/03/2024', shift: 'Chiều', checkIn: '12.00', checkOut: '20.00', hours: 8.0, status: 'Đúng giờ' },
    { date: '12/03/2024', shift: 'Sáng', checkIn: '--:--', checkOut: '--:--', hours: 0.0, status: 'Vắng' },
  ],
};

const STATUS_STYLES = {
  'Đúng giờ': {
    className: 'bg-green-50 text-green-700 border border-green-200',
    icon: <HiOutlineCheckCircle className="inline mr-1 text-green-500 text-base align-text-bottom" />,
  },
  'Muộn (15p)': {
    className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    icon: <HiOutlineExclamationCircle className="inline mr-1 text-yellow-500 text-base align-text-bottom" />,
  },
  'Vắng': {
    className: 'bg-red-50 text-red-600 border border-red-200',
    icon: <HiOutlineMinusCircle className="inline mr-1 text-red-400 text-base align-text-bottom" />,
  },
};

const StaffProfilePage = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [month, setMonth] = useState('03/2024');
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const totalRows = MOCK.details.length;
  const totalPages = 2;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9F4F0] via-[#F6F8FF] to-[#F9F4F0] py-8 px-2">
      <div className="bg-white/95 rounded-3xl shadow-2xl w-full max-w-2xl mx-auto border border-gray-100 p-0 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-white via-[#F9F4F0] to-white rounded-t-3xl">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border-2 border-[#FF6C1F]/40 shadow-sm">
              <img alt={MOCK.name} src={MOCK.avatar} onError={e => {e.target.onerror=null;e.target.src='/images/default-avatar.png'}} className="w-20 h-20 object-cover" />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Lịch sử ca làm việc <span className="text-[#FF6C1F]">— {MOCK.name}</span>
              </h3>
              <p className="text-base text-gray-500 mt-2 font-medium">Mã NV: <span className="font-semibold text-gray-700">{MOCK.code}</span> • Vị trí: <span className="font-semibold text-gray-700">{MOCK.role}</span></p>
            </div>
          </div>
          <button aria-label="Đóng" className="p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={() => navigate(-1)}>
            <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-8 pt-8">
          <div className="bg-gradient-to-br from-[#FFF7F0] to-[#F9F4F0] p-6 rounded-xl border border-gray-100 flex flex-col items-center shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tổng số ca (Tháng này)</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-extrabold text-gray-900">{MOCK.totalShifts}</span>
              <span className="text-xs text-green-600 font-semibold animate-pulse">↑ {MOCK.totalShiftsChange} ca</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#F6F8FF] to-[#F9F4F0] p-6 rounded-xl border border-gray-100 flex flex-col items-center shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tổng giờ làm</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-extrabold text-gray-900">{MOCK.totalHours}</span>
              <span className="text-sm text-gray-500 mb-1">giờ</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#FFF0F0] to-[#F9F4F0] p-6 rounded-xl border border-gray-100 flex flex-col items-center shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Số ca vắng</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-extrabold text-red-600">{MOCK.totalAbsent}</span>
              <span className="text-sm text-gray-500 mb-1">ca</span>
            </div>
          </div>
        </div>

        {/* Table & Filter */}
        <div className="px-8 pt-10 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
            <h4 className="font-bold text-gray-800 text-xl tracking-tight">Chi tiết lịch sử ca làm</h4>
            <div className="flex gap-2">
              <div className="flex items-center bg-[#F9F4F0] rounded-lg px-3 py-1.5 border border-gray-100 shadow-sm">
                <span className="text-xs font-semibold text-gray-500 mr-2">THÁNG:</span>
                <select className="text-sm border-none bg-transparent py-0 pl-0 pr-8 focus:ring-0 font-semibold text-gray-800 rounded-lg appearance-none cursor-pointer" value={month} onChange={e => setMonth(e.target.value)}>
                  <option>Tháng 03/2024</option>
                  <option>Tháng 02/2024</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
            <table className="w-full text-left text-sm font-medium">
              <thead className="bg-gradient-to-r from-[#6C8CFF] to-[#A0BFFF] text-white font-bold uppercase text-[12px] tracking-widest">
                <tr>
                  <th className="px-5 py-3">Ngày</th>
                  <th className="px-5 py-3">Ca làm</th>
                  <th className="px-5 py-3">Giờ vào</th>
                  <th className="px-5 py-3">Giờ ra</th>
                  <th className="px-5 py-3 text-center">Tổng giờ</th>
                  <th className="px-5 py-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK.details.map((row, idx) => {
                  const status = STATUS_STYLES[row.status] || { className: 'bg-gray-100 text-gray-700', icon: null };
                  return (
                    <tr key={idx} className="hover:bg-[#F6F8FF] transition-colors group">
                      <td className="px-5 py-4 font-semibold text-gray-900 group-hover:text-[#FF6C1F]">{row.date}</td>
                      <td className="px-5 py-4 text-gray-600">{row.shift}</td>
                      <td className="px-5 py-4">{row.checkIn}</td>
                      <td className="px-5 py-4">{row.checkOut}</td>
                      <td className="px-5 py-4 text-center font-bold text-gray-800">{row.hours}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold gap-1 ${status.className}`}>{status.icon}{row.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="px-5 py-3 bg-[#F9F4F0] border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs text-gray-500">
                Hiển thị 1 - 4 trên 24 ca làm
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#FF6C1F] hover:border-[#FF6C1F] transition-colors disabled:opacity-50" disabled={page === 1} onClick={()=>setPage(p=>Math.max(1,p-1))}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </button>
                {[1,2,3].map(p=>(
                  <button key={p} className={`w-8 h-8 rounded-lg ${p===page?'bg-[#FF6C1F] text-white font-bold shadow':'bg-white border border-gray-200 text-gray-600 font-medium hover:border-[#FF6C1F] hover:text-[#FF6C1F] transition-colors'}`} onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#FF6C1F] hover:border-[#FF6C1F] transition-colors disabled:opacity-50" disabled={page === totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-8 border-t border-gray-100 bg-gradient-to-r from-white via-[#F9F4F0] to-white rounded-b-3xl">
          <button className="px-7 py-3 bg-[#FF6C1F] text-white font-bold rounded-xl shadow-lg hover:bg-[#ff7f32] transition-all text-base flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            Xuất PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffProfilePage;
