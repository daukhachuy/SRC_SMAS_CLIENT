import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Send } from 'lucide-react';
import {
  conversationApi,
  formatConversationApiError,
  normalizeConversationItem,
  normalizeConversationMessage,
  sanitizeConversationListPreview,
} from '../api/conversationApi';
import { createHubConnection, CHAT_HUB } from '../realtime/signalrClient';
import '../styles/ManagerConversationWidget.css';

const getToken = () => localStorage.getItem('authToken') || localStorage.getItem('accessToken') || '';

const formatTime = (value) => {
  if (!value) return '--:--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatDayLabel = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((startNow - startD) / 86400000);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN');
};

const sortByCreatedAt = (rows) =>
  [...rows].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

const groupMessagesByDay = (rows) => {
  const sorted = sortByCreatedAt(rows);
  const grouped = [];
  let lastLabel = '';
  sorted.forEach((msg) => {
    const dayLabel = formatDayLabel(msg.createdAt);
    if (dayLabel && dayLabel !== lastLabel) {
      grouped.push({ type: 'day', key: `day-${dayLabel}-${msg.id}`, label: dayLabel });
      lastLabel = dayLabel;
    }
    grouped.push({ type: 'message', key: `msg-${msg.id}-${msg.createdAt}`, message: msg });
  });
  return grouped;
};

const mergeConversations = (...groups) => {
  const map = new Map();
  groups.flat().forEach((item) => {
    if (!item || item.conversationId == null) return;
    const prev = map.get(item.conversationId);
    if (!prev) {
      map.set(item.conversationId, item);
      return;
    }
    map.set(item.conversationId, {
      ...prev,
      ...item,
      unreadCount: Math.max(Number(prev.unreadCount || 0), Number(item.unreadCount || 0)),
      lastMessage: item.lastMessage || prev.lastMessage,
      lastMessageAt: item.lastMessageAt || prev.lastMessageAt,
      userAvatar: item.userAvatar || prev.userAvatar,
    });
  });
  return [...map.values()].sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
};

const normalizeRole = (value) => String(value || '').trim().toLowerCase();
const isGenericCustomerLabel = (value) => {
  const text = String(value || '').trim().toLowerCase();
  return !text || text === 'khách hàng' || text === 'khach hang' || text === 'customer';
};

