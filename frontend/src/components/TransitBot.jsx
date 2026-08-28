import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/api';
import {
  Bot,
  X,
  Send,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Bus,
  CreditCard,
  MapPin,
  Clock,
  ChevronDown,
  Minimize2,
  Maximize2,
} from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'Margao Route Stops', icon: MapPin, text: 'What are the stops for Route 17 Margao Line?' },
  { label: 'Bus Pass Pricing', icon: CreditCard, text: 'How much does a Semester Bus Pass cost?' },
  { label: 'All 20 Goa Routes', icon: Bus, text: 'Show me the list of all 20 Goa bus routes.' },
  { label: 'Running Late Notice', icon: Clock, text: 'How do I notify the driver if I am running late?' },
  { label: 'Panjim to Quitol', icon: MapPin, text: 'Which bus goes from Panjim to Quitol Campus?' },
];

const TransitBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `⚡ **TRANSITBOT ONLINE // SYSTEM READY**\n\nGreetings, Commuter! I am your **AI Transportation Assistant** for Parul University Goa Campus (Quitol).\n\nAsk me about routes, stops, bus pass subscription rates, or fleet tracking!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (customText) => {
    const query = customText || input;
    if (!query.trim() || loading) return;

    const userMessage = {
      sender: 'user',
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat(query.trim(), messages);
      if (res.success && res.data) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: res.data.reply,
            time: res.data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error(res.message || 'Error receiving AI response');
      }
    } catch (err) {
      console.error('TransitBot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `⚠️ **COMMUNICATION ERROR**: Unable to query the transport intelligence server. Please verify your connection or try again.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: `⚡ **TRANSITBOT MEMORY CLEARED**\n\nHow else can I assist your journey across Goa today?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Simple Markdown formatting for bot replies
  const renderFormattedText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold text
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      formattedLine = formattedLine.replace(/`(.*?)`/g, '<code class="bg-black/60 text-[#00FFFF] px-1 py-0.5 rounded font-mono text-[11px] border border-[#00FFFF]/30">$1</code>');

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="ml-2 my-0.5 flex items-start gap-1.5 text-slate-200">
            <span className="text-[#00FFFF] shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />
          </div>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <div key={idx} className="ml-2 my-0.5 text-slate-200" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="my-1 text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#090014] text-white border-2 border-[#00FFFF] rounded-full shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,0,255,0.6)] hover:border-[#FF00FF] transition-all transform hover:scale-105 active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#00FFFF] opacity-75 animate-ping" />
            <Bot className="h-6 w-6 text-[#00FFFF] group-hover:text-[#FF00FF] transition-colors relative z-10" />
          </div>
          <div className="text-left">
            <span className="block text-[9px] font-bold text-[#FF00FF] uppercase tracking-widest font-mono">AI ASSISTANT</span>
            <span className="block text-xs font-black text-white tracking-wider">TransitBot</span>
          </div>
        </button>
      )}

      {/* Expanded Holographic Chat Window */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[420px] bg-[#090014]/95 backdrop-blur-xl border-2 border-[#00FFFF] shadow-[0_0_35px_rgba(0,255,255,0.35)] rounded-xl flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-14' : 'h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="p-3.5 bg-black/80 border-b border-[#00FFFF]/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-[#00FFFF]/20 border border-[#00FFFF] flex items-center justify-center">
                <Bot className="h-4 w-4 text-[#00FFFF]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    TransitBot <span className="text-[#FF00FF]">v2.6</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-green-950/60 border border-green-500/40 text-green-400 text-[8px] font-mono font-bold rounded">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">Goa Campus Transit Intelligence</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                className="p-1 hover:text-[#00FFFF] transition-colors rounded"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1 hover:text-[#00FFFF] transition-colors rounded"
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1 hover:text-[#FF00FF] transition-colors rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message Stream */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs text-left">
                {messages.map((msg, idx) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono text-slate-400">
                        <span>{isBot ? '🤖 TRANSITBOT' : '👤 YOU'}</span>
                        <span>•</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`p-3 max-w-[88%] rounded-lg font-mono text-[11px] leading-relaxed border ${
                          isBot
                            ? 'bg-[#0f0022] border-[#00FFFF]/30 text-slate-100 shadow-[0_0_15px_rgba(0,255,255,0.08)]'
                            : 'bg-[#FF00FF]/15 border-[#FF00FF]/50 text-white shadow-[0_0_15px_rgba(255,0,255,0.12)]'
                        }`}
                      >
                        {isBot ? renderFormattedText(msg.text) : <p>{msg.text}</p>}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono text-[#00FFFF]">
                      <Sparkles className="h-3 w-3 animate-spin text-[#00FFFF]" />
                      <span>TRANSITBOT IS PROCESSING...</span>
                    </div>
                    <div className="p-3 bg-[#0f0022] border border-[#00FFFF]/40 rounded-lg flex items-center gap-1.5 text-[#00FFFF]">
                      <span className="h-2 w-2 rounded-full bg-[#00FFFF] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-[#00FFFF] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-[#00FFFF] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-3 py-2 bg-black/60 border-t border-[#00FFFF]/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {QUICK_PROMPTS.map((qp, i) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={i}
                      disabled={loading}
                      onClick={() => handleSend(qp.text)}
                      className="px-2.5 py-1 bg-[#00FFFF]/10 hover:bg-[#00FFFF]/20 border border-[#00FFFF]/30 hover:border-[#00FFFF] text-[#00FFFF] text-[10px] font-mono font-bold whitespace-nowrap rounded flex items-center gap-1 transition-all shrink-0 disabled:opacity-50"
                    >
                      <Icon className="h-3 w-3" />
                      {qp.label}
                    </button>
                  );
                })}
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-black/90 border-t border-[#00FFFF]/30 flex items-center gap-2 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask TransitBot about routes, stops, pass fees..."
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-[#090014] border border-[#00FFFF]/40 focus:border-[#00FFFF] text-white px-3 py-2 text-xs font-mono rounded focus:outline-none focus:ring-1 focus:ring-[#00FFFF] placeholder:text-slate-500 transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="p-2 bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-black rounded font-bold shadow-[0_0_12px_rgba(0,255,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TransitBot;
