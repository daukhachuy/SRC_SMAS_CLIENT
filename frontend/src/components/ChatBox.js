import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Minimize2 } from 'lucide-react';
import '../styles/AIChatBot.css';

// Box chat thật giữa customer và nhà hàng (manager)
const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Bạn cần hỗ trợ gì từ nhà hàng?',
      sender: 'manager',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'manager',
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    // TODO: Gửi message lên server nếu có API
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div
        className="ai-bot-trigger-container"
        onClick={() => setIsOpen(true)}
        title="Mở chat với khách hàng"
        style={{ right: 32, bottom: 32, zIndex: 1000 }}
      >
        <MessageSquare size={48} color="#ff9800" />
        <div className="online-status-indicator"></div>
      </div>
    );
  }

  return (
    <div className={`ai-chatbot-container ${isMinimized ? 'minimized' : ''}`} style={{ right: 32, bottom: 32, zIndex: 1000 }}>
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-avatar">
            <MessageSquare size={28} color="#fff" />
          </div>
          <div className="chatbot-info">
            <h3 className="chatbot-title">Chat với khách hàng</h3>
            <p className="chatbot-status">
              <span className="status-dot"></span> Online
            </p>
          </div>
        </div>
        <div className="chatbot-header-right">
          <button
            className="chatbot-btn-icon"
            onClick={() => setIsMinimized(!isMinimized)}
            title="Thu gọn"
          >
            <Minimize2 size={18} />
          </button>
          <button
            className="chatbot-btn-icon"
            onClick={() => setIsOpen(false)}
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-wrapper ${msg.sender === 'manager' ? 'bot-message' : 'user-message'}`}
              >
                <div className={`message ${msg.sender === 'manager' ? 'bot' : 'user'}`}> 
                  <p>{msg.text}</p>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input Area */}
          <div className="chatbot-input-area">
            <input
              type="text"
              className="message-input"
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              title="Gửi"
            >
              <Send size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBox;
