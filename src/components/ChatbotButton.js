import React, { useState } from 'react';

export default function ChatbotButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div style={{ position: 'fixed', right: 16, bottom: 76, width: 320, height: 420, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.12)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: 12, background: '#FFBD21' }}>Hỗ trợ trực tuyến</div>
          <div style={{ padding: 12 }}>Chatbot (demo) — gửi tin nhắn để bắt đầu.</div>
          <div style={{ position: 'absolute', right: 8, top: 8, cursor: 'pointer' }} onClick={() => setOpen(false)}>✕</div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{ position: 'fixed', right: 16, bottom: 16, background: '#FFBD21', borderRadius: '50%', width: 56, height: 56, border: 'none', cursor: 'pointer' }}>💬</button>
    </>
  );
}
