import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Smile, Paperclip, Minimize2 } from 'lucide-react';
import '../styles/AIChatBot.css';
import ChefAIIcon from './ChefAIIcon';
import AIBotLogo from './AIBotLogo';

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! 👋 Chào mừng bạn đến với FPT Restaurant.\n\nTôi là AI Assistant sẵn sàng giúp bạn với:\n✨ Tư vấn menu & combo\n🏪 Đặt bàn hôm nay\n💰 Thông tin giá cả\n🚚 Dịch vụ giao hàng\n\nBạn cần tìm hiểu về gì?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mô phỏng trả lời từ AI
  const generateBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Câu trả lời dựa trên từ khóa
    const responses = {
      menu: '📋 Menu của chúng tôi rất phong phú:\n\n🍽️ Combo Gia Đình: 899k\n🍤 Lẩu Hải Sản: 599k\n🦞 Set Sashimi King: 1.8tr\n🍖 Combo BBQ: 3.5tr\n\nBạn quan tâm combo nào?',
      đặt: '🪑 Đặt bàn rất đơn giản!\n\n✅ Chọn ngày & giờ\n✅ Chọn số lượng khách\n✅ Lựa chọn khu vực\n✅ Xác nhận đặt bàn\n\nBạn muốn đặt bàn ngay?',
      giá: '💰 Giá cả canh tranh:\n\n🎯 Combo nhỏ: 120k - 300k\n🎯 Combo vừa: 500k - 1tr\n🎯 Combo lớn: 1.5tr - 3.5tr\n🎯 Buffet: 499k/người\n\nCó combo nào hợp với bạn không?',
      giao: '🚚 Giao hàng tận nơi:\n\n📍 Phạm vi: Toàn TP\n⏱️ Thời gian: 30-45 phút\n💳 Phí: Tùy khoảng cách\n\nBạn muốn gọi giao hàng?',
      sự: '🎉 Tổ chức sự kiện:\n\n💒 Tiệc cưới\n🎂 Sinh nhật\n👥 Họp mặt công ty\n🎊 Các sự kiện khác\n\nBạn cần tư vấn gì?',
      hỏi: '😊 Tôi sẵn sàng giúp!\n\nBạn có thể hỏi tôi về:\n📞 Hotline: 0123 456 789\n📍 Địa chỉ: 123 Đường ABC\n⏰ Giờ mở cửa: 10h - 23h\n\nTôi có thể giúp gì khác không?',
    };

    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    // Câu trả lời mặc định
    return 'Cảm ơn câu hỏi! 😊\n\nTôi là AI Assistant của FPT Restaurant. Bạn có thể hỏi tôi về:\n🍽️ Menu & Combo\n🪑 Đặt bàn\n💰 Giá cả\n🚚 Giao hàng\n🎉 Sự kiện\n\nBạn cần gì?';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Thêm tin nhắn của user
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Mô phỏng trả lời (trong thực tế sẽ gọi API)
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: generateBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsLoading(false);
    }, 800);
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
        title="Mở AI Assistant"
      >
        <AIBotLogo size={75} animated={true} />
        <div className="online-status-indicator"></div>
      </div>
    );
  }

  return (
    <div className={`ai-chatbot-container ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-avatar">
            <ChefAIIcon size={28} color="white" animated={false} />
          </div>
          <div className="chatbot-info">
            <h3 className="chatbot-title">AI Assistant</h3>
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
                className={`message-wrapper ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className={`message ${msg.sender === 'user' ? 'user' : 'bot'}`}>
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

            {isLoading && (
              <div className="message-wrapper bot-message">
                <div className="message bot typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chatbot-input-area">
            <div className="input-actions">
              <button className="action-btn" title="Emoji">
                <Smile size={20} />
              </button>
              <button className="action-btn" title="Đính kèm">
                <Paperclip size={20} />
              </button>
            </div>

            <input
              type="text"
              className="message-input"
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />

            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
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

export default AIChatBot;
