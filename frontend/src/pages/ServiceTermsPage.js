import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ScrollText, Handshake, Wallet, CalendarClock, CircleCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ServiceTerms.css';

const TERMS_BLOCKS = [
  {
    id: 'booking',
    icon: CalendarClock,
    title: 'Điều kiện đặt dịch vụ',
    items: [
      'Khách hàng cung cấp đầy đủ thông tin liên hệ, ngày tổ chức, số bàn và yêu cầu liên quan.',
      'Yêu cầu đặt lịch chỉ có hiệu lực khi được nhà hàng xác nhận thành công.',
      'Các nội dung ngoài phạm vi đã xác nhận sẽ được báo giá bổ sung trước khi thực hiện.',
    ],
  },
  {
    id: 'pricing',
    icon: Wallet,
    title: 'Giá và phương thức tính phí',
    items: [
      'Phí món ăn = Thực đơn 1 bàn x Số bàn đã đặt.',
      'Phí dịch vụ = Tổng giá các dịch vụ khách hàng đã chọn.',
      'Tổng cộng = Phí món ăn + Phí dịch vụ, hiển thị tại bước xác nhận.',
    ],
  },
  {
    id: 'change-cancel',
    icon: ScrollText,
    title: 'Thay đổi hoặc hủy dịch vụ',
    items: [
      'Khách hàng nên thông báo thay đổi sớm để nhà hàng sắp xếp nhân sự và nguyên liệu phù hợp.',
      'Yêu cầu thay đổi gần giờ tổ chức có thể bị giới hạn theo tình trạng thực tế.',
      'Khi hủy dịch vụ, phí phát sinh (nếu có) sẽ được thông báo minh bạch trước khi xử lý.',
    ],
  },
  {
    id: 'responsibility',
    icon: Handshake,
    title: 'Trách nhiệm và hỗ trợ',
    items: [
      'Nhà hàng cam kết phục vụ đúng các hạng mục đã xác nhận trong đơn đặt sự kiện.',
      'Khách hàng chịu trách nhiệm về tính chính xác của thông tin đã cung cấp.',
      'Mọi phản ánh được tiếp nhận qua hotline hoặc email và xử lý trong thời gian sớm nhất.',
    ],
  },
];

const ServiceTermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="service-terms-page">
      <Header navigate={navigate} />

      <main className="service-terms-main">
        <section className="service-terms-hero">
          <div className="service-terms-hero-badge">
            <ShieldCheck size={18} />
            <span>SMAS Service Policy</span>
          </div>
          <h1>Điều Khoản Dịch Vụ</h1>
          <p>
            Tài liệu này mô tả điều kiện sử dụng dịch vụ đặt sự kiện tại SMAS. Vui lòng đọc kỹ trước khi xác nhận
            đơn hàng để đảm bảo quyền lợi cho cả hai bên.
          </p>
        </section>

        <section className="service-terms-grid">
          {TERMS_BLOCKS.map((block) => {
            const Icon = block.icon;
            return (
              <article key={block.id} className="service-terms-card">
                <div className="service-terms-card-head">
                  <div className="service-terms-card-icon">
                    <Icon size={20} />
                  </div>
                  <h2>{block.title}</h2>
                </div>
                <ul>
                  {block.items.map((item) => (
                    <li key={item}>
                      <CircleCheck size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="service-terms-note">
          <h3>Lưu ý quan trọng</h3>
          <p>
            Việc tiếp tục sử dụng và xác nhận đặt sự kiện đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý với các
            điều khoản dịch vụ nêu trên.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceTermsPage;
