import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../auth/context';
import { sendChatMessage, ChatMessage } from '../../services/chatService';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function FloatingChat() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'model',
    content: 'Xin chào! Tôi là trợ lý AI chuyên gia tư vấn. Tôi có thể giúp gì cho bạn hôm nay?'
  }]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: inputVal.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputVal('');
    setIsLoading(true);

    try {
      // Prepare the history to send
      const historyToSend = [...messages, userMessage];
      const aiResponseText = await sendChatMessage(historyToSend);
      setMessages((prev) => [...prev, { role: 'model', content: aiResponseText }]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: error.message || 'Xin lỗi, đã có lỗi xảy ra. Hãy thử lại sau.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 h-96 sm:w-96 md:w-[400px] sm:h-[500px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="bg-[var(--accent-primary)] text-white p-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.26 1.09 4.31 2.8 5.75-.41 1.77-1.42 3.73-1.54 3.96-.13.25-.03.55.22.65.25.1.55.02.7-.22.42-.69 2.05-3.64 4.05-3.79C9.4 17.39 10.66 17.5 12 17.5c5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/>
              </svg>
              <h3 className="font-semibold text-lg">AI Tư Vấn</h3>
            </div>
            <button onClick={handleToggle} className="text-white/80 hover:text-white transition-colors" aria-label="Close Chat">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-secondary)] custom-scrollbar">
            {!isAuthenticated ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center mb-4 shadow-md">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                </div>
                <p className="text-[var(--text-secondary)] text-sm mb-4">
                  Bạn cần đăng nhập để trò chuyện với trợ lý AI.
                </p>
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('openLoginModal'))}
                  className="px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors font-medium shadow-sm"
                >
                  Đăng Nhập
                </button>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-[var(--accent-primary)] text-white rounded-br-sm shadow-md'
                          : 'bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <div
                          className="tinymce-content break-words"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(marked.parse(msg.content) as string)
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {isAuthenticated && (
            <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-primary)] z-10">
              <form onSubmit={handleSend} className="relative flex items-end">
                <textarea
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Nhập câu hỏi..."
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm border border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] rounded-xl py-2.5 pl-3 pr-12 resize-none outline-none custom-scrollbar"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isLoading}
                  className="absolute right-2 bottom-1.5 w-8 h-8 flex items-center justify-center bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={handleToggle}
        className="w-14 h-14 bg-[var(--accent-primary)] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform hover:shadow-[0_0_20px_var(--accent-primary)]"
        aria-label="AI Chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.26 1.09 4.31 2.8 5.75-.41 1.77-1.42 3.73-1.54 3.96-.13.25-.03.55.22.65.25.1.55.02.7-.22.42-.69 2.05-3.64 4.05-3.79C9.4 17.39 10.66 17.5 12 17.5c5.52 0 10-3.92 10-8.75S17.52 2 12 2z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
