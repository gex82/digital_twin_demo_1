import { useState, useEffect, useRef, useMemo } from 'react';
import { Brain, Send, Pin, ChevronRight, Loader2, Database } from 'lucide-react';
import { useAiStore } from '../../store/aiStore';
import { useDemoStageBindings } from '../../hooks/useDemoStageBindings';
import type { AiRecommendation } from '../../types';
import { useShallow } from 'zustand/react/shallow';
import { useUiStore } from '../../store/uiStore';

const BLUE = '#006EFF';
const TEAL = '#00C2A8';
const BORDER = '#2e4168';
const SURFACE = '#1a2840';
const SURFACE2 = '#1e2f4a';
const GREEN = '#10b981';

const THINKING_LINES = [
  '→ Querying SAP EWM transactional data...',
  '→ Loading 164 active lane configurations...',
  '→ Cross-referencing carrier OTIF benchmarks...',
  '→ Running cost decomposition model...',
  '→ Analyzing 98,200 SKU demand patterns...',
  '→ Computing network flow optimization...',
  '→ Evaluating facility utilization matrix...',
  '→ Generating executive summary...',
];

const DATA_SOURCES = [
  { name: 'SAP EWM', status: 'Live', syncAgo: '2m ago', color: GREEN },
  { name: 'Network KPIs', status: 'Live', syncAgo: 'just now', color: GREEN },
  { name: 'OTIF Analytics', status: 'Cached', syncAgo: '14m ago', color: '#f59e0b' },
  { name: 'Carrier Performance', status: 'Live', syncAgo: '5m ago', color: GREEN },
  { name: 'Scenario Engine', status: 'Ready', syncAgo: '—', color: BLUE },
  { name: 'Demand Forecast', status: 'Cached', syncAgo: '1h ago', color: '#f59e0b' },
  { name: 'Cost Analytics', status: 'Live', syncAgo: '8m ago', color: GREEN },
  { name: 'Facilities DB', status: 'Live', syncAgo: '3m ago', color: GREEN },
];

const SUGGESTED_PROMPTS = [
  'Where are my biggest cost opportunities?',
  'Should we close Columbus FC?',
  "What's the ROI on Elgin automation?",
  'Show me carrier performance issues',
  'Midwest disruption response plan',
  'Give me a network overview',
];

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant' as const,
  content: `Welcome to Patterson SupplyIQ — your AI-powered supply chain decision engine.\n\nI have real-time access to your network data across 13 FCs, 187,400 daily orders, and 98,200 active SKUs. Ask me about cost optimization opportunities, scenario analysis, carrier performance, or network resilience.\n\nTry one of the suggested prompts below, or type your own question.`,
  timestamp: new Date().toISOString(),
  recommendations: [],
};

