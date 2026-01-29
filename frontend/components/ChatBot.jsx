'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Bot, User, Copy, FilePlus, Check } from 'lucide-react';
import api from '@/lib/api';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today with your business analysis tasks?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const { toast: toastData, success, error: showError, close: closeToast } = useToast();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: userMessage,
        history: messages.slice(-10), // Send last 10 messages for context
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.message },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      success('Content copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showError('Failed to copy');
    }
  };

  const handleSaveToNote = async (content) => {
    try {
      await api.post('/notes', {
        title: 'AI Chat Insight',
        content: content,
        color: '#ffffff'
      });
      success('Saved to notes');
    } catch (err) {
      console.error('Failed to save note: ', err);
      showError('Failed to save to notes');
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50"
          aria-label="Open chat"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={24} />
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-blue-100">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-2 group ${message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                    <Bot size={18} />
                  </div>
                )}
                <div
                  className={`relative max-w-[85%] p-3 rounded-lg ${message.role === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Action Buttons */}
                  <div className={`mt-2 flex items-center gap-2 border-t pt-2 opacity-0 group-hover:opacity-100 transition-opacity ${message.role === 'user' ? 'border-primary-light/20 justify-end' : 'border-gray-100 justify-start'
                    }`}>
                    <button
                      onClick={() => handleCopy(message.content, idx)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-black/5 transition-colors text-[11px] font-semibold ${message.role === 'user' ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                      title="Copy to clipboard"
                    >
                      {copiedId === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      <span>{copiedId === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => handleSaveToNote(message.content)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-black/5 transition-colors text-[11px] font-semibold text-gray-500 hover:text-gray-700"
                        title="Save to notes"
                      >
                        <FilePlus size={14} />
                        <span>Add to Note</span>
                      </button>
                    )}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm">
                  <Loader2 size={18} className="animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            {toastData && (
              <Toast
                message={toastData.message}
                type={toastData.type}
                duration={toastData.duration}
                onClose={closeToast}
              />
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows="2"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
