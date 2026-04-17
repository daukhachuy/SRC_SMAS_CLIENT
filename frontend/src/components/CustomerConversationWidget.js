import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X, Minimize2 } from 'lucide-react';
import {
  conversationApi,
  formatConversationApiError,
  normalizeConversationItem,
  normalizeConversationMessage,
} from '../api/conversationApi';
import { createHubConnection, CHAT_HUB } from '../realtime/signalrClient';
import '../styles/CustomerConversationWidget.css';

const getAuthToken = () =>
  localStorage.getItem('authToken') || localStorage.getItem('accessToken') || '';

const getCurrentUser = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('user') || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

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
  const diffDays = Math.round((startNow - startD) / 86400000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN');
};

const sortByCreatedAt = (rows) =>
  [...rows].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

const mergeConversationLists = (...groups) => {
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
    });
  });
  return [...map.values()].sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
};

const isFromCurrentUser = (msg, currentUserId) => {
  const role = String(msg?.senderRole || '').toLowerCase();
  if (role === 'customer') return true;
  const senderId = Number(msg?.senderId);
  if (Number.isFinite(senderId) && Number.isFinite(currentUserId)) {
    return senderId === currentUserId;
  }
  return false;
};

const isGenericManagerLabel = (value) => {
  const text = String(value || '').trim().toLowerCase();
  return !text || text === 'quản lý' || text === 'quan ly' || text === 'manager';
};

const isConversationAlreadyExistsError = (err) => {
  const text = formatConversationApiError(err).toLowerCase();
  return (
    text.includes('cuộc hội thoại đã tồn tại') ||
    text.includes('cuoc hoi thoai da ton tai') ||
    text.includes('already exists') ||
    text.includes('conversation already exists')
  );
};

