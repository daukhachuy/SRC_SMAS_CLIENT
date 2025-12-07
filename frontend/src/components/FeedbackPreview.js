import React from 'react';
import '../styles/featured.css';
import { useLanguage } from '../contexts/LanguageContext';

export default function FeedbackPreview({ feedbacks = [] }) {
  const { t } = useLanguage();
  return (
    <section className="section" aria-label="customer feedback">
      <div className="container">
        <h2 className="section-title">{t('feedbacks')}</h2>
        <div className="grid grid-3">
          {feedbacks.map(f => (
            <article key={f.id} className="card" style={{ padding: 16 }} aria-label={`Feedback từ ${f.userName}`}>
              <div style={{ fontWeight: 700 }}>{f.userName}</div>
              <div aria-hidden="true" style={{ color: 'var(--primary)', marginTop: 6 }}>
                {'★'.repeat(Math.max(0, Math.min(5, f.rating || 5)))}
              </div>
              <p style={{ color: '#444', marginTop: 8 }}>{f.comment}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
