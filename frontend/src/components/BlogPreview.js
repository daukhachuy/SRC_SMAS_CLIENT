import React from 'react';
import '../styles/featured.css';
import { useLanguage } from '../contexts/LanguageContext';

export default function BlogPreview({ posts = [] }) {
  const { t } = useLanguage();
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Tin tức & Khuyến mãi</h2>
        <div className="grid grid-3">
          {posts.map(p => (
            <article key={p.id} className="card">
              <img src={p.thumbnail || '/placeholder.png'} alt={p.title} />
              <div className="card-body">
                <h3 style={{ margin: 0 }}>{p.title}</h3>
                <p style={{ color: 'var(--muted)', marginTop: 8 }}>{p.excerpt}</p>
                <div style={{ marginTop: 8 }}>
                  <button className="btn">{t('view_more')}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
