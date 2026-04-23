import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  UtensilsCrossed,
  TrendingUp,
  Tag,
  ChevronDown,
  ChevronUp,
  Cpu,
  UserRound,
  Layers3,
  MessageCircleHeart,
} from 'lucide-react';
import {
  fetchAdminMenuAnalysis,
  fetchAdminComboAnalysis,
  fetchAdminFeedbackAnalysis,
} from '../../api/adminDashboardApi';
import '../../styles/AdminAIInsightPage.css';

/** Nút phân tích: label hiển thị trong chat; dữ liệu lấy qua GET dashboard tương ứng */
const ANALYSIS_ACTIONS = [
  {
    key: 'single',
    label: 'Phân tích món lẻ',
    Icon: UtensilsCrossed,
    apiPath: '/admin/dashboard/menu-analysis',
    fetchAnalysis: fetchAdminMenuAnalysis,
  },
  {
    key: 'combo',
    label: 'Phân tích combo',
    Icon: Layers3,
    apiPath: '/admin/dashboard/combo-analysis',
    fetchAnalysis: fetchAdminComboAnalysis,
  },
  {
    key: 'reviews',
    label: 'Phân tích đánh giá khách hàng',
    Icon: MessageCircleHeart,
    apiPath: '/admin/dashboard/feedback-analysis',
    fetchAnalysis: fetchAdminFeedbackAnalysis,
  },
];

function unwrapDashboardBody(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  if (Object.prototype.hasOwnProperty.call(raw, 'data') && raw.data !== undefined) return raw.data;
  if (Object.prototype.hasOwnProperty.call(raw, 'Data') && raw.Data !== undefined) return raw.Data;
  return raw;
}

function insightPayloadFromApiData(data) {
  let textOut = '';
  let parsed = null;

  if (data == null) {
    return { text: 'API trả về rỗng.', parsed: undefined };
  }

  if (typeof data === 'string') {
    textOut = data.trim() || '(chuỗi rỗng)';
    parsed = tryParseInsightJson(textOut);
    return { text: textOut, parsed: parsed || undefined };
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    parsed = data;
    textOut = JSON.stringify(data, null, 2);
    return { text: textOut, parsed };
  }

  textOut = JSON.stringify(data, null, 2);
  return { text: textOut, parsed: undefined };
}

/** Trích JSON lớn nhất hoặc khối ```json ... ``` */
export function tryParseInsightJson(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const tryParse = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  let parsed = tryParse(text);
  if (parsed) return parsed;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    parsed = tryParse(text.slice(start, end + 1));
    if (parsed) return parsed;
  }
  return null;
}

function isComboSuggestionEntry(x) {
  if (!x || typeof x !== 'object') return false;
  const hasFoods = Array.isArray(x.foods) && x.foods.length > 0;
  const createLike = String(x.type || '').toLowerCase().includes('create');
  if (createLike || x.comboName) return true;
  if (hasFoods && (x.reason || x.detailAnalysis || x.originalPrice != null || x.suggestedPrice != null)) {
    return true;
  }
  if (hasFoods && x.name) return true;
  return false;
}

function collectComboSuggestions(obj) {
  if (!obj || typeof obj !== 'object') return [];
  const keys = ['suggestions', 'comboSuggestions', 'combos', 'proposals', 'items'];
  for (const k of keys) {
    const arr = obj[k];
    if (Array.isArray(arr)) {
      const filtered = arr.filter(isComboSuggestionEntry);
      if (filtered.length) return filtered;
    }
  }
  if (isComboSuggestionEntry(obj) && Array.isArray(obj.foods) && obj.foods.length) {
    return [obj];
  }
  if (Array.isArray(obj)) {
    return obj.filter(isComboSuggestionEntry);
  }
  return [];
}

/** Menu-analysis: mảng `items` — list đủ các dòng (không lọc chỉ hero). */
function collectMenuAnalysisItemRows(obj) {
  if (!obj || typeof obj !== 'object') return [];
  const arr = obj.items ?? obj.Items;
  if (!Array.isArray(arr) || !arr.length) return [];
  return arr.filter((x) => {
    if (!x || typeof x !== 'object') return false;
    if (isComboSuggestionEntry(x)) return false;
    const name = x.name ?? x.Name;
    if (name == null || String(name).trim() === '') return false;
    const hasInsight =
      (x.type ?? x.Type) ||
      (x.level ?? x.Level) ||
      (x.reason ?? x.Reason) ||
      (x.detailAnalysis ?? x.DetailAnalysis ?? x.detail);
    return Boolean(hasInsight);
  });
}