const extractConversationIdFromError = (err) => {
  const payload = err?.response?.data;
  const candidates = [payload, payload?.data, payload?.Data, payload?.result, payload?.Result];
  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;
    const rawId =
      item.conversationId ??
      item.ConversationId ??
      item.existingConversationId ??
      item.ExistingConversationId ??
      item.id ??
      item.Id;
    const n = Number(rawId);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const CustomerConversationWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [inputValue, setInputValue] = useState('');

  const [managers, setManagers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const chatConnectionRef = useRef(null);
  const joinedConversationRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const isOpenRef = useRef(false);
  const isMinimizedRef = useRef(false);
  const currentUserIdRef = useRef(null);
  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserId = Number(currentUser?.userId || currentUser?.id || 0) || null;
  const unreadCount = conversations.reduce((sum, item) => sum + (Number(item.unreadCount || 0) || 0), 0);
  const activeConversation =
    conversations.find((item) => Number(item.conversationId) === Number(activeConversationId)) || null;
  const managerNameById = useMemo(() => {
    const map = new Map();
    managers.forEach((m) => {
      if (m?.id != null && m?.name) map.set(Number(m.id), m.name);
    });
    return map;
  }, [managers]);
  const managerSelectValue = useMemo(() => {
    if (creatingConversation && selectedManagerId) return selectedManagerId;
    const mid = activeConversation?.managerId;
    const n = Number(mid);
    if (Number.isFinite(n) && n > 0) return String(n);
    return '';
  }, [creatingConversation, selectedManagerId, activeConversation]);

  const groupedMessages = useMemo(() => {
    const rows = sortByCreatedAt(messages);
    const groups = [];
    let lastDay = '';
    rows.forEach((msg) => {
      const dayLabel = formatDayLabel(msg.createdAt);
      if (dayLabel && dayLabel !== lastDay) {
        groups.push({ type: 'day', key: `day-${dayLabel}-${msg.id}`, label: dayLabel });
        lastDay = dayLabel;
      }
      groups.push({ type: 'message', key: `msg-${msg.id}-${msg.createdAt}`, message: msg });
    });
    return groups;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const upsertConversationMeta = (conversationId, patch, fallback = {}) => {
    setConversations((prev) => {
      const cid = Number(conversationId);
      if (!Number.isFinite(cid)) return prev;
      const idx = prev.findIndex((item) => Number(item.conversationId) === cid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return mergeConversationLists(next);
      }
      return mergeConversationLists([
        {
          conversationId: cid,
          id: cid,
          managerId: fallback.managerId ?? null,
          managerName: fallback.managerName || 'Nhà hàng SMAS',
          unreadCount: 0,
          ...patch,
        },
      ], prev);
    });
  };

  const resolveManagerName = (conversation) => {
    if (!conversation) return 'Nhà hàng SMAS';
    const managerId = Number(conversation.managerId);
    const mappedName = Number.isFinite(managerId) ? managerNameById.get(managerId) : '';
    if (mappedName) return mappedName;
    if (!isGenericManagerLabel(conversation.managerName)) return conversation.managerName;
    return 'Nhà hàng SMAS';
  };

  const loadBootstrap = async (silent = false) => {
    if (!silent) setLoadingInit(true);
    if (!silent) setErrorText('');
    try {
      const [allConversationsResult, customerConversationsResult, managersResult] = await Promise.allSettled([
        conversationApi.getConversations(),
        conversationApi.getCustomerConversationsMy(),
        conversationApi.getAllManagers(),
      ]);

      const allConversations = allConversationsResult.status === 'fulfilled' ? allConversationsResult.value : [];
      const customerConversations = customerConversationsResult.status === 'fulfilled' ? customerConversationsResult.value : [];
      const managerRows = managersResult.status === 'fulfilled' ? managersResult.value : [];

      const mergedConversations = mergeConversationLists(allConversations, customerConversations);
      setConversations(mergedConversations);
      setManagers(managerRows);

      if (mergedConversations.length > 0) {
        setActiveConversationId((prev) => {
          if (prev != null) return prev;
          const n = Number(mergedConversations[0].conversationId);
          return Number.isFinite(n) ? n : mergedConversations[0].conversationId;
        });
      }
      return { mergedConversations, managerRows };
    } catch {
      if (!silent) setErrorText('Không tải được dữ liệu hội thoại. Vui lòng thử lại.');
      return null;
    } finally {
      if (!silent) setLoadingInit(false);
    }
  };

  const loadMessages = async (conversationId, silent = false) => {
    if (!conversationId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const rows = await conversationApi.getConversationMessages(conversationId);
      const sorted = sortByCreatedAt(rows).filter((x) => x.content);
      setMessages(sorted);
      try {
        await conversationApi.markConversationRead(conversationId, currentUserId);
      } catch {
        /* ignore */
      }
      setConversations((prev) =>
        prev.map((item) =>
          Number(item.conversationId) === Number(conversationId) ? { ...item, unreadCount: 0 } : item
        )
      );
    } catch (err) {
      if (!silent) setErrorText(formatConversationApiError(err) || 'Không tải được tin nhắn. Vui lòng thử lại.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const ensureConversationForCustomer = async () => {
    if (activeConversationId) {
      const n = Number(activeConversationId);
      return Number.isFinite(n) ? n : activeConversationId;
    }
    if (!managers.length) {
      throw new Error('Hiện chưa có quản lý trực tuyến để bắt đầu cuộc trò chuyện.');
    }
    let managerIdToUse = null;
    const sel = Number(selectedManagerId);
    if (Number.isFinite(sel) && sel > 0) {
      managerIdToUse = sel;
    } else if (managers.length === 1) {
      managerIdToUse = Number(managers[0].id);
    }
    if (!managerIdToUse) {
      throw new Error('Vui lòng chọn quản lý ở ô phía trên hoặc mở một hội thoại trong danh sách.');
    }
    const mgr = managers.find((m) => Number(m.id) === managerIdToUse);
    const created = await conversationApi.customerCreateConversation({ managerId: managerIdToUse });
    const createdId = created?.conversationId;
    if (!createdId) throw new Error('Không tạo được cuộc trò chuyện mới.');
    setConversations((prev) =>
      mergeConversationLists(
        [
          {
            ...created,
            managerId: created?.managerId ?? managerIdToUse,
            managerName: isGenericManagerLabel(created?.managerName) ? mgr?.name || 'Quản lý' : created?.managerName,
            unreadCount: 0,
          },
        ],
        prev
      )
    );
    const nid = Number(createdId);
    const convId = Number.isFinite(nid) ? nid : createdId;
    setActiveConversationId(convId);
    setSelectedManagerId('');
    return convId;
  };

  const openChatWithManager = async (rawId) => {
    const mid = Number(rawId);
    if (!Number.isFinite(mid) || mid <= 0 || creatingConversation) return;
    setErrorText('');
    const existing = conversations.find(
      (c) => Number(c.managerId) === mid && c.conversationId != null
    );
    if (existing) {
      const cid = Number(existing.conversationId);
      if (Number.isFinite(cid)) {
        setActiveConversationId(cid);
        setSelectedManagerId('');
        return;
      }
    }
    setCreatingConversation(true);
    setSelectedManagerId(String(mid));
    try {
      const mgr = managers.find((m) => Number(m.id) === mid);
      const created = await conversationApi.customerCreateConversation({ managerId: mid });
      const createdId = created?.conversationId;
      if (!createdId) throw new Error('Không tạo được cuộc trò chuyện mới.');
      setConversations((prev) =>
        mergeConversationLists(
          [
            {
              ...created,
              managerId: created?.managerId ?? mid,
              managerName: isGenericManagerLabel(created?.managerName) ? mgr?.name || 'Quản lý' : created?.managerName,
              unreadCount: 0,
            },
          ],
          prev
        )
      );
      const nid = Number(createdId);
      setActiveConversationId(Number.isFinite(nid) ? nid : createdId);
    } catch (err) {
      if (isConversationAlreadyExistsError(err)) {
        const existedIdFromError = extractConversationIdFromError(err);
        if (Number.isFinite(existedIdFromError) && existedIdFromError > 0) {
          setActiveConversationId(existedIdFromError);
          setErrorText('');
        } else {
          const refreshed = await loadBootstrap(true);
          const refreshedConversations = refreshed?.mergedConversations || [];
          const existingAfterRefresh = refreshedConversations.find(
            (c) => Number(c.managerId) === mid && c.conversationId != null
          );
          if (existingAfterRefresh?.conversationId != null) {
            const cid = Number(existingAfterRefresh.conversationId);
            if (Number.isFinite(cid) && cid > 0) {
              setActiveConversationId(cid);
              setErrorText('');
            }
          }
        }
      } else {
        setErrorText(formatConversationApiError(err) || err?.message || 'Không tạo được cuộc trò chuyện.');
      }
    } finally {
      setCreatingConversation(false);
      setSelectedManagerId('');
    }
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content || sending) return;
    setSending(true);
    setErrorText('');
    setIsTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    try {
      const conversationId = await ensureConversationForCustomer();
      setInputValue('');
      const optimistic = {
        id: Date.now(),
        conversationId,
        content,
        senderRole: 'customer',
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => sortByCreatedAt([...prev, optimistic]));

      const convId = Math.trunc(Number(conversationId));
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
      setErrorText(formatConversationApiError(err) || err?.message || 'Không gửi được tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadBootstrap();
  }, [isOpen]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!isOpen || !activeConversationId) return;
    loadMessages(activeConversationId);
  }, [isOpen, activeConversationId]);

  useEffect(() => {
    if (!isOpen || !activeConversationId) return;
    const timer = setInterval(() => {
      loadMessages(activeConversationId, true);
    }, 15000);
    return () => clearInterval(timer);
  }, [isOpen, activeConversationId]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      loadBootstrap(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!getAuthToken() || isOpen) return;
    loadBootstrap(true);
    const timer = setInterval(() => {
      loadBootstrap(true);
    }, 45000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, []);

  useEffect(() => {
    if (!getAuthToken()) return undefined;
    const conn = createHubConnection(CHAT_HUB);
    chatConnectionRef.current = conn;

    const rejoinActiveConversation = async () => {
      const cid = Number(activeConversationIdRef.current);
      if (!Number.isFinite(cid) || cid <= 0) return;
      try {
        await conn.invoke('JoinConversation', cid);
        joinedConversationRef.current = cid;
      } catch {
        /* ignore join failures */
      }
    };

    conn.on('ReceiveMessage', (payload) => {
      const msg = normalizeConversationMessage(payload || {});
      const cid = Number(msg.conversationId);
      if (!Number.isFinite(cid)) return;
      const mine = Number(msg.senderId) === Number(currentUserIdRef.current);
      const viewing =
        isOpenRef.current &&
        !isMinimizedRef.current &&
        Number(activeConversationIdRef.current) === cid;

      if (!mine && viewing) {
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

      upsertConversationMeta(
        cid,
        {
          lastMessage: msg.content || '',
          lastMessageAt: msg.createdAt || new Date().toISOString(),
          ...(mine || viewing ? { unreadCount: 0 } : {}),
        },
        {}
      );
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
      setConversations((prev) => mergeConversationLists([row], prev));
    });

    conn.onreconnected(() => {
      void rejoinActiveConversation();
      void loadBootstrap(true);
    });

    conn
      .start()
      .then(() => rejoinActiveConversation())
      .catch(() => {
        /* fallback to polling */
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
      void conn.invoke('JoinConversation', cid).then(() => {
        joinedConversationRef.current = cid;
      }).catch(() => {});
    }
  }, [activeConversationId]);

  if (!getAuthToken()) return null;

  if (!isOpen) {
    return (
      <button
        type="button"
        className="customer-chat-trigger"
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        aria-label="Mở chat hỗ trợ khách hàng"
      >
        <MessageCircle size={22} />
        {unreadCount > 0 ? <span className="customer-chat-unread">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
      </button>
    );
  }

  return (
    <div className={`customer-chat-widget ${isMinimized ? 'is-minimized' : ''}`}>
      <div className="customer-chat-header">
        <div>
          <h4>Hỗ trợ trực tuyến</h4>
          <p>{resolveManagerName(activeConversation)}</p>
        </div>
        <div className="customer-chat-header-actions">
          <button type="button" onClick={() => setIsMinimized((v) => !v)} aria-label="Thu gọn">
            <Minimize2 size={16} />
          </button>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chat">
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="customer-chat-create-inline">
            <select
              value={managerSelectValue}
              onChange={(e) => {
                const id = e.target.value;
                setErrorText('');
                if (!id) {
                  setActiveConversationId(null);
                  setMessages([]);
                  setSelectedManagerId('');
                  return;
                }
                void openChatWithManager(id);
              }}
              className="customer-chat-select"
              disabled={loadingInit || managers.length === 0 || creatingConversation}
            >
              <option value="">
                {creatingConversation
                  ? 'Đang tạo cuộc trò chuyện...'
                  : managers.length
                    ? 'Chọn quản lý để nhắn tin'
                    : 'Đang tải danh sách quản lý...'}
              </option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="customer-chat-messages">
            {loadingInit || loadingMessages ? <p className="customer-chat-info">Đang tải tin nhắn...</p> : null}
            {!loadingInit && !loadingMessages && messages.length === 0 ? (
              <p className="customer-chat-info">
                {conversations.length === 0
                  ? 'Chọn quản lý ở ô phía trên để mở chat (nếu chỉ có một quản lý bạn có thể gửi tin trực tiếp).'
                  : 'Chưa có tin nhắn trong cuộc trò chuyện này.'}
              </p>
            ) : null}
            {groupedMessages.map((entry) => {
              if (entry.type === 'day') {
                return (
                  <div key={entry.key} className="customer-chat-day-divider">
                    <span>{entry.label}</span>
                  </div>
                );
              }
              const msg = entry.message;
              const isSelf = isFromCurrentUser(msg, currentUserId);
              return (
                <div key={entry.key} className={`customer-chat-row ${isSelf ? 'self' : 'peer'}`}>
                  <div className={`customer-chat-bubble ${isSelf ? 'self' : 'peer'}`}>
                    <p>{msg.content}</p>
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            {isTyping ? (
              <div className="customer-chat-row self">
                <div className="customer-chat-typing">Bạn đang gõ...</div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          {errorText ? <p className="customer-chat-error">{errorText}</p> : null}

          <div className="customer-chat-input-wrap">
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
              disabled={sending}
            />
            <button type="button" onClick={handleSendMessage} disabled={!inputValue.trim() || sending}>
              <Send size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerConversationWidget;
