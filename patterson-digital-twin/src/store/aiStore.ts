import { create } from 'zustand';
import type { ChatMessage, AiRecommendation } from '../types';
import { matchInsightScript, SUGGESTED_PROMPTS } from '../data/aiInsights';

interface DataSourceStatus {
  name: string;
  status: 'Live' | 'Cached' | 'Unavailable';
  lastSync: string;
}

interface AiState {
  messages: ChatMessage[];
  isThinking: boolean;
  isTyping: boolean;
  typingText: string;
  pinnedInsights: AiRecommendation[];
  dataSources: DataSourceStatus[];
  suggestedPrompts: string[];

  sendMessage: (text: string) => void;
  clearConversation: () => void;
  pinInsight: (insight: AiRecommendation) => void;
  unpinInsight: (title: string) => void;
}

const INITIAL_DATA_SOURCES: DataSourceStatus[] = [
  { name: 'SAP EWM – All 13 FCs', status: 'Live', lastSync: '2m ago' },
  { name: 'SAP ERP – Order Management', status: 'Live', lastSync: '5m ago' },
  { name: 'UPS Carrier API', status: 'Live', lastSync: 'Real-time' },
  { name: 'FedEx API', status: 'Live', lastSync: 'Real-time' },
  { name: 'Patterson TMS', status: 'Live', lastSync: '3m ago' },
  { name: 'Demand Forecast Engine', status: 'Cached', lastSync: '1h ago' },
  { name: 'Weather Service API', status: 'Live', lastSync: '15m ago' },
  { name: 'Carrier Performance Feed', status: 'Live', lastSync: '10m ago' },
];

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

export const useAiStore = create<AiState>((set) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: `**Welcome to Patterson SupplyIQ** — your network intelligence engine.

I'm connected to live data across your 13 fulfillment centers, carrier APIs, SAP EWM, and demand forecast systems. I can model scenarios, identify cost opportunities, surface risks, and generate recommendations across your $847M distribution network.

What would you like to explore today?`,
      timestamp: new Date().toISOString(),
      confidenceScore: 1.0,
      dataSourcesUsed: ['SAP EWM – All 13 FCs', 'UPS Carrier API', 'FedEx API'],
    },
  ],
  isThinking: false,
  isTyping: false,
  typingText: '',
  pinnedInsights: [],
  dataSources: INITIAL_DATA_SOURCES,
  suggestedPrompts: SUGGESTED_PROMPTS.slice(0, 4),

  sendMessage: (text) => {
    if (typingTimeout) clearTimeout(typingTimeout);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const thinkingMessage: ChatMessage = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isTyping: true,
    };

    set(state => ({
      messages: [...state.messages, userMessage, thinkingMessage],
      isThinking: true,
      typingText: '',
    }));

    const script = matchInsightScript(text);

    // Phase 1: Show thinking steps (1.8 seconds total)
    let thinkDelay = 200;
    script.thinkingSteps.forEach((step, i) => {
      setTimeout(() => {
        set({ typingText: step });
      }, thinkDelay + i * 200);
    });

    // Phase 2: Start typing the response
    const responseDelay = 200 + script.thinkingSteps.length * 200 + 400;

    setTimeout(() => {
      set({ isThinking: false, isTyping: true });

      const fullText = script.response;
      let charIndex = 0;
      let currentText = '';

      const typeChar = () => {
        if (charIndex < fullText.length) {
          const char = fullText[charIndex];
          currentText += char;

          // Update the thinking message with typed text
          set(state => ({
            messages: state.messages.map(m =>
              m.id === thinkingMessage.id ? { ...m, content: currentText, isTyping: true } : m
            ),
          }));

          charIndex++;
          const delay = char === '.' || char === '!' || char === '?' ? 80 :
                       char === ',' || char === ':' ? 40 : 18 + Math.random() * 12;
          typingTimeout = setTimeout(typeChar, delay);
        } else {
          // Typing complete — finalize message with recommendations
          set(state => ({
            isTyping: false,
            messages: state.messages.map(m =>
              m.id === thinkingMessage.id ? {
                ...m,
                content: fullText,
                isTyping: false,
                recommendations: script.recommendations,
                confidenceScore: script.confidenceScore,
                dataSourcesUsed: script.dataSourcesUsed,
              } : m
            ),
            suggestedPrompts: SUGGESTED_PROMPTS.filter(p => !p.toLowerCase().includes(text.substring(0, 10).toLowerCase())).slice(0, 4),
          }));
        }
      };

      typingTimeout = setTimeout(typeChar, 50);
    }, responseDelay);
  },

  clearConversation: () => {
    if (typingTimeout) clearTimeout(typingTimeout);
    set({
      messages: [],
      isThinking: false,
      isTyping: false,
      typingText: '',
    });
  },

  pinInsight: (insight) => {
    set(state => ({
      pinnedInsights: [...state.pinnedInsights.filter(i => i.title !== insight.title), insight],
    }));
  },

  unpinInsight: (title) => {
    set(state => ({
      pinnedInsights: state.pinnedInsights.filter(i => i.title !== title),
    }));
  },
}));
