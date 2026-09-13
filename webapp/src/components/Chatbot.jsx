import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useBooleanFlagValue } from '@openfeature/react-sdk';
import {
  Send,
  Bot,
  User,
  Sparkles,
  PieChart,
  Calculator,
  TrendingUp,
  DollarSign,
  AlertCircle,
  X,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import {
  PortfolioCard,
  LoanCalculatorCard,
  WealthInsightsCard,
  FxRatesCard
} from './GenerativeUiCards';

const STORAGE_KEY = 'apex_copilot_histories_v1';

const PERSONA_CONFIG = {
  'user-sg-vip': {
    name: 'Sophia Chen',
    title: 'Singapore Premier VIP',
    badge: 'SG • Premier VIP',
    country: 'SG',
    greeting: 'Good day, Ms. Chen! Welcome to Apex Singapore Private Wealth. Your dedicated liquidity and wealth modeling facilities are active. With SGD fixed deposit yields at 3.8% and Premier margin lending enabled, how may I assist your portfolio today?'
  },
  'user-hk-vip': {
    name: 'Marcus Leung',
    title: 'Hong Kong Private Wealth',
    badge: 'HK • Private Wealth',
    country: 'HK',
    greeting: 'Welcome back, Mr. Leung! Apex Hong Kong Private Wealth is at your service. Cross-currency HKD/CNH liquidity facilities, institutional IPO allocations, and structured custody are online. How can I assist with your asset positions today?'
  },
  'user-ae-standard': {
    name: 'Rashid Al-Maktoum',
    title: 'UAE Commercial Client',
    badge: 'AE • Commercial Client',
    country: 'AE',
    greeting: 'Marhaban, Mr. Al-Maktoum! Welcome to Apex UAE Commercial Custody. Your commercial lending facilities and competitive interbank AED foreign exchange calculators are ready. What accounts would you like to review?'
  },
  'user-in-standard': {
    name: 'Priya Sharma',
    title: 'India Standard Retail',
    badge: 'IN • Standard Retail',
    country: 'IN',
    greeting: 'Namaste, Priya! Welcome to Apex India Retail Banking. Note: interactive Generative UI widgets are paused under local regulatory compliance review in India; textual advisory and loan guidance remain fully functional. How can I assist you today?'
  },
  'user-beta-01': {
    name: 'Alex Rivera',
    title: 'Internal Beta Tester',
    badge: 'SG • Beta Tester',
    country: 'SG',
    greeting: 'Welcome back, Alex! Apex Developer & Beta Preview environment active. All experimental generative cards, bleeding-edge flag variants, and relaxed token limits are enabled for your targeting session. What would you like to benchmark?'
  }
};

function loadStoredHistories() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.warn('Failed to load copilot histories from localStorage:', e);
    return {};
  }
}

function saveStoredHistories(histories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
  } catch (e) {
    console.warn('Failed to save copilot histories to localStorage:', e);
  }
}