const getInitials = (name) => {
  const text = String(name || '').trim();
  if (!text) return 'KH';
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const CONV_CUSTOMER_STORAGE = 'smas_manager_conv_customer_v1';

const readConvCustomerMap = () => {
  try {
    const raw = localStorage.getItem(CONV_CUSTOMER_STORAGE);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
};

const persistConvCustomerEntry = (conversationId, entry) => {
  const id = String(conversationId);
  if (!id || id === 'undefined' || id === 'null') return;
  const map = readConvCustomerMap();
  map[id] = { ...map[id], ...entry };
  try {
    localStorage.setItem(CONV_CUSTOMER_STORAGE, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
};

const enrichConversationFromStorage = (item) => {
  if (!item?.conversationId) return item;
  const extra = readConvCustomerMap()[String(item.conversationId)];
  if (!extra) return item;
  const cid = Number(item.customerId || extra.customerId);
  const validCid = Number.isFinite(cid) && cid > 0 ? cid : null;
  const nameFromExtra = String(extra.customerName || '').trim();
  const mergedName =
    validCid != null && !isGenericCustomerLabel(item.customerName)
      ? item.customerName
      : nameFromExtra || item.customerName;
  const av = String(extra.customerAvatar || '').trim();
  return {
    ...item,
    customerId: validCid ?? item.customerId,
    customerName: mergedName || item.customerName,
    customerAvatar: av || item.customerAvatar,
  };
};

const ManagerConversationWidget = () => {
  const [loadingBootstrap, setLoadingBootstrap] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [customers, setCustomers] = useState([]);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const typingTimerRef = useRef(null);
  const bottomRef = useRef(null);
  const customersRef = useRef([]);
  const chatConnectionRef = useRef(null);
  const joinedConversationRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const currentUser = useMemo(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('user') || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }, []);
  const currentUserId = Number(currentUser?.userId || currentUser?.id || 0) || null;
  const currentRole = normalizeRole(currentUser?.role);

  const customerNameById = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => {
      if (c?.id != null && c?.name) map.set(Number(c.id), c.name);
    });
    return map;
  }, [customers]);

  const customerAvatarById = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => {
      if (c?.id != null && c?.avatar) map.set(Number(c.id), c.avatar);
    });
    return map;
  }, [customers]);

  const resolveCustomerName = (item) => {
    if (!item) return 'Khách hàng';
    const cid = Number(item.customerId);
    const validCid = Number.isFinite(cid) && cid > 0 ? cid : null;
    const mappedName = validCid != null ? customerNameById.get(validCid) : '';
    if (mappedName) return mappedName;
    if (!isGenericCustomerLabel(item.customerName)) return item.customerName;
    return validCid != null ? `Khách #${validCid}` : 'Khách hàng';
  };

  const resolveCustomerAvatar = (item) => {
    if (!item) return '';
    const fromItem = String(item.customerAvatar || '').trim();
    if (fromItem) return fromItem;
    const cid = Number(item.customerId);
    const validCid = Number.isFinite(cid) && cid > 0 ? cid : null;
    const mappedAvatar = validCid != null ? customerAvatarById.get(validCid) : '';
    return mappedAvatar || '';
  };

  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  const activeConversation =
    conversations.find((x) => Number(x.conversationId) === Number(activeConversationId)) || null;
  const customerSelectValue = useMemo(() => {
    const cid = activeConversation?.customerId;
    const n = Number(cid);
    if (Number.isFinite(n) && n > 0) return String(n);
    return '';
  }, [activeConversation]);

  const groupedMessages = useMemo(() => groupMessagesByDay(messages), [messages]);
  const filteredConversations = useMemo(() => {
    const key = String(searchTerm || '').trim().toLowerCase();
    if (!key) return conversations;
    return conversations.filter((item) => {
      const name = resolveCustomerName(item).toLowerCase();
      const last = String(sanitizeConversationListPreview(item.lastMessage) || '').toLowerCase();
      return name.includes(key) || last.includes(key);
    });
  }, [conversations, searchTerm, customers]);

  const isMine = (msg) => {
    const role = normalizeRole(msg?.senderRole);
    if (role === currentRole && currentRole) return true;
    const senderId = Number(msg?.senderId);
    if (Number.isFinite(senderId) && Number.isFinite(currentUserId)) {
      return senderId === currentUserId;
    }
    return false;
  };

  const tryInferCustomerFromMessages = (conversationId, messageRows) => {
    const list = customersRef.current || [];
    const nameById = new Map(list.map((c) => [Number(c.id), c.name]));
    const avById = new Map(list.filter((c) => c.avatar).map((c) => [Number(c.id), c.avatar]));

    const attach = (customerId, customerName, customerAvatar) => {
      const cid = Number(customerId);
      if (!Number.isFinite(cid) || cid <= 0) return;
      const name =
        String(customerName || '').trim() ||
        nameById.get(cid) ||
        `Khách #${cid}`;
      const avatar = String(customerAvatar || '').trim() || avById.get(cid) || '';
      persistConvCustomerEntry(conversationId, { customerId: cid, customerName: name, customerAvatar: avatar });
      setConversations((prev) =>
        prev.map((item) =>
          item.conversationId === conversationId
            ? { ...item, customerId: cid, customerName: name, customerAvatar: avatar }
            : item
        )
      );
    };

    for (const m of messageRows) {
      const sid = Number(m.senderId);
      const role = normalizeRole(m.senderRole);
      if (!Number.isFinite(sid) || sid <= 0) continue;
      if (Number.isFinite(currentUserId) && sid === currentUserId) continue;
      if (role === 'manager' || role === 'admin') continue;
      if (role === 'customer' || role === 'user' || role === '') {
        const nm = nameById.get(sid) || String(m.senderName || '').trim();
        if (nm || role === 'customer') {
          attach(sid, nm || `Khách #${sid}`, avById.get(sid) || '');
          return;
        }
      }
    }

    const peer = messageRows.find((m) => {
      const sid = Number(m.senderId);
      return Number.isFinite(sid) && sid > 0 && sid !== currentUserId;
    });
    if (peer) {
      const sid = Number(peer.senderId);
      attach(
        sid,
        nameById.get(sid) || String(peer.senderName || '').trim() || `Khách #${sid}`,
        avById.get(sid) || ''
      );
    }
  };

  const upsertConversationMeta = (conversationId, patch, fallback = {}) => {
    setConversations((prev) => {
      const cid = Number(conversationId);
      if (!Number.isFinite(cid)) return prev;
      const idx = prev.findIndex((item) => Number(item.conversationId) === cid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return mergeConversations(next);
      }
      return mergeConversations([
        {
          conversationId: cid,
          id: cid,
          customerId: fallback.customerId ?? null,
          customerName: fallback.customerName || 'Khách hàng',
          unreadCount: 0,
          ...patch,
        },
      ], prev);
    });
  };

  const loadBootstrap = async (silent = false) => {
    if (!silent) setLoadingBootstrap(true);
    if (!silent) setErrorText('');
    try {
      const [managerConversationsRes, customersRes] = await Promise.allSettled([
        conversationApi.getManagerConversationsMy(),
        conversationApi.getAllCustomers(),
      ]);
      const managerConversations = managerConversationsRes.status === 'fulfilled' ? managerConversationsRes.value : [];
      const customerRows = customersRes.status === 'fulfilled' ? customersRes.value : [];

      const merged = mergeConversations(managerConversations).map(enrichConversationFromStorage);
      setConversations(merged);
      setCustomers(customerRows);
      if (merged.length > 0) {
        setActiveConversationId((prev) => {
          if (prev != null) return prev;
          const n = Number(merged[0].conversationId);
          return Number.isFinite(n) ? n : merged[0].conversationId;
        });
      }
    } catch {
      if (!silent) setErrorText('Không tải được dữ liệu chat manager.');
    } finally {
      if (!silent) setLoadingBootstrap(false);
    }
  };

  const loadMessages = async (conversationId, silent = false) => {
    if (!conversationId) return;
    if (!silent) {
      setLoadingMessages(true);
      setMessages([]);
    }
    try {
      const rows = await conversationApi.getConversationMessages(conversationId);
      const sorted = sortByCreatedAt(rows).filter((x) => x.content);
      setMessages(sorted);
      tryInferCustomerFromMessages(conversationId, sorted);
      try {
        await conversationApi.markConversationRead(conversationId, currentUserId);
      } catch {
        /* ignore read-receipt errors */
      }
      setConversations((prev) =>
        prev.map((item) =>
          Number(item.conversationId) === Number(conversationId) ? { ...item, unreadCount: 0 } : item
        )
      );
    } catch (err) {
      if (!silent) setErrorText(formatConversationApiError(err) || 'Không tải được tin nhắn.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const openChatWithCustomer = async (rawId) => {
    const customerId = Number(rawId);
    if (!Number.isFinite(customerId) || customerId <= 0 || creatingConversation) return;
    setErrorText('');
    const existing = conversations
      .filter(
        (c) =>
          Number(c.customerId) === customerId &&
          Number.isFinite(customerId) &&
          customerId > 0 &&
          c.conversationId != null
      )
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
      )[0];
    if (existing) {
      const convId = Number(existing.conversationId);
      if (Number.isFinite(convId)) {
        setActiveConversationId(convId);
        return;
      }
    }
    setCreatingConversation(true);
    try {
      const created = await conversationApi.managerCreateConversation({ customerId });
      if (!created?.conversationId) throw new Error('Không tạo được cuộc trò chuyện.');
      const selectedCustomer = customers.find((c) => Number(c.id) === customerId);
      const displayName = isGenericCustomerLabel(created?.customerName)
        ? (selectedCustomer?.name || `Khách #${customerId}`)
        : created?.customerName;
      const displayAvatar = String(selectedCustomer?.avatar || '').trim();
      persistConvCustomerEntry(created.conversationId, {
        customerId: created?.customerId ?? customerId,
        customerName: displayName,
        customerAvatar: displayAvatar,
      });
      setConversations((prev) =>
        mergeConversations(
          [
            {
              ...created,
              customerId: created?.customerId ?? customerId,
              customerName: displayName,
              customerAvatar: displayAvatar,
              unreadCount: 0,
            },
          ],
          prev
        )
      );
      const newConvId = Number(created.conversationId);
      setActiveConversationId(Number.isFinite(newConvId) ? newConvId : created.conversationId);
    } catch (err) {
      setErrorText(formatConversationApiError(err) || err?.message || 'Tạo cuộc trò chuyện thất bại.');
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content || !activeConversationId || sending) return;
    setSending(true);
    setErrorText('');
    setIsTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    try {
      const optimistic = {
        id: optimisticId,
        conversationId: activeConversationId,
        content,
        senderRole: currentRole || 'manager',
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
      };
      setInputValue('');
      setMessages((prev) => sortByCreatedAt([...prev, optimistic]));
      const convId = Math.trunc(Number(activeConversationId));
      await conversationApi.sendMessage({ conversationId: convId, content });
      await loadMessages(convId, true);
      setConversations((prev) =>
        prev.map((item) =>
          Number(item.conversationId) === convId
            ? { ...item, lastMessage: content, lastMessageAt: new Date().toISOString() }
            : item
        )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputValue(content);
      setErrorText(formatConversationApiError(err) || 'Gửi tin nhắn thất bại.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!activeConversationId) return;
    loadMessages(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    const timer = setInterval(() => {
      loadMessages(activeConversationId, true);
    }, 15000);
    return () => clearInterval(timer);
  }, [activeConversationId]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadBootstrap(true);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, []);

  useEffect(() => {
    if (!getToken()) return undefined;
    const conn = createHubConnection(CHAT_HUB);
    chatConnectionRef.current = conn;

    const rejoinActiveConversation = async () => {
      const cid = Number(activeConversationIdRef.current);
      if (!Number.isFinite(cid) || cid <= 0) return;
      try {
        await conn.invoke('JoinConversation', cid);
        joinedConversationRef.current = cid;
      } catch {
        /* ignore */
      }
    };

    conn.on('ReceiveMessage', (payload) => {
      const msg = normalizeConversationMessage(payload || {});
      const cid = Number(msg.conversationId);
      if (!Number.isFinite(cid)) return;
      const mine = Number(msg.senderId) === Number(currentUserIdRef.current);
      const active = Number(activeConversationIdRef.current) === cid;

      if (!mine && active) {
        setMessages((prev) => {
          if (prev.some((m) => Number(m.messageId || m.id) === Number(msg.messageId || msg.id))) return prev;
          return sortByCreatedAt([...prev, msg]);
        });
        void conversationApi.markConversationRead(cid, currentUserIdRef.current).catch(() => {});
      } else if (!mine) {
        setConversations((prev) =>
          prev.map((item) =>
            Number(item.conversationId) === cid
              ? { ...item, unreadCount: Number(item.unreadCount || 0) + 1 }
              : item
          )
        );
      }

      upsertConversationMeta(cid, {
        lastMessage: msg.content || '',
        lastMessageAt: msg.createdAt || new Date().toISOString(),
        ...(mine || active ? { unreadCount: 0 } : {}),
      });
    });

    conn.on('MessagesRead', (payload) => {
      const cid = Number(payload?.conversationId);
      if (!Number.isFinite(cid)) return;
      if (Number(activeConversationIdRef.current) === cid) {
        setConversations((prev) =>
          prev.map((item) =>
            Number(item.conversationId) === cid ? { ...item, unreadCount: 0 } : item
          )
        );
      }
    });

    conn.on('NewConversation', (payload) => {
      const row = normalizeConversationItem(payload || {});
      if (!row?.conversationId) {
        void loadBootstrap(true);
        return;
      }
      setConversations((prev) => mergeConversations([row], prev));
    });

    conn.onreconnected(() => {
      void rejoinActiveConversation();
      void loadBootstrap(true);
    });

    conn
      .start()
      .then(() => rejoinActiveConversation())
      .catch(() => {
        /* fallback polling */
      });

    return () => {
      joinedConversationRef.current = null;
      chatConnectionRef.current = null;
      void conn.stop();
    };
  }, []);

  useEffect(() => {
    const conn = chatConnectionRef.current;
    if (!conn) return;
    const cid = Number(activeConversationId);
    const prevJoined = Number(joinedConversationRef.current);
    if (Number.isFinite(prevJoined) && prevJoined > 0 && prevJoined !== cid) {
      void conn.invoke('LeaveConversation', prevJoined).catch(() => {});
      joinedConversationRef.current = null;
    }
    if (Number.isFinite(cid) && cid > 0 && prevJoined !== cid) {
      void conn
        .invoke('JoinConversation', cid)
        .then(() => {
          joinedConversationRef.current = cid;
        })
        .catch(() => {});
    }
  }, [activeConversationId]);

  if (!getToken()) return null;

  return (
    <div className="manager-chat-widget-page">
      <div className="manager-chat-widget">
        <aside className="manager-chat-left">
          <div className="manager-chat-left-top">
            <h4>Đoạn chat</h4>
            <div className="manager-chat-create-inline">
              <select
                value={customerSelectValue}
                onChange={(e) => {
                  const id = e.target.value;
                  setErrorText('');
                  if (!id) {
                    setActiveConversationId(null);
                    setMessages([]);
                    return;
                  }
                  void openChatWithCustomer(id);
                }}
                className="manager-chat-select"
                disabled={loadingBootstrap || customers.length === 0 || creatingConversation}
              >
                <option value="">
                  {creatingConversation
                    ? 'Đang tạo cuộc trò chuyện...'
                    : customers.length
                      ? 'Chọn khách để nhắn tin'
                      : 'Đang tải danh sách khách...'}
                </option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="manager-chat-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Tìm theo tên khách hoặc nội dung tin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="manager-chat-conversation-list">
            {filteredConversations.length === 0 ? (
              <div className="manager-chat-conversation-empty">Không có hội thoại phù hợp</div>
            ) : (
              filteredConversations.map((item) => {
                const name = resolveCustomerName(item);
                const avatar = resolveCustomerAvatar(item);
                return (
                  <button
                    type="button"
                    key={item.conversationId}
                    className={`manager-chat-conversation-item ${
                      Number(item.conversationId) === Number(activeConversationId) ? 'active' : ''
                    }`}
                    onClick={() => {
                      setErrorText('');
                      const cid = Number(item.conversationId);
                      if (Number.isFinite(cid)) setActiveConversationId(cid);
                    }}
                  >
                    <div className="manager-chat-avatar-wrap">
                      {avatar ? <img src={avatar} alt="" className="manager-chat-avatar" /> : <span>{getInitials(name)}</span>}
                    </div>
                    <div className="manager-chat-conversation-meta">
                      <strong>{name}</strong>
                      <small>
                        {sanitizeConversationListPreview(item.lastMessage) || 'Chưa có tin nhắn'}
                      </small>
                    </div>
                    {item.unreadCount > 0 ? (
                      <span className="manager-chat-conversation-badge">
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="manager-chat-right">
          <div className="manager-chat-header">
            <div className="manager-chat-header-customer">
              <div className="manager-chat-avatar-wrap lg">
                {resolveCustomerAvatar(activeConversation) ? (
                  <img src={resolveCustomerAvatar(activeConversation)} alt="" className="manager-chat-avatar" />
                ) : (
                  <span>{getInitials(resolveCustomerName(activeConversation))}</span>
                )}
              </div>
              <div>
                <h4>{resolveCustomerName(activeConversation)}</h4>
                <p>{activeConversation ? 'Đang hoạt động' : 'Chưa chọn hội thoại'}</p>
              </div>
            </div>
          </div>

          <div className="manager-chat-messages">
            {loadingBootstrap || loadingMessages ? <p className="manager-chat-info">Đang tải tin nhắn...</p> : null}
            {!loadingBootstrap && !loadingMessages && messages.length === 0 ? (
              <p className="manager-chat-info">
                {conversations.length === 0 ? 'Tạo cuộc trò chuyện mới để bắt đầu.' : 'Chưa có tin nhắn.'}
              </p>
            ) : null}
            {groupedMessages.map((entry) => {
              if (entry.type === 'day') {
                return (
                  <div key={entry.key} className="manager-chat-day-divider">
                    <span>{entry.label}</span>
                  </div>
                );
              }
              const msg = entry.message;
              const self = isMine(msg);
              return (
                <div key={entry.key} className={`manager-chat-row ${self ? 'self' : 'peer'}`}>
                  <div className={`manager-chat-bubble ${self ? 'self' : 'peer'}`}>
                    <p>{msg.content}</p>
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            {isTyping ? (
              <div className="manager-chat-row self">
                <div className="manager-chat-typing">Bạn đang nhập...</div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {errorText ? <p className="manager-chat-error">{errorText}</p> : null}

          <div className="manager-chat-input-wrap">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsTyping(Boolean(e.target.value.trim()));
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(() => setIsTyping(false), 1200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sending || !activeConversationId}
            />
            <button type="button" onClick={handleSendMessage} disabled={!inputValue.trim() || sending || !activeConversationId}>
              <Send size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManagerConversationWidget;