function collectHeroDishesLegacy(obj) {
  if (!obj || typeof obj !== 'object') return [];
  const keys = ['heroDishes', 'heroes', 'hero_dishes', 'pillarDishes'];
  for (const k of keys) {
    if (Array.isArray(obj[k]) && obj[k].length) return obj[k];
  }
  const allArrays = [];
  for (const k of Object.keys(obj)) {
    if (Array.isArray(obj[k])) allArrays.push(...obj[k]);
  }
  const heroes = allArrays.filter(
    (x) =>
      x &&
      typeof x === 'object' &&
      (String(x.type || '').toLowerCase().includes('hero') ||
        String(x.type || '').includes('Món chủ lực'))
  );
  return heroes.length ? heroes : [];
}

function collectHeroDishes(obj) {
  if (!obj || typeof obj !== 'object') return [];
  const fromItems = collectMenuAnalysisItemRows(obj);
  if (fromItems.length > 0) return fromItems;
  return collectHeroDishesLegacy(obj);
}

function comboCardTitle(item) {
  if (item.comboName || item.name) return item.comboName || item.name;
  const foods = Array.isArray(item.foods) ? item.foods : [];
  if (foods.length) {
    const head = foods.slice(0, 3).join(' · ');
    return foods.length > 3 ? `${head}…` : head;
  }
  return 'Gợi ý combo';
}

function ComboSuggestionCard({ item, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const foods = Array.isArray(item.foods) ? item.foods : [];
  const name = comboCardTitle(item);

  return (
    <article className="aiinsight-card aiinsight-card--combo">
      <div className="aiinsight-card-shine" aria-hidden />
      <div className="aiinsight-card-head">
        <div className="aiinsight-card-title-row">
          <span className="aiinsight-badge aiinsight-badge--create">Gợi ý combo</span>
          <h4>{name}</h4>
        </div>
        <div className="aiinsight-price-row">
          {item.originalPrice != null && (
            <span className="aiinsight-price-old">{Number(item.originalPrice).toLocaleString('vi-VN')}đ</span>
          )}
          {item.suggestedPrice != null && (
            <span className="aiinsight-price-new">{Number(item.suggestedPrice).toLocaleString('vi-VN')}đ</span>
          )}
          {item.discountPercent != null && (
            <span className="aiinsight-discount">-{item.discountPercent}%</span>
          )}
        </div>
      </div>
      {foods.length > 0 && (
        <ul className="aiinsight-foods">
          {foods.map((f, i) => (
            <li key={`${f}-${i}`}>
              <UtensilsCrossed size={14} /> {f}
            </li>
          ))}
        </ul>
      )}
      {item.reason && <p className="aiinsight-reason"><strong>Lý do:</strong> {item.reason}</p>}
      {item.detailAnalysis && (
        <div className="aiinsight-expand">
          <button type="button" className="aiinsight-expand-btn" onClick={() => setOpen(!open)}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            Phân tích chi tiết
          </button>
          {open && <p className="aiinsight-detail">{item.detailAnalysis}</p>}
        </div>
      )}
    </article>
  );
}

function HeroDishCard({ item }) {
  const level = item.level ?? item.Level ?? '—';
  const name = item.name ?? item.Name ?? '—';
  const type = item.type ?? item.Type ?? '';
  const reason = item.reason ?? item.Reason ?? '';
  const detail =
    item.detailAnalysis ?? item.DetailAnalysis ?? item.detail ?? item.Detail ?? '';

  return (
    <article className="aiinsight-card aiinsight-card--hero">
      <div className="aiinsight-card-shine aiinsight-card-shine--violet" aria-hidden />
      <div className="aiinsight-card-head">
        <span className="aiinsight-badge aiinsight-badge--hero">
          {level}
        </span>
        <h4>{name}</h4>
      </div>
      {type ? <p className="aiinsight-type-label">{type}</p> : null}
      {reason ? (
        <p className="aiinsight-reason">
          <strong>Nhận định:</strong> {reason}
        </p>
      ) : null}
      {detail ? <p className="aiinsight-detail">{detail}</p> : null}
    </article>
  );
}

function mergeArraysFromKeys(obj, keys) {
  const seen = [];
  const out = [];
  for (const k of keys) {
    const arr = obj[k];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const sig = typeof item === 'object' && item != null ? JSON.stringify(item) : String(item);
      if (seen.includes(sig)) continue;
      seen.push(sig);
      out.push(item);
    }
  }
  return out;
}

