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

  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('openTransitBot', handleOpenEvent);
    return () => window.removeEventListener('openTransitBot', handleOpenEvent);
  }, []);

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

  // Markdown formatting for bot replies
  const renderFormattedText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-400 font-bold">$1</strong>');
      formattedLine = formattedLine.replace(/`(.*?)`/g, '<code class="bg-black text-yellow-400 px-1.5 py-0.5 rounded font-mono text-[11px] border border-yellow-500/40">$1</code>');

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="ml-2 my-0.5 flex items-start gap-1.5 text-zinc-200">
            <span className="text-yellow-400 shrink-0 font-bold">•</span>
            <span dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />
          </div>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <div key={idx} className="ml-2 my-0.5 text-zinc-200" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="my-1 text-zinc-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[999999] font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#09090b] text-white border-2 border-yellow-400 rounded-full shadow-[0_0_25px_rgba(250,204,21,0.5)] hover:shadow-[0_0_35px_rgba(250,204,21,0.8)] hover:border-yellow-300 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping" />
            <Bot className="h-6 w-6 text-yellow-400 group-hover:scale-110 transition-transform relative z-10" />
          </div>
          <div className="text-left">
            <span className="block text-[9px] font-black text-yellow-400 uppercase tracking-widest font-mono">AI ASSISTANT</span>
            <span className="block text-xs font-black text-white tracking-wider">TransitBot</span>
          </div>
        </button>
      )}

      {/* Expanded Holographic Chat Window */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[420px] bg-[#09090b]/98 backdrop-blur-2xl border-2 border-yellow-500/60 shadow-[0_0_40px_rgba(250,204,21,0.35)] rounded-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-14' : 'h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="p-3.5 bg-black/90 border-b border-yellow-500/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-yellow-400/20 border border-yellow-400 flex items-center justify-center">
                <Bot className="h-4.5 w-4.5 text-yellow-400" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    TransitBot <span className="text-yellow-400">v2.6</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-yellow-950/60 border border-yellow-500/50 text-yellow-400 text-[8px] font-mono font-bold rounded">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <span className="text-[9px] text-zinc-400 font-mono">Goa Campus Transit Intelligence</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-zinc-400">
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                className="p-1.5 hover:text-yellow-400 transition-colors rounded hover:bg-zinc-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 hover:text-yellow-400 transition-colors rounded hover:bg-zinc-800"
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 hover:text-red-400 transition-colors rounded hover:bg-zinc-800"
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
                      <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono text-zinc-400">
                        <span>{isBot ? '🤖 TRANSITBOT' : '👤 YOU'}</span>
                        <span>•</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`p-3 max-w-[88%] rounded-xl font-mono text-[11px] leading-relaxed border ${
                          isBot
                            ? 'bg-[#121214] border-yellow-500/30 text-zinc-100 shadow-[0_0_15px_rgba(250,204,21,0.08)]'
                            : 'bg-yellow-400 text-black font-semibold border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                        }`}
                      >
                        {isBot ? renderFormattedText(msg.text) : <p>{msg.text}</p>}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono text-yellow-400">
                      <Sparkles className="h-3 w-3 animate-spin text-yellow-400" />
                      <span>TRANSITBOT IS PROCESSING...</span>
                    </div>
                    <div className="p-3 bg-[#121214] border border-yellow-500/40 rounded-xl flex items-center gap-1.5 text-yellow-400">
                      <span className="h-2 w-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-3 py-2 bg-black/80 border-t border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {QUICK_PROMPTS.map((qp, i) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={i}
                      disabled={loading}
                      onClick={() => handleSend(qp.text)}
                      className="px-2.5 py-1 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 hover:border-yellow-400 text-yellow-400 text-[10px] font-mono font-bold whitespace-nowrap rounded-lg flex items-center gap-1 transition-all shrink-0 disabled:opacity-50"
                    >
                      <Icon className="h-3 w-3" />
                      {qp.label}
                    </button>
                  );
                })}
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-black border-t border-yellow-500/30 flex items-center gap-2 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask TransitBot about routes, stops, pass fees..."
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-[#121214] border border-zinc-700 focus:border-yellow-400 text-white px-3.5 py-2 text-xs font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400 placeholder:text-zinc-500 transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="p-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg font-black shadow-[0_0_15px_rgba(250,204,21,0.45)] disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 shrink-0"
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
