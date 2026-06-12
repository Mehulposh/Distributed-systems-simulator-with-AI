import  { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BarChart2, RefreshCw } from 'lucide-react';
import { useAppStore } from '../zustand/UseAppstore.js';
import { aiAPI } from '../api/apiService.js';

const QUICK_PROMPTS = [
  { icon: '🔍', label: 'Analyze my architecture', prompt: 'Analyze my current architecture for bottlenecks and issues.' },
  { icon: '⚡', label: 'Optimize for performance', prompt: 'How can I optimize this architecture for lower latency?' },
  { icon: '🛡️', label: 'Single points of failure', prompt: 'What are the single points of failure in my design?' },
  { icon: '📈', label: 'Scale to 1M users', prompt: 'How would I scale this architecture to handle 1 million users?' },
  { icon: '💰', label: 'Cost optimization', prompt: 'How can I reduce infrastructure costs in this design?' },
  { icon: '🌍', label: 'Make it global', prompt: 'How would I make this architecture globally distributed?' },
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: isUser ? '#4c6ef5' : '#7c3aed',
          boxShadow: `0 0 10px ${isUser ? '#4c6ef540' : '#7c3aed40'}`,
        }}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed ${isUser ? 'text-white' : 'prose-dark'}`}
        style={{
          background: isUser ? '#4c6ef520' : '#12151d',
          border: `1px solid ${isUser ? '#4c6ef540' : '#1e2335'}`,
          color: isUser ? '#e2e8f0' : undefined,
        }}
        dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^• /gm, '• ')
            .replace(/\n/g, '<br/>'),
        }}
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#7c3aed' }}>
        <Bot size={13} />
      </div>
      <div className="rounded-xl px-4 py-3" style={{ background: '#12151d', border: '1px solid #1e2335' }}>
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#7c3aed',
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AIPanel() {
  
  const { nodes, edges, nodeMetrics, globalMetrics } = useAppStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm **ArchAI**, your distributed systems expert. I can analyze your architecture, identify bottlenecks, explain components, and help you design scalable systems.\n\nBuild an architecture on the canvas or ask me anything about distributed systems!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildContext = () => {
    if (!nodes.length) return null;
    const nodeList = nodes.map((n) => {
      const m = nodeMetrics.find((x) => x.nodeId === n.id);
      return `${n.data?.label} (${n.data?.type})${m ? ` - latency: ${m.latency}ms, errors: ${(m.errorRate * 100).toFixed(2)}%` : ''}`;
    }).join('\n');
    const edgeList = edges.map((e) => {
      const src = nodes.find((x) => x.id === e.source);
      const tgt = nodes.find((x) => x.id === e.target);
      return `${src?.data?.label} → ${tgt?.data?.label}`;
    }).join('\n');
    return `Current architecture:\nNodes:\n${nodeList}\n\nConnections:\n${edgeList}\n\nGlobal metrics: ${JSON.stringify(globalMetrics)}`;
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try{
        const context = buildContext()
        const data = await aiAPI.chat(
        newMessages.map((m) => ({
            role: m.role,
            content: m.content,
        })),
        context
        );

        console.log('chat response', data);

        // if (!response.ok) {
        // const error = await response.json();
        // throw new Error(error.error || 'Chat failed');
        // }

        // const data = await response.json();

        setMessages((prev) => [
        ...prev,
        {
            role: 'assistant',
            content: data.reply,
        },
        ]);
    }catch (err) {
        console.error(err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please check your API key and try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeArchitecture = async () => {
    if (!nodes.length) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Please add some components to the canvas first, then I can analyze your architecture.' },
      ]);
      return;
    }
    setAnalyzing(true);
    try {
      const res = await aiAPI.analyze({ nodes, edges, metrics: nodeMetrics });
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: '📊 Analyze my current architecture' },
        { role: 'assistant', content: res.analysis },
      ]);
    } catch (err) {
        console.error(err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Analysis failed. Please check your connection.' },
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: '#0d0f14' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid #1e2335', background: '#12151d' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#7c3aed' }}
          >
            <Sparkles size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">ArchAI</div>
            <div className="text-[10px] text-slate-500">Distributed Systems Expert</div>
          </div>
        </div>
        <button
          onClick={analyzeArchitecture}
          disabled={analyzing || !nodes.length}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: '#4c6ef520', color: '#6b8cff', border: '1px solid #4c6ef540' }}
        >
          {analyzing ? <RefreshCw size={11} className="animate-spin" /> : <BarChart2 size={11} />}
          Analyze
        </button>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-3 py-3 shrink-0" style={{ borderBottom: '1px solid #1e2335' }}>
          <div className="text-[10px] text-slate-600 mb-2 uppercase tracking-wider">Quick Actions</div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => sendMessage(qp.prompt)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all hover:bg-surface-400 text-[10px]"
                style={{ background: '#1e2335', border: '1px solid #2e3650' }}
              >
                <span>{qp.icon}</span>
                <span className="text-slate-300 leading-tight">{qp.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 shrink-0" style={{ borderTop: '1px solid #1e2335' }}>
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: '#12151d', border: '1px solid #2e3650' }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about your architecture... (Enter to send)"
            rows={2}
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none resize-none leading-relaxed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: '#4c6ef5' }}
          >
            <Send size={12} />
          </button>
        </div>
        <div className="text-[10px] text-slate-700 text-center mt-1.5">
          Powered by Claude · Shift+Enter for newline
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}