function getReviewSectionData(obj) {
  if (!obj || typeof obj !== 'object') return null;

  const themeKeys = [
    'themes',
    'Themes',
    'topics',
    'Topics',
    'themeAnalysis',
    'ThemeAnalysis',
    'negativeThemes',
    'positiveThemes',
    'sentimentThemes',
  ];
  const strengthKeys = ['strengths', 'Strengths', 'positivePoints', 'highlights', 'pros'];
  const improvementKeys = [
    'improvements',
    'Improvements',
    'weaknesses',
    'Weaknesses',
    'issues',
    'topIssues',
    'TopIssues',
    'concerns',
    'gaps',
  ];
  const actionKeys = [
    'actionItems',
    'ActionItems',
    'recommendations',
    'Recommendations',
    'suggestions',
    'Suggestions',
    'nextSteps',
    'NextSteps',
    'actions',
  ];

  const themes = mergeArraysFromKeys(obj, themeKeys);
  const strengths = mergeArraysFromKeys(obj, strengthKeys);
  const improvements = mergeArraysFromKeys(obj, improvementKeys);
  const actionItems = mergeArraysFromKeys(obj, actionKeys);
  const sentimentStats =
    (obj.sentimentStats && typeof obj.sentimentStats === 'object' ? obj.sentimentStats : null) ||
    (obj.SentimentStats && typeof obj.SentimentStats === 'object' ? obj.SentimentStats : null);

  const hasReviewLists =
    !!sentimentStats ||
    themes.length > 0 ||
    strengths.length > 0 ||
    improvements.length > 0 ||
    actionItems.length > 0;
  if (!hasReviewLists) return null;

  const scalarRows = [];
  const skipScalar = new Set([
    ...themeKeys,
    ...strengthKeys,
    ...improvementKeys,
    ...actionKeys,
    'sentimentStats',
    'SentimentStats',
    'summary',
    'Summary',
  ]);
  for (const [k, v] of Object.entries(obj)) {
    if (skipScalar.has(k) || v === null || v === undefined) continue;
    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      scalarRows.push({ key: k, value: v });
    }
  }

  return { sentimentStats, themes, strengths, improvements, actionItems, scalarRows };
}

function themeEntryTitle(t, i) {
  if (t == null) return `Mục ${i + 1}`;
  if (typeof t === 'string' || typeof t === 'number') return String(t);
  return (
    t.topic ||
    t.Title ||
    t.title ||
    t.name ||
    t.Name ||
    t.subject ||
    t.label ||
    t.key ||
    `Chủ đề ${i + 1}`
  );
}

function themeEntryBody(t) {
  if (t == null || typeof t !== 'object') return null;
  const parts = [
    t.note,
    t.Note,
    t.description,
    t.Description,
    t.content,
    t.Content,
    t.summary,
    t.Summary,
    t.detail,
    t.Detail,
    t.text,
    t.message,
    t.insight,
  ].filter((x) => x != null && String(x).trim() !== '');
  if (parts.length) return parts.map((p) => String(p)).join('\n\n');
  const rest = { ...t };
  for (const k of [
    'topic',
    'Title',
    'title',
    'name',
    'Name',
    'subject',
    'label',
    'key',
    'note',
    'Note',
    'description',
    'Description',
    'content',
    'Content',
    'summary',
    'Summary',
    'detail',
    'Detail',
    'text',
    'message',
    'insight',
  ]) {
    delete rest[k];
  }
  if (Object.keys(rest).length === 0) return null;
  return JSON.stringify(rest, null, 2);
}

function formatListItem(s) {
  if (s == null) return '—';
  if (typeof s === 'string' || typeof s === 'number' || typeof s === 'boolean') return String(s);
  return JSON.stringify(s, null, 2);
}

function formatPercentValue(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return '0%';
  return `${Math.round(num)}%`;
}

