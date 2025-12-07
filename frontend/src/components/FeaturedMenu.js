import React, { useState } from 'react';
import MenuModal from './MenuModal';
import '../styles/featured.css';
import { useLanguage } from '../contexts/LanguageContext';

function Card({ item, onView }) {
  const { t } = useLanguage();
  return (
    <div className="card">
      <img src={item.image || '/placeholder.png'} alt={item.name} />
      <div className="card-body">
        <h3 style={{ margin: 0 }}>{item.name}</h3>
        <div style={{ color: 'var(--muted)', marginTop: 6 }}>{Number(item.price).toLocaleString('vi-VN')} VND</div>
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => onView(item)}>{t('view_details')}</button>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedMenu({ items = [] }) {
  const [selected, setSelected] = useState(null);
  const { t } = useLanguage();

  return (
    <section className="section" aria-label="featured menu">
      <div className="container">
        <h2 className="section-title">{t('featured_menu')}</h2>
        <div className="grid grid-3">
          {items.map(i => (
            <article key={i.id}>
              <Card item={i} onView={(it) => setSelected(it)} />
            </article>
          ))}
        </div>
      </div>

      <MenuModal item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
