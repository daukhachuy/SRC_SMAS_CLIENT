/**
 * Trợ lý AI cho Admin — gợi ý combo / phân tích menu.
 *
 * Cấu hình (tùy chọn):
 *   REACT_APP_ADMIN_AI_API_URL — URL đầy đủ POST (vd. proxy backend của bạn).
 *   Body mặc định: { "prompt": string, "messages": [{ role, content }] }
 *   Response: backend có thể trả { "content" | "reply" | "message" } là chuỗi (JSON hoặc markdown),
 *   hoặc trả thẳng object JSON phân tích.
 */

function getAuthHeader() {
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * @param {{ prompt: string, messages?: Array<{ role: string, content: string }> }} payload
 * @returns {Promise<string | object>}
 */
export async function sendAdminAiInsight(payload) {
  const url = (process.env.REACT_APP_ADMIN_AI_API_URL || '').trim();
  if (!url) {
    return null;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      prompt: payload.prompt,
      messages: payload.messages || [],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export function unwrapAiPayload(data) {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  const keys = ['content', 'reply', 'message', 'answer', 'text', 'output'];
  for (const k of keys) {
    if (typeof data[k] === 'string' && data[k].trim()) return data[k];
  }
  if (data.data != null) return unwrapAiPayload(data.data);
  return JSON.stringify(data, null, 2);
}