function ReviewInsightSection({ data }) {
  const { sentimentStats, themes, strengths, improvements, actionItems, scalarRows } = data;
  const positivePercent =
    sentimentStats?.positivePercent ?? sentimentStats?.PositivePercent ?? 0;
  const neutralPercent =
    sentimentStats?.neutralPercent ?? sentimentStats?.NeutralPercent ?? 0;
  const negativePercent =
    sentimentStats?.negativePercent ?? sentimentStats?.NegativePercent ?? 0;

  return (
    <section className="aiinsight-section aiinsight-section--reviews">
      <h3 className="aiinsight-section-title">
        <span className="aiinsight-section-icon aiinsight-section-icon--rose">
          <MessageCircleHeart size={18} strokeWidth={2.5} />
        </span>
        Đánh giá khách hàng
      </h3>
      {sentimentStats && (
        <div className="aiinsight-review-block">
          <h4 className="aiinsight-review-subtitle">Tỷ lệ cảm xúc</h4>
          <ul className="aiinsight-review-list">
            <li className="aiinsight-review-list-item-pre">
              Tích cực: {formatPercentValue(positivePercent)}
            </li>
            <li className="aiinsight-review-list-item-pre">
              Trung lập: {formatPercentValue(neutralPercent)}
            </li>
            <li className="aiinsight-review-list-item-pre">
              Tiêu cực: {formatPercentValue(negativePercent)}
            </li>
          </ul>
        </div>
      )}
      {scalarRows.length > 0 && (
        <dl className="aiinsight-review-scalars">
          {scalarRows.map(({ key, value }) => (
            <div key={key} className="aiinsight-review-scalar-row">
              <dt>{key}</dt>
              <dd>{typeof value === 'boolean' ? (value ? 'Có' : 'Không') : String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {themes.length > 0 && (
        <div className="aiinsight-review-block">
          <h4 className="aiinsight-review-subtitle">Chủ đề / nhóm ý kiến</h4>
          <ul className="aiinsight-review-list aiinsight-review-list--themes">
            {themes.map((t, i) => {
              if (typeof t === 'string' || typeof t === 'number') {
                return (
                  <li key={i} className="aiinsight-review-theme">
                    <p className="aiinsight-review-theme-plain">{String(t)}</p>
                  </li>
                );
              }
              const body = themeEntryBody(t);
              const bodyLooksJson = body && /^\s*[\[{]/.test(body);
              return (
                <li key={i} className="aiinsight-review-theme">
                  <strong>{themeEntryTitle(t, i)}</strong>
                  {body
                    ? bodyLooksJson
                      ? <pre className="aiinsight-review-theme-extra">{body}</pre>
                      : <p className="aiinsight-review-theme-text">{body}</p>
                    : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {strengths.length > 0 && (
        <div className="aiinsight-review-block">
          <h4 className="aiinsight-review-subtitle">Điểm mạnh</h4>
          <ul className="aiinsight-review-list">
            {strengths.map((s, i) => (
              <li key={i} className="aiinsight-review-list-item-pre">
                {formatListItem(s)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {improvements.length > 0 && (
        <div className="aiinsight-review-block">
          <h4 className="aiinsight-review-subtitle">Vấn đề nổi bật / cần cải thiện</h4>
          <ul className="aiinsight-review-list">
            {improvements.map((s, i) => (
              <li key={i} className="aiinsight-review-list-item-pre">
                {typeof s === 'object' && s != null ? (
                  <div>
                    <strong>
                      {s.issueName || s.IssueName || s.title || s.Title || `Vấn đề ${i + 1}`}
                    </strong>
                    {(s.category || s.Category || s.severity || s.Severity || s.percent != null || s.Percent != null) && (
                      <div style={{ marginTop: 4, opacity: 0.9 }}>
                        {[s.category || s.Category, s.severity || s.Severity, s.percent ?? s.Percent].filter((x) => x != null && String(x).trim() !== '').join(' • ')}
                      </div>
                    )}
                    {(s.description || s.Description || s.detail || s.Detail) && (
                      <p style={{ marginTop: 6 }}>
                        {s.description || s.Description || s.detail || s.Detail}
                      </p>
                    )}
                  </div>
                ) : (
                  formatListItem(s)
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {actionItems.length > 0 && (
        <div className="aiinsight-review-block">
          <h4 className="aiinsight-review-subtitle">Đề xuất hành động</h4>
          <ol className="aiinsight-review-list aiinsight-review-list--numbered">
            {actionItems.map((s, i) => (
              <li key={i} className="aiinsight-review-list-item-pre">
                {typeof s === 'object' && s != null ? (
                  <div>
                    <strong>{s.title || s.Title || s.name || s.Name || `Đề xuất ${i + 1}`}</strong>
                    {(s.priority || s.Priority) && (
                      <div style={{ marginTop: 4, opacity: 0.9 }}>
                        Ưu tiên: {s.priority || s.Priority}
                      </div>
                    )}
                    {(s.detail || s.Detail || s.description || s.Description) && (
                      <p style={{ marginTop: 6 }}>
                        {s.detail || s.Detail || s.description || s.Description}
                      </p>
                    )}
                  </div>
                ) : (
                  formatListItem(s)
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function StructuredInsightView({ parsed }) {
  const combos = collectComboSuggestions(parsed);
  const menuAnalysisRows = collectMenuAnalysisItemRows(parsed);
  const heroes = collectHeroDishes(parsed);
  const heroSectionTitle =
    menuAnalysisRows.length > 0 ? 'Phân tích chi tiết món' : 'Món chủ lực / rủi ro';
  const summary =
    typeof parsed.summary === 'string'
      ? parsed.summary
      : typeof parsed.Summary === 'string'
        ? parsed.Summary
        : null;
  const review = getReviewSectionData(parsed);

  if (!combos.length && !heroes.length && !summary && !review) {
    return (
      <div className="aiinsight-structured aiinsight-structured--raw-only">
        <p className="aiinsight-unstructured-msg">
          Không có phần hiển thị có cấu trúc cho dữ liệu này. Vui lòng kiểm tra định dạng phản hồi API.
        </p>
      </div>
    );
  }

  return (
    <div className="aiinsight-structured">
      {summary && <p className="aiinsight-summary">{summary}</p>}
      {review && <ReviewInsightSection data={review} />}
      {heroes.length > 0 && (
        <section className="aiinsight-section">
          <h3 className="aiinsight-section-title">
            <span className="aiinsight-section-icon aiinsight-section-icon--violet">
              <TrendingUp size={18} strokeWidth={2.5} />
            </span>
            {heroSectionTitle}
          </h3>
          <div className="aiinsight-hero-grid">
            {heroes.map((h, idx) => (
              <HeroDishCard key={`${idx}-${String(h?.name ?? h?.Name ?? '')}`} item={h} />
            ))}
          </div>
        </section>
      )}
      {combos.length > 0 && (
        <section className="aiinsight-section">
          <h3 className="aiinsight-section-title">
            <span className="aiinsight-section-icon aiinsight-section-icon--amber">
              <Tag size={18} strokeWidth={2.5} />
            </span>
            Gợi ý combo
          </h3>
          <div className="aiinsight-combo-list">
            {combos.map((c, idx) => (
              <ComboSuggestionCard key={idx} item={c} defaultOpen={idx === 0} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const AdminAIInsightPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        'Chọn loại phân tích bên dưới: món lẻ, combo hoặc đánh giá khách hàng. Kết quả hiển thị ngay trong khung chat.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollDown();
  }, [messages, loading, scrollDown]);

  const appendMessage = (msg) => {
    setMessages((prev) => [...prev, { ...msg, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }]);
  };

  const submitAnalysis = async ({ label, apiPath, fetchAnalysis }) => {
    if (loading || typeof fetchAnalysis !== 'function') return;

    setError('');
    appendMessage({ role: 'user', text: label, contentForApi: `GET ${apiPath}` });
    setLoading(true);

    try {
      const raw = await fetchAnalysis();
      const data = unwrapDashboardBody(raw);
      const { text: textOut, parsed } = insightPayloadFromApiData(data);

      appendMessage({
        role: 'assistant',
        text: textOut,
        parsed: parsed || undefined,
      });
    } catch (e) {
      const msg = e?.message || 'Không gọi được API phân tích.';
      setError(msg);
      appendMessage({
        role: 'assistant',
        text: `Lỗi: ${msg}`,
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aiinsight-page">
      <div className="aiinsight-bg" aria-hidden>
        <div className="aiinsight-bg__mesh" />
        <div className="aiinsight-bg__grid" />
        <div className="aiinsight-bg__orb aiinsight-bg__orb--1" />
        <div className="aiinsight-bg__orb aiinsight-bg__orb--2" />
      </div>

      <div className="aiinsight-content">
        <header className="aiinsight-top">
          <div className="aiinsight-top__title-block">
            <div className="aiinsight-logo-ring" aria-hidden>
              <div className="aiinsight-logo-core">
                <Sparkles size={22} strokeWidth={2.2} />
              </div>
            </div>
            <div>
              <p className="aiinsight-eyebrow">
                <Cpu size={14} strokeWidth={2.5} /> Intelligence layer
              </p>
              <h1 className="aiinsight-title">Trợ lý phân tích thực đơn</h1>
              <p className="aiinsight-subtitle">
                Gợi ý món lẻ, combo và đọc nhanh đánh giá khách hàng.
              </p>
            </div>
          </div>
          <div className="aiinsight-top__pills">
            <span className="aiinsight-pill aiinsight-pill--live">
              <span className="aiinsight-pill__dot" /> Sẵn sàng
            </span>
            <span className="aiinsight-pill">Món lẻ · Combo · Đánh giá</span>
          </div>
        </header>

        {error && (
          <div className="aiinsight-banner aiinsight-banner--error" role="alert">
            {error}
          </div>
        )}

        <div className="aiinsight-chat-shell">
          <div className="aiinsight-chat-panel">
            <div className="aiinsight-panel-header">
              <span className="aiinsight-panel-header__label">Phiên làm việc</span>
              <span className="aiinsight-panel-header__glow" />
            </div>

            <div className="aiinsight-messages">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`aiinsight-row aiinsight-row--${m.role} ${m.isError ? 'aiinsight-row--error' : ''}`}
                >
                  <div
                    className={`aiinsight-avatar aiinsight-avatar--${m.role}`}
                    aria-hidden
                  >
                    {m.role === 'user' ? (
                      <UserRound size={18} strokeWidth={2.2} />
                    ) : (
                      <Sparkles size={18} strokeWidth={2.2} />
                    )}
                  </div>
                  <div className={`aiinsight-bubble aiinsight-bubble--${m.role} ${m.id === 'welcome' ? 'aiinsight-bubble--welcome' : ''} ${m.isError ? 'aiinsight-bubble--error' : ''}`}>
                    <div className="aiinsight-bubble__meta">
                      {m.role === 'user' ? 'Bạn' : 'Trợ lý AI'}
                      {m.role === 'assistant' && (
                        <span className="aiinsight-bubble__chip">Phân tích</span>
                      )}
                    </div>
                    {m.role === 'assistant' && m.parsed ? (
                      <StructuredInsightView parsed={m.parsed} />
                    ) : (
                      <div className="aiinsight-msg-text">{m.text}</div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="aiinsight-row aiinsight-row--assistant aiinsight-row--typing">
                  <div className="aiinsight-avatar aiinsight-avatar--assistant aiinsight-avatar--pulse" aria-hidden>
                    <Sparkles size={18} strokeWidth={2.2} />
                  </div>
                  <div className="aiinsight-bubble aiinsight-bubble--assistant aiinsight-bubble--typing">
                    <div className="aiinsight-bubble__meta">Đang tải phân tích</div>
                    <div className="aiinsight-typing">
                      <span className="aiinsight-typing__dot" />
                      <span className="aiinsight-typing__dot" />
                      <span className="aiinsight-typing__dot" />
                      <Loader2 className="aiinsight-typing__spark aiinsight-spin" size={16} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="aiinsight-suggestions">
              <span className="aiinsight-suggestions__label">Yêu cầu phân tích</span>
              <div className="aiinsight-action-grid">
                {ANALYSIS_ACTIONS.map(({ key, label, Icon, ...rest }) => (
                  <button
                    key={key}
                    type="button"
                    className="aiinsight-action-btn"
                    disabled={loading}
                    onClick={() => submitAnalysis({ key, label, ...rest })}
                  >
                    <span className="aiinsight-action-btn__icon" aria-hidden>
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    <span className="aiinsight-action-btn__label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAIInsightPage;
