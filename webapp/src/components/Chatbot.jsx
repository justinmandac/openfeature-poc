import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import {
  PortfolioCard,
  LoanCalculatorCard,
  WealthInsightsCard,
  FxRatesCard
} from './GenerativeUiCards';

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

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Good day! I am Apex Copilot, your AI Financial Assistant. How can I assist you with your accounts or portfolio today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastBffResponse, setLastBffResponse] = useState(null);

  const handleSend = async (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim()) return;

    const userMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${bffUrl}/api/chat`, {
        message: textToSend,
        context: currentContext
      });

      setLastBffResponse(res.data);

      const botMessage = {
        sender: 'bot',
        text: res.data.reply,
        generativeUi: res.data.generativeUi,
        flagsEvaluated: res.data.flagsEvaluated,
        limitsApplied: res.data.limitsApplied,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('BFF chat error:', err);
      const errorMessage = {
        sender: 'bot',
        text: `Unable to connect to assistant service: ${err.response?.data?.error || err.message}. Fallback mode active.`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[650px] overflow-hidden">
      {/* Copilot Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-xs tracking-tight">Apex Copilot</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[10px] text-slate-500">
              AI Financial Assistant &bull; Cross-Tier Evaluation
            </p>
          </div>
        </div>

        {/* Flag Status Badges & Close Button */}
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
              geminiUiFlag
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            Generative UI: {geminiUiFlag ? 'ON' : 'OFF'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
              advancedInsightsFlag
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            Insights: {advancedInsightsFlag ? 'ON' : 'OFF'}
          </span>

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

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.map((msg, index) => {
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
