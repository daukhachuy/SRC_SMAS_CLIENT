import instance from './axiosInstance';

const unwrapData = (payload) => {
  if (payload == null) return payload;
  if (payload.data !== undefined && payload.data !== null) return unwrapData(payload.data);
  if (payload.Data !== undefined && payload.Data !== null) return unwrapData(payload.Data);
  if (payload.result !== undefined && payload.result !== null) return unwrapData(payload.result);
  if (payload.Result !== undefined && payload.Result !== null) return unwrapData(payload.Result);
  return payload;
};

const extractArray = (payload) => {
  const base = unwrapData(payload);
  if (Array.isArray(base)) return base;
  if (Array.isArray(base?.$values)) return base.$values;
  if (Array.isArray(base?.items)) return base.items;
  if (Array.isArray(base?.Items)) return base.Items;
  if (Array.isArray(base?.conversations)) return base.conversations;
  if (Array.isArray(base?.messages)) return base.messages;
  return [];
};

const toNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const pickDisplayName = (...values) => {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
};

const isPlaceholderText = (value) => {
  const t = String(value || '').trim().toLowerCase();
  return t === '' || t === 'string' || t === 'null' || t === 'undefined';
};

const sanitizeDisplayName = (value) => {
  const text = String(value ?? '').trim();
  return isPlaceholderText(text) ? '' : text;
};

