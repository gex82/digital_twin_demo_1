import { create } from 'zustand';
import type { ChatMessage, AiRecommendation } from '../types';
import { matchInsightScript, SUGGESTED_PROMPTS } from '../data/aiInsights';
import { useScenarioStore } from './scenarioStore';

interface DataSourceStatus {
  name: string;
  status: 'Live' | 'Cached' | 'Unavailable';
  lastSync: string;
}

export interface AiStoreSnapshot {
  messages: ChatMessage[];
  pinnedInsights: AiRecommendation[];
  suggestedPrompts: string[];
  dataSources: DataSourceStatus[];
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
  sendMessageAsync: (text: string) => Promise<void>;
  clearConversation: () => void;
  pinInsight: (insight: AiRecommendation) => void;
  unpinInsight: (title: string) => void;
  createScenarioFromRecommendation: (recId: string) => string | null;
  resetDemoState: () => void;
  getSnapshot: () => AiStoreSnapshot;
  restoreSnapshot: (snapshot: AiStoreSnapshot) => void;
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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: `**Welcome to Patterson SupplyIQ** — your network intelligence engine.

I'm connected to live data across your 13 fulfillment centers, carrier APIs, SAP EWM, and demand forecast systems. I can model scenarios, identify cost opportunities, surface risks, and generate recommendations across your $847M distribution network.

What would you like to explore today?`,
    timestamp: new Date().toISOString(),
    confidenceScore: 1,
    dataSourcesUsed: ['SAP EWM – All 13 FCs', 'UPS Carrier API', 'FedEx API'],
  },
];

const SCENARIO_TEMPLATE_BY_TYPE: Record<string, string> = {
  FCConsolidation: 'SCN-001',
  FCExpansion: 'SCN-002',
  CarrierShift: 'SCN-003',
  AutomationROI: 'SCN-004',
  InventoryReposition: 'SCN-005',
  DisruptionResponse: 'SCN-006',
  DemandSurge: 'SCN-007',
  HubSatelliteRedesign: 'SCN-008',
};

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export const useAiStore = create<AiState>((set, get) => ({
  messages: deepClone(INITIAL_MESSAGES),
  isThinking: false,
  isTyping: false,
  typingText: '',
  pinnedInsights: [],
  dataSources: deepClone(INITIAL_DATA_SOURCES),
  suggestedPrompts: SUGGESTED_PROMPTS.slice(0, 4),

  sendMessage: (text) => {
    void get().sendMessageAsync(text);
  },

  sendMessageAsync: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (get().isThinking || get().isTyping) return;

    const script = matchInsightScript(trimmed);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    const assistantMessageId = `assistant-${Date.now()}`;
    const placeholderAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isTyping: true,
    };

    set((state) => ({
      messages: [...state.messages, userMessage, placeholderAssistantMessage],
      isThinking: true,
      isTyping: false,
      typingText: '',
    }));

    for (const step of script.thinkingSteps) {
      set({ typingText: step });
      await sleep(180);
    }

    set({ isThinking: false, isTyping: true, typingText: '' });

    const fullText = script.response;
    let currentText = '';
    for (let i = 0; i < fullText.length; i += 1) {
      const char = fullText[i];
      currentText += char;
      set((state) => ({
        typingText: currentText,
        messages: state.messages.map((message) =>
          message.id === assistantMessageId
            ? { ...message, content: currentText, isTyping: true }
            : message
        ),
      }));
      const delay = char === '.' || char === '!' || char === '?' ? 28 : char === ',' || char === ':' ? 14 : 9;
      await sleep(delay);
    }

    set((state) => ({
      isThinking: false,
      isTyping: false,
      typingText: '',
      messages: state.messages.map((message) =>
        message.id === assistantMessageId
          ? {
              ...message,
              content: fullText,
              isTyping: false,
              recommendations: script.recommendations,
              confidenceScore: script.confidenceScore,
              dataSourcesUsed: script.dataSourcesUsed,
            }
          : message
      ),
      suggestedPrompts: SUGGESTED_PROMPTS.filter(
        (prompt) => !prompt.toLowerCase().includes(trimmed.substring(0, 10).toLowerCase())
      ).slice(0, 4),
    }));
  },

  clearConversation: () => {
    set({
      messages: [],
      isThinking: false,
      isTyping: false,
      typingText: '',
    });
  },

  pinInsight: (insight) => {
    set((state) => ({
      pinnedInsights: [...state.pinnedInsights.filter((item) => item.title !== insight.title), insight],
    }));
  },

  unpinInsight: (title) => {
    set((state) => ({
      pinnedInsights: state.pinnedInsights.filter((item) => item.title !== title),
    }));
  },

  createScenarioFromRecommendation: (recId) => {
    const normalizedId = recId.trim().toLowerCase();
    const pinned = get().pinnedInsights;
    let recommendation =
      pinned.find((item) => item.title.toLowerCase() === normalizedId) ??
      pinned.find((item) => item.title.toLowerCase().includes(normalizedId));

    if (!recommendation) {
      const latestWithRecs = [...get().messages]
        .reverse()
        .find((message) => message.role === 'assistant' && (message.recommendations?.length ?? 0) > 0);
      recommendation =
        latestWithRecs?.recommendations?.find((item) => item.title.toLowerCase() === normalizedId) ??
        latestWithRecs?.recommendations?.[0];
    }

    if (!recommendation) return null;

    const scenarioType = recommendation.scenarioType ?? 'CarrierShift';
    const templateId = SCENARIO_TEMPLATE_BY_TYPE[scenarioType] ?? 'SCN-003';
    const scenarioId = useScenarioStore.getState().createScenarioFromTemplate(templateId, {
      name: `AI: ${recommendation.title}`,
      description: recommendation.detail,
      tags: ['AI-Recommendation', 'Demo', recommendation.complexity],
      createdBy: 'SupplyIQ',
      assumptionNotes: `Generated from AI recommendation "${recommendation.title}" with ${recommendation.timeToValue} time-to-value.`,
    });
    useScenarioStore.getState().setActiveScenario(scenarioId);
    return scenarioId;
  },

  resetDemoState: () => {
    set({
      messages: deepClone(INITIAL_MESSAGES),
      isThinking: false,
      isTyping: false,
      typingText: '',
      pinnedInsights: [],
      dataSources: deepClone(INITIAL_DATA_SOURCES),
      suggestedPrompts: SUGGESTED_PROMPTS.slice(0, 4),
    });
  },

  getSnapshot: () => {
    const state = get();
    return {
      messages: deepClone(state.messages),
      pinnedInsights: deepClone(state.pinnedInsights),
      suggestedPrompts: [...state.suggestedPrompts],
      dataSources: deepClone(state.dataSources),
    };
  },

  restoreSnapshot: (snapshot) => {
    set({
      messages: deepClone(snapshot.messages),
      pinnedInsights: deepClone(snapshot.pinnedInsights),
      suggestedPrompts: [...snapshot.suggestedPrompts],
      dataSources: deepClone(snapshot.dataSources),
      isThinking: false,
      isTyping: false,
      typingText: '',
    });
  },
}));