export default function AiInsightEngine() {
  const {
    messages,
    isThinking,
    isTyping,
    typingText,
    pinnedInsights,
    sendMessage,
    sendMessageAsync,
    pinInsight,
    createScenarioFromRecommendation,
  } = useAiStore(
    useShallow((state) => ({
      messages: state.messages,
      isThinking: state.isThinking,
      isTyping: state.isTyping,
      typingText: state.typingText,
      pinnedInsights: state.pinnedInsights,
      sendMessage: state.sendMessage,
      sendMessageAsync: state.sendMessageAsync,
      pinInsight: state.pinInsight,
      createScenarioFromRecommendation: state.createScenarioFromRecommendation,
    }))
  );
  const [input, setInput] = useState('');
  const [thinkingLineIdx, setThinkingLineIdx] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayMessages, setDisplayMessages] = useState(messages.length === 0 ? [WELCOME_MSG] : messages);
  const pushToast = useUiStore((state) => state.pushToast);

  useDemoStageBindings('/app/ai', useMemo(() => ({
    AI_SEND_STAGE_PROMPT: async (action) => {
      const payloadText = typeof action.payload?.text === 'string'
        ? action.payload.text
        : 'Summarize the best next move balancing cost and OTIF risk.';
      await sendMessageAsync(payloadText);
    },
    AI_PIN_TOP_RECOMMENDATION: async () => {
      const latestAssistant = [...useAiStore.getState().messages]
        .reverse()
        .find((message) => message.role === 'assistant' && (message.recommendations?.length ?? 0) > 0);
      const topRecommendation = latestAssistant?.recommendations?.[0];
      if (!topRecommendation) return;
      pinInsight(topRecommendation);
      createScenarioFromRecommendation(topRecommendation.title);
      pushToast({
        title: 'Recommendation Pinned',
        message: `${topRecommendation.title} converted into scenario draft.`,
        tone: 'success',
      });
    },
  }), [createScenarioFromRecommendation, pinInsight, pushToast, sendMessageAsync]));

  // Seed welcome on first load
  useEffect(() => {
    if (messages.length === 0) {
      setDisplayMessages([WELCOME_MSG]);
    } else {
      setDisplayMessages(messages);
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [displayMessages, isThinking, isTyping, typingText]);

  // Cycle through thinking lines
  useEffect(() => {
    if (!isThinking) { setThinkingLineIdx(0); return; }
    const interval = setInterval(() => {
      setThinkingLineIdx(i => (i + 1) % THINKING_LINES.length);
    }, 600);
    return () => clearInterval(interval);
  }, [isThinking]);

  function handleSend() {
    const text = input.trim();
    if (!text || isThinking || isTyping) return;
    setInput('');
    sendMessage(text);
  }

  function handlePrompt(p: string) {
    if (isThinking || isTyping) return;
    sendMessage(p);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const msgs = displayMessages.length > 0 ? displayMessages : messages;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#0A1628' }}>

      {/* LEFT: Data Context Panel */}
      <div style={{ width: 240, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '14px 14px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Database size={12} style={{ color: '#64748b' }} />
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Data Sources</span>
          </div>
          {DATA_SOURCES.map(ds => (
            <div key={ds.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: ds.color, boxShadow: `0 0 4px ${ds.color}` }} />
                <span style={{ color: '#cbd5e1', fontSize: 11 }}>{ds.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: ds.color, fontSize: 9, fontWeight: 600 }}>{ds.status}</div>
                <div style={{ color: '#475569', fontSize: 9 }}>{ds.syncAgo}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 14px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Suggested Prompts</div>
          {SUGGESTED_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => handlePrompt(p)}
              disabled={isThinking || isTyping}
              style={{
                width: '100%', textAlign: 'left', background: SURFACE2, border: `1px solid ${BORDER}`,
                borderRadius: 6, padding: '6px 8px', marginBottom: 5, color: '#94a3b8', fontSize: 11,
                cursor: 'pointer', lineHeight: 1.3,
              }}
            >
              <ChevronRight size={9} style={{ marginRight: 4, verticalAlign: 'middle', color: BLUE }} />
              {p}
            </button>
          ))}
        </div>

        <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, marginTop: 'auto' }}>
          <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 8 }}>
            <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Model</div>
            <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>SupplyIQ Engine v2.4</div>
            <div style={{ color: '#475569', fontSize: 9 }}>Digital Twin · 98,200 SKUs · 164 lanes</div>
          </div>
        </div>
      </div>

      {/* CENTER: Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: `1px solid ${BORDER}` }} data-demo-anchor="demo-ai-chat">
        {/* Chat header */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={16} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>Patterson SupplyIQ</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>Digital Twin Engine v2.4 · Network Intelligence</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
            <span style={{ color: GREEN, fontSize: 11 }}>Live</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {msgs.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                background: msg.role === 'user' ? `${BLUE}25` : SURFACE,
                border: `1px solid ${msg.role === 'user' ? `${BLUE}50` : BORDER}`,
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '10px 14px',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Brain size={9} style={{ color: '#fff' }} />
                    </div>
                    <span style={{ color: TEAL, fontSize: 10, fontWeight: 600 }}>SupplyIQ</span>
                  </div>
                )}
                <div style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>

              {/* Recommendations */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div style={{ maxWidth: '85%', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {msg.recommendations.map((rec: AiRecommendation, i: number) => (
                    <div
                      key={i}
                      style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${TEAL}` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{rec.title}</span>
                        {rec.impactUSD && (
                          <span style={{ color: GREEN, fontSize: 11, fontWeight: 700, marginLeft: 8 }}>
                            +${(rec.impactUSD / 1_000_000).toFixed(1)}M
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: 11, margin: 0, lineHeight: 1.5 }}>{rec.detail}</p>
                      <div style={{ marginTop: 7, display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            pinInsight(rec);
                            pushToast({
                              title: 'Insight Pinned',
                              message: `${rec.title} added to your action shortlist.`,
                              tone: 'info',
                            });
                          }}
                          style={{ background: `${TEAL}20`, border: `1px solid ${TEAL}40`, color: TEAL, borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}
                        >
                          Pin
                        </button>
                        <button
                          onClick={() => {
                            createScenarioFromRecommendation(rec.title);
                            pushToast({
                              title: 'Scenario Draft Created',
                              message: `${rec.title} handed off to Scenario Simulator.`,
                              tone: 'success',
                            });
                          }}
                          style={{ background: `${BLUE}20`, border: `1px solid ${BLUE}40`, color: BLUE, borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}
                        >
                          Create Scenario →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <span style={{ color: '#475569', fontSize: 9, marginTop: 2 }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}

          {/* Thinking state */}
          {isThinking && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px 12px 12px 2px', padding: '10px 14px', maxWidth: '85%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={9} style={{ color: '#fff' }} />
                  </div>
                  <span style={{ color: TEAL, fontSize: 10, fontWeight: 600 }}>SupplyIQ is analyzing</span>
                  <Loader2 size={10} style={{ color: TEAL, animation: 'spin 1s linear infinite' }} />
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {THINKING_LINES.slice(0, thinkingLineIdx + 1).map((line, i) => (
                    <div key={i} style={{ color: i === thinkingLineIdx ? TEAL : '#475569', marginBottom: 2 }}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Typing state */}
          {isTyping && typingText && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px 12px 12px 2px', padding: '10px 14px', maxWidth: '85%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={9} style={{ color: '#fff' }} />
                  </div>
                  <span style={{ color: TEAL, fontSize: 10, fontWeight: 600 }}>SupplyIQ</span>
                </div>
                <div style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {typingText}<span style={{ animation: 'blink 1s step-end infinite', borderRight: '2px solid #e2e8f0', marginLeft: 1 }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isThinking || isTyping ? 'SupplyIQ is responding...' : 'Ask SupplyIQ about your network...'}
              disabled={isThinking || isTyping}
              style={{
                flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
                padding: '10px 14px', color: '#e2e8f0', fontSize: 13, outline: 'none',
                opacity: isThinking || isTyping ? 0.6 : 1,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking || isTyping}
              style={{
                background: BLUE, border: 'none', color: '#fff', borderRadius: 8,
                padding: '10px 16px', cursor: 'pointer',
                opacity: !input.trim() || isThinking || isTyping ? 0.5 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 6 }}>
            Powered by Patterson SupplyIQ · Synthetic data for demonstration purposes
          </div>
        </div>
      </div>

      {/* RIGHT: Pinned Insights */}
      <div style={{ width: 280, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '14px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Pin size={12} style={{ color: '#64748b' }} />
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pinned Insights</span>
          </div>
        </div>

        <div style={{ flex: 1, padding: 12 }}>
          {pinnedInsights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#475569' }}>
              <Pin size={24} style={{ marginBottom: 8, opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 11, margin: 0 }}>Pin insights from the chat by clicking the pin icon on any AI response</p>
            </div>
          ) : (
            pinnedInsights.map((insight) => (
              <div key={insight.title} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{insight.title}</div>
                <p style={{ color: '#94a3b8', fontSize: 11, margin: 0, lineHeight: 1.5 }}>{insight.detail}</p>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Recent Analysis</div>
          {msgs.filter(m => m.role === 'assistant').slice(-3).reverse().map(m => (
            <div key={m.id} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
              <p style={{ color: '#94a3b8', fontSize: 10, margin: '0 0 3px', lineHeight: 1.4 }}>
                {m.content.slice(0, 80)}{m.content.length > 80 ? '...' : ''}
              </p>
              <span style={{ color: '#475569', fontSize: 9 }}>{new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>

        {/* Network snapshot */}
        <div style={{ padding: '12px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Network Snapshot</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'Total FCs', value: '13', icon: '🏭' },
              { label: 'Daily Orders', value: '187.4K', icon: '📦' },
              { label: 'OTIF', value: '97.2%', icon: '✅' },
              { label: 'Cost/Order', value: '$14.82', icon: '💰' },
            ].map(item => (
              <div key={item.label} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 8px' }}>
                <div style={{ fontSize: 12 }}>{item.icon}</div>
                <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>{item.value}</div>
                <div style={{ color: '#475569', fontSize: 9 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
