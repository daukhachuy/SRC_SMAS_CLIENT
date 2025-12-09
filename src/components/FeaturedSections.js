import React from 'react';
import '../styles/featured.css';
import { useLanguage } from '../contexts/LanguageContext';

export default function FeaturedSections({ sections = [], onView }) {
  const { t } = useLanguage();
  return (
    <section className="section" aria-label="featured sections">
      <div className="container">
        <div className="featured-sections">
          <article className="section-card card" aria-labelledby="feat-0-title">
            {sections[0] ? (
              <>
                <figure>
                  <img src={sections[0].image || '/placeholder.png'} alt={sections[0].title} />
                  <figcaption style={{ padding: 18 }}>
                    <h3 id="feat-0-title">{sections[0].title}</h3>
                    <p style={{ color: 'var(--muted)' }}>{sections[0].excerpt}</p>
                    <div style={{ marginTop: 12 }}>
                      <button className="btn" onClick={() => onView(sections[0])}>{t('view_details')}</button>
                    </div>
                  </figcaption>
                </figure>
              </>
            ) : null}
          </article>

          <article className="section-card card" aria-labelledby="feat-1-title">
            {sections[1] ? (
              <>
                <figure>
                  <img src={sections[1].image || '/placeholder.png'} alt={sections[1].title} />
                  <figcaption className="card-body">
                    <h3 id="feat-1-title">{sections[1].title}</h3>
                    <p style={{ color: 'var(--muted)' }}>{sections[1].excerpt}</p>
                    <div style={{ marginTop: 12 }}>
                      <button className="btn" onClick={() => onView(sections[1])}>{t('view_details')}</button>
                    </div>
                  </figcaption>
                </figure>
              </>
            ) : null}
          </article>

          <aside className="promo-card" aria-label="promo">
            <h3 style={{ marginTop: 0 }}>{sections[2]?.title ?? 'Brunch Cuối Tuần'}</h3>
            <p style={{ marginTop: 6 }}>{sections[2]?.excerpt ?? 'Ưu đãi và sự kiện'}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn">{t('view_more')}</button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
