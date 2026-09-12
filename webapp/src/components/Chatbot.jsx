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
  AlertCircle
} from 'lucide-react';
import {
  PortfolioCard,
  LoanCalculatorCard,
  WealthInsightsCard,
  FxRatesCard
} from './GenerativeUiCards';

const QUICK_PROMPTS = [
  { label: '📊 Portfolio Breakdown', text: 'Show my portfolio breakdown' },
  { label: '💰 Loan Calculator', text: 'Can I get a loan quote?' },
  { label: '✨ Wealth Forecast', text: 'What are your wealth projections?' },
  { label: '💱 Live FX Rates', text: 'What are current foreign exchange rates?' }
];

export default function Chatbot({ currentContext, bffUrl = 'http://localhost:4002' }) {
  // Evaluates client-side OpenFeature flags reactively
  const geminiUiFlag = useBooleanFlagValue('feature.chatbot-gemini-ui', false);
  const advancedInsightsFlag = useBooleanFlagValue('feature.advanced-financial-insights', false);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello! I am your AI Financial Assistant. How can I help you today? Ask me for your portfolio allocation, loan quotes, or wealth forecasts.`,
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
        text: `Error contacting assistant service: ${err.response?.data?.error || err.message}. (Safe default fallback active)`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
      {/* Chatbot Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-sm">Financial Intelligence Assistant</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cross-tier OpenFeature Evaluation Demo (Client & BFF)
            </p>
          </div>
        </div>

        {/* Live Flag Status Badges */}
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
            geminiUiFlag
              ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
              : 'bg-slate-800 border border-slate-700 text-slate-400'
          }`}>
            Generative UI: {geminiUiFlag ? 'ON' : 'OFF'}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
            advancedInsightsFlag
              ? 'bg-purple-950 border border-purple-700 text-purple-300'
              : 'bg-slate-800 border border-slate-700 text-slate-400'
          }`}>
            Insights: {advancedInsightsFlag ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, index) => {
          const isBot = msg.sender === 'bot';
          return (
            <div key={index} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] flex space-x-3 ${isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  isBot ? 'bg-teal-950 border border-teal-700/80 text-teal-400' : 'bg-slate-800 border border-slate-700 text-slate-200'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isBot
                      ? msg.isError
                        ? 'bg-rose-950/60 border border-rose-800/80 text-rose-200 rounded-tl-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      : 'bg-teal-600 text-white font-medium rounded-tr-none shadow-md shadow-teal-900/30'
                  }`}>
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

                  <div className="text-[10px] text-slate-500 mt-1 px-1 flex items-center justify-between">
                    <span>{msg.timestamp}</span>
                    {isBot && msg.limitsApplied && (
                      <span className="font-mono text-[9px] text-slate-500">
                        Limits: maxTokens={msg.limitsApplied.maxTokens}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs py-2 px-3 bg-slate-950/60 rounded-xl w-fit border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></div>
            <span>Evaluating feature flags & generating response...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40 flex items-center space-x-2 overflow-x-auto">
        <span className="text-[10px] text-slate-500 font-medium flex-shrink-0">Quick Prompts:</span>
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => handleSend(qp.text)}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex-shrink-0 transition-colors border border-slate-700/60"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask about loans, wealth projection, portfolio..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition-all shadow-lg shadow-teal-900/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