/** API doi khi tra message/lastMessage la chuoi log (GET /api/...) — khong hien thi nhu tin nhan. */
const isNoiseConversationPreview = (value) => {
  const s = String(value ?? '').trim();
  if (!s) return false;
  if (/^(GET|POST|PUT|DELETE|PATCH)\s+/i.test(s)) return true;
  if (/\/api\/conversation\//i.test(s)) return true;
  if (/parameter/i.test(s) && s.length > 25) return true;
  return false;
};

export const sanitizeConversationListPreview = (value) => {
  const s = String(value ?? '').trim();
  if (!s || isNoiseConversationPreview(s)) return '';
  return s;
};

export const normalizeConversationItem = (raw) => {
  const manager = raw?.manager || raw?.Manager || {};
  const customer = raw?.customer || raw?.Customer || {};
  const userId = toNum(raw?.userId ?? raw?.UserId);
  const userName = pickDisplayName(raw?.userName, raw?.UserName);
  const userAvatar = pickDisplayName(raw?.userAvatar, raw?.UserAvatar, raw?.avatar, raw?.Avatar);
  const unreadCount = Number(
    raw?.unreadCount ??
    raw?.unReadCount ??
    raw?.unreadMessageCount ??
    raw?.unreadMessages ??
    raw?.notReadCount ??
    raw?.unSeenCount ??
    0
  ) || 0;
  return {
    id: toNum(raw?.conversationId ?? raw?.id ?? raw?.ConversationId),
    conversationId: toNum(raw?.conversationId ?? raw?.id ?? raw?.ConversationId),
    managerId: toNum(
      raw?.managerId ??
      raw?.ManagerId ??
      userId ??
      manager?.userId ??
      manager?.id
    ),
    managerName:
      sanitizeDisplayName(
        pickDisplayName(
        raw?.managerName,
        raw?.ManagerName,
        raw?.managerFullName,
        raw?.ManagerFullName,
        raw?.managerDisplayName,
        raw?.ManagerDisplayName,
        manager?.fullName,
        manager?.fullname,
        manager?.displayName,
        manager?.userName,
        manager?.username,
        manager?.name,
        userName
        )
      ) || 'Quản lý',
    customerId: toNum(raw?.customerId ?? raw?.CustomerId ?? customer?.userId ?? customer?.id),
    customerName:
      sanitizeDisplayName(
        pickDisplayName(
        raw?.customerName,
        raw?.CustomerName,
        raw?.customerFullName,
        raw?.CustomerFullName,
        raw?.customerDisplayName,
        raw?.CustomerDisplayName,
        customer?.fullName,
        customer?.fullname,
        customer?.displayName,
        customer?.userName,
        customer?.username,
        customer?.name,
        customer?.user?.fullName,
        customer?.user?.fullname,
        customer?.user?.displayName,
        customer?.account?.fullName,
        customer?.account?.fullname
        )
      ) || 'Khách hàng',
    userId,
    userName,
    userAvatar,
    lastMessage: (() => {
      const v =
        raw?.lastMessage ??
        raw?.latestMessage ??
        raw?.message ??
        '';
      const t = String(v).trim();
      return isNoiseConversationPreview(t) ? '' : t;
    })(),
    lastMessageAt:
      raw?.lastMessageAt ||
      raw?.updatedAt ||
      raw?.createdAt ||
      null,
    unreadCount,
    raw,
  };
};

export const normalizeConversationMessage = (raw) => {
  const sender = raw?.sender || raw?.Sender || {};
  return {
    id: toNum(raw?.messageId ?? raw?.id ?? raw?.MessageId) || Date.now(),
    messageId: toNum(raw?.messageId ?? raw?.id ?? raw?.MessageId),
    conversationId: toNum(raw?.conversationId ?? raw?.ConversationId),
    content: String(raw?.content ?? raw?.message ?? raw?.text ?? '').trim(),
    senderId: toNum(raw?.senderId ?? raw?.SenderId ?? sender?.userId ?? sender?.id),
    senderRole: String(
      raw?.senderRole ??
      raw?.role ??
      raw?.fromRole ??
      sender?.role ??
      ''
    ).toLowerCase(),
    senderName:
      pickDisplayName(
        raw?.senderName,
        raw?.SenderName,
        sender?.fullName,
        sender?.fullname,
        sender?.displayName,
        sender?.userName,
        sender?.username,
        sender?.name
      ),
    createdAt: raw?.createdAt ?? raw?.sentAt ?? raw?.CreatedAt ?? new Date().toISOString(),
    isRead: Boolean(raw?.isRead ?? raw?.read ?? false),
    raw,
  };
};

const get = async (url) => {
  const response = await instance.get(url);
  return response?.data;
};

const post = async (url, body) => {
  const response = await instance.post(url, body);
  return response?.data;
};

const postWithQuery = async (url, query = {}) => {
  const response = await instance.post(url, null, { params: query });
  return response?.data;
};

const put = async (url, body = {}) => {
  const response = await instance.put(url, body);
  return response?.data;
};

const putWithQuery = async (url, query = {}) => {
  const response = await instance.put(url, {}, { params: query });
  return response?.data;
};

/** Gom loi tra ve tu API (ASP.NET ProblemDetails, validation, body rong / CORS). */
export const formatConversationApiError = (err) => {
  const status = err?.response?.status;
  const d = err?.response?.data;
  const url = err?.config?.url || '';
  const method = String(err?.config?.method || 'GET').toUpperCase();

  if (typeof d === 'string' && d.trim()) return d.trim();

  if (d && typeof d === 'object') {
    const detail = d.detail ?? d.Detail;
    if (typeof detail === 'string' && detail.trim()) return detail.trim();
    const msg = d.message ?? d.Message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    if (d.title && d.errors && typeof d.errors === 'object') {
      const parts = Object.entries(d.errors).flatMap(([key, val]) => {
        const msgs = Array.isArray(val) ? val : [val];
        return msgs.filter(Boolean).map((m) => `${key}: ${m}`);
      });
      if (parts.length) return parts.join('; ');
    }
    const title = d.title ?? d.Title;
    if (typeof title === 'string' && title.trim()) return title.trim();
    try {
      const s = JSON.stringify(d);
      if (s && s !== '{}' && s !== 'null') return s;
    } catch {
      /* ignore */
    }
  }

  if (status && url) {
    return `[${status}] ${method} ${url}`;
  }
  return err?.message || 'Loi khong xac dinh.';
};

export const conversationApi = {
  getConversations: async () => {
    const data = await get('/conversation/conversations');
    return extractArray(data).map(normalizeConversationItem).filter((x) => x.conversationId != null);
  },

  managerCreateConversation: async ({ customerId }) => {
    const cid = toNum(customerId);
    if (!cid) throw new Error('Thiếu customerId hợp lệ.');
    const data = await postWithQuery('/conversation/manager-create', {
      customerid: cid,
    });
    return normalizeConversationItem(unwrapData(data) || {});
  },

  getCustomerConversationsMy: async () => {
    const data = await get('/conversation/customer-message-my');
    return extractArray(data).map(normalizeConversationItem).filter((x) => x.conversationId != null);
  },

  customerCreateConversation: async ({ managerId }) => {
    const mid = toNum(managerId);
    if (!mid) throw new Error('Thiếu managerId hợp lệ.');
    const data = await postWithQuery('/conversation/customer-create', {
      managerid: mid,
    });
    return normalizeConversationItem(unwrapData(data) || {});
  },

  getManagerConversationsMy: async () => {
    const data = await get('/conversation/manager-conversations-my');
    return extractArray(data).map(normalizeConversationItem).filter((x) => x.conversationId != null);
  },

  getConversationMessages: async (conversationId) => {
    const data = await get(`/conversation/${conversationId}/messages`);
    return extractArray(data).map(normalizeConversationMessage);
  },

  sendMessage: async ({ conversationId, content, attachmentUrl = '', messageType = '' }) => {
    const text = String(content || '').trim();
    if (!conversationId || !text) return null;
    const cid = Math.trunc(Number(conversationId));
    if (!Number.isFinite(cid) || cid <= 0 || cid > 2147483647) {
      throw new Error('Thieu conversationId hop le.');
    }
    const body = { conversationId: cid, content: text };
    const att = String(attachmentUrl || '').trim();
    if (att) body.attachmentUrl = att;
    const mt = String(messageType || '').trim();
    if (mt) body.messageType = mt;
    const data = await post('/conversation/send-messages', body);
    const unwrapped = unwrapData(data);
    if (unwrapped && typeof unwrapped === 'object') {
      return normalizeConversationMessage(unwrapped);
    }
    return {
      id: Date.now(),
      conversationId: cid,
      content: text,
      senderRole: 'customer',
      createdAt: new Date().toISOString(),
      isRead: false,
      raw: unwrapped,
    };
  },

  markConversationRead: async (conversationId, userId = null) => {
    if (!conversationId) return null;
    const query = {};
    const uid = toNum(userId);
    if (uid) query.userId = uid;
    return putWithQuery(`/conversation/${conversationId}/read`, query);
  },

  getAllManagers: async () => {
    const data = await get('/conversation/getall-manager');
    const list = extractArray(data);
    return list.map((raw) => ({
      id: toNum(raw?.managerId ?? raw?.id ?? raw?.userId ?? raw?.ManagerId),
      name: pickDisplayName(
        raw?.managerName,
        raw?.ManagerName,
        raw?.fullName,
        raw?.fullname,
        raw?.displayName,
        raw?.userName,
        raw?.username,
        raw?.name
      ) || 'Quản lý',
      email: raw?.email || '',
      raw,
    })).filter((x) => x.id != null);
  },

  getAllCustomers: async () => {
    const data = await get('/conversation/getall-customer');
    const list = extractArray(data);
    return list.map((raw) => ({
      id: toNum(raw?.customerId ?? raw?.id ?? raw?.userId ?? raw?.CustomerId),
      name: pickDisplayName(
        raw?.customerName,
        raw?.CustomerName,
        raw?.customerFullName,
        raw?.CustomerFullName,
        raw?.fullName,
        raw?.fullname,
        raw?.displayName,
        raw?.userName,
        raw?.username,
        raw?.name,
        raw?.customer?.fullName,
        raw?.customer?.fullname,
        raw?.customer?.displayName,
        raw?.customer?.name,
        raw?.user?.fullName,
        raw?.user?.fullname,
        raw?.user?.displayName,
        raw?.account?.fullName,
        raw?.account?.fullname
      ) || '',
      email: pickDisplayName(raw?.email, raw?.Email, raw?.customerEmail, raw?.CustomerEmail),
      phone: pickDisplayName(raw?.phone, raw?.Phone, raw?.phoneNumber, raw?.PhoneNumber),
      avatar: pickDisplayName(raw?.avatar, raw?.Avatar, raw?.imageUrl, raw?.ImageUrl),
      raw,
    })).filter((x) => x.id != null).map((x) => ({
      ...x,
      name: x.name || x.email || x.phone || `Khách #${x.id}`,
    })).filter((x) => {
      const onlyPlaceholderName = isPlaceholderText(x.name) && isPlaceholderText(x.email) && isPlaceholderText(x.phone);
      return !onlyPlaceholderName;
    });
  },
};