function getInitialPersonaGreeting(context) {
  const key = context?.targetingKey || 'anonymous-user';
  const config = PERSONA_CONFIG[key];
  const greetingText = config
    ? config.greeting
    : 'Good day! I am Apex Copilot, your AI Financial Assistant. How can I assist you with your accounts or portfolio today?';

  return [
    {
      sender: 'bot',
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];
}

const QUICK_PROMPTS = [
  { label: '📊 Asset Allocation', text: 'Show my portfolio breakdown' },
  { label: '💰 Loan Calculator', text: 'Can I get a loan quote?' },
  { label: '✨ Wealth Forecast', text: 'What are your wealth projections?' },
  { label: '💱 Live FX Rates', text: 'What are current foreign exchange rates?' }
];

export default function Chatbot({
  currentContext,
  bffUrl = 'http://localhost:4002',
  onClose
}) {
  // Evaluates client-side OpenFeature flags reactively
  const geminiUiFlag = useBooleanFlagValue('feature.chatbot-gemini-ui', false);
  const advancedInsightsFlag = useBooleanFlagValue('feature.advanced-financial-insights', false);

  const currentKey = currentContext?.targetingKey || 'anonymous-user';
  const currentPersona = PERSONA_CONFIG[currentKey] || {
    name: currentKey,
    title: 'Client',
    badge: `${currentContext?.country || 'SG'} • ${currentContext?.userTier || 'STANDARD'}`
  };

  const [histories, setHistories] = useState(loadStoredHistories);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const messagesEndRef = useRef(null);

  // Active persona conversation thread
  const currentThread = (histories[currentKey] && histories[currentKey].length > 0)
    ? histories[currentKey]
    : getInitialPersonaGreeting(currentContext);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentKey, currentThread, loading]);

  const handleSend = async (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim()) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: now
    };

    const threadWithUser = [...currentThread, userMessage];

    // Optimistically update thread for this persona
    setHistories((prev) => {
      const updated = {
        ...prev,
        [currentKey]: threadWithUser
      };
      saveStoredHistories(updated);
      return updated;
    });

    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${bffUrl}/api/chat`,
        {
          message: textToSend,
          context: currentContext
        },
        {
          headers: {
            'x-targeting-key': currentKey
          }
        }
      );

      const botMessage = {
        sender: 'bot',
        text: res.data.reply,
        generativeUi: res.data.generativeUi,
        flagsEvaluated: res.data.flagsEvaluated,
        limitsApplied: res.data.limitsApplied,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistories((prev) => {
        const existing = prev[currentKey] || threadWithUser;
        const updated = {
          ...prev,
          [currentKey]: [...existing, botMessage]
        };
        saveStoredHistories(updated);
        return updated;
      });
    } catch (err) {
      console.error('BFF chat error:', err);
      const errorMessage = {
        sender: 'bot',
        text: `Unable to connect to assistant service: ${err.response?.data?.error || err.message}. Fallback mode active.`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistories((prev) => {
        const existing = prev[currentKey] || threadWithUser;
        const updated = {
          ...prev,
          [currentKey]: [...existing, errorMessage]
        };
        saveStoredHistories(updated);
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetThread = async () => {
    setIsResetting(true);
    const freshGreeting = getInitialPersonaGreeting(currentContext);

    setHistories((prev) => {
      const updated = {
        ...prev,
        [currentKey]: freshGreeting
      };
      saveStoredHistories(updated);
      return updated;
    });

    try {
      await axios.delete(`${bffUrl}/api/chat/history`, {
        params: { targetingKey: currentKey },
        headers: { 'x-targeting-key': currentKey }
      });
    } catch (err) {
      console.warn('Failed to clear BFF history:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[650px] overflow-hidden">
      {/* Copilot Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-slate-900 text-xs tracking-tight whitespace-nowrap">Apex Copilot</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="System Online"></span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                {currentContext?.country || currentPersona.country || 'SG'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate font-medium">
              {currentPersona.name} &bull; <span className="text-slate-400 font-normal">{currentPersona.badge || currentPersona.title}</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={handleResetThread}
            disabled={isResetting || loading}
            className="px-2 py-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5 text-[11px] disabled:opacity-40"
            title={`Reset thread for ${currentPersona.name}`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-600' : ''}`} />
            <span className="font-medium text-[11px]">Reset</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              title="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Header: Evaluated Flags Status Strip */}
      <div className="px-4 py-1.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between text-[10px]">
        <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
          <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
          <span>Flag Targeting:</span>
        </div>
        <div className="flex items-center space-x-1.5 font-mono">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              geminiUiFlag
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            GenUI: {geminiUiFlag ? 'ON' : 'OFF'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              advancedInsightsFlag
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            Insights: {advancedInsightsFlag ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {currentThread.map((msg, index) => {
          const isBot = msg.sender === 'bot';
          return (
            <div key={index} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] flex space-x-2.5 ${isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    isBot
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Message Body */}
                <div>
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      isBot
                        ? msg.isError
                          ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-none'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                        : 'bg-slate-900 text-white font-normal rounded-tr-none shadow-xs'
                    }`}
                  >
                    {msg.text}

                    {/* Generative UI Components */}
                    {isBot && msg.generativeUi && (
                      <div className="mt-2">
                        {msg.generativeUi.type === 'portfolio_chart' && (
                          <PortfolioCard data={msg.generativeUi.data} title={msg.generativeUi.title} />
                        )}
                        {msg.generativeUi.type === 'loan_calculator' && (
                          <LoanCalculatorCard data={msg.generativeUi.data} title={msg.generativeUi.title} />
                        )}
                        {msg.generativeUi.type === 'wealth_insights_model' && (
                          <WealthInsightsCard data={msg.generativeUi.data} title={msg.generativeUi.title} />
                        )}
                        {msg.generativeUi.type === 'fx_rates_card' && (
                          <FxRatesCard data={msg.generativeUi.data} title={msg.generativeUi.title} />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 px-1 flex items-center justify-between">
                    <span>{msg.timestamp}</span>
                    {isBot && msg.limitsApplied && (
                      <span className="font-mono text-[9px] text-slate-400">
                        maxTokens: {msg.limitsApplied.maxTokens}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs py-2 px-3 bg-slate-50 rounded-lg w-fit border border-slate-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Evaluating flags & synthesizing response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center space-x-1.5 overflow-x-auto">
        <span className="text-[10px] text-slate-400 font-medium flex-shrink-0 mr-1">Prompts:</span>
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => handleSend(qp.text)}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium flex-shrink-0 transition-colors border border-slate-200 shadow-2xs"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask about your accounts, loan terms, portfolio..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
