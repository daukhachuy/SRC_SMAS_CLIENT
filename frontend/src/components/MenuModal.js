import React, { useState, useEffect, useRef } from 'react';
import '../styles/modal.css';
import { addToCart } from '../utils/localCart';

export default function MenuModal({ item, onClose }) {
  const [msg, setMsg] = useState(null);
  const closeBtnRef = useRef(null);
  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item) return null;

  function handleAdd(){
    addToCart(item);
    setMsg('Đã thêm vào giỏ (local)');
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Chi tiết ${item.name}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <img src={item.image || '/images/placeholder.svg'} alt={item.name} />
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ marginTop: 0 }}>{item.name}</h2>
              <button ref={closeBtnRef} onClick={onClose} aria-label="Đóng" style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ color: 'var(--muted)', marginBottom: 12 }}>{Number(item.price).toLocaleString('vi-VN')} VND</div>
            <p style={{ color: '#333' }}>{item.description}</p>
            <div style={{ marginTop: 16 }}>
              <button className="btn" onClick={handleAdd}>Thêm vào giỏ</button>
              <button className="btn" style={{ marginLeft: 8, background: 'transparent', border: '1px solid rgba(11,18,32,0.06)', color: 'var(--dark)' }} onClick={onClose}>Đóng</button>
            </div>
            {msg && <div style={{ marginTop: 8, color: 'var(--success)' }}>{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
