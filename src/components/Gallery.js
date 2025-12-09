import React, { useState } from 'react';
import '../styles/gallery.css';
import { useLanguage } from '../contexts/LanguageContext';

export default function Gallery({ images = [] }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState(2);
  const [msg, setMsg] = useState(null);

  function handleReserve(e){
    e.preventDefault();
    try{
      const payload = { id: Date.now().toString(36), name, phone, date, time, guests, createdAt: new Date().toISOString() };
      const raw = localStorage.getItem('reservations');
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(payload);
      localStorage.setItem('reservations', JSON.stringify(arr));
      setMsg('Đặt bàn thành công (local). Mã: ' + payload.id);
      setName(''); setPhone(''); setDate(''); setTime('19:00'); setGuests(2);
    }catch(err){
      setMsg('Lỗi, thử lại sau.');
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">{t('gallery')}</h2>
        <div className="gallery-grid">
          {images.slice(0,5).map((src, idx) => (
            <div key={idx} className="gallery-item card">
              <img src={src} alt={`g-${idx}`} />
            </div>
          ))}

          <aside className="gallery-item inline-reserve card" aria-label="quick reservation">
            <h3 style={{ margin: 0 }}>Đặt bàn nhanh</h3>
            <form onSubmit={handleReserve} style={{ width: '100%' }}>
              <label className="sr-only" htmlFor="g-name">Họ tên</label>
              <input id="g-name" className="form-control" placeholder="Họ tên" value={name} onChange={e => setName(e.target.value)} required />

              <label className="sr-only" htmlFor="g-phone">Số điện thoại</label>
              <input id="g-phone" className="form-control" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} required />

              <label className="sr-only" htmlFor="g-date">Ngày</label>
              <input id="g-date" className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} required />

              <label className="sr-only" htmlFor="g-time">Giờ</label>
              <input id="g-time" className="form-control" type="time" value={time} onChange={e => setTime(e.target.value)} />

              <label className="sr-only" htmlFor="g-guests">Số lượng</label>
              <input id="g-guests" className="form-control" type="number" min={1} value={guests} onChange={e => setGuests(Number(e.target.value))} />

              <button className="btn" type="submit" style={{ marginTop: 8 }}>Xác nhận</button>
            </form>
            {msg && <div style={{ marginTop:8, color: 'var(--success)' }}>{msg}</div>}
          </aside>
        </div>
      </div>
    </section>
  );
}
