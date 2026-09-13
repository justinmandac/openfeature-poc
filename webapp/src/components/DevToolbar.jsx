import React, { useState } from 'react';
import {
  Sliders,
  ChevronUp,
  ChevronDown,
  User,
  Globe,
  Award,
  Zap,
  Radio,
  ExternalLink,
  Shield,
  Layers,
  X
} from 'lucide-react';
import { OpenFeature, useBooleanFlagValue, useObjectFlagValue } from '@openfeature/react-sdk';

const USERS = [
  { key: 'user-sg-vip', name: 'Sophia Chen (Singapore Premier VIP)', country: 'SG', tier: 'PREMIUM' },
  { key: 'user-us-reg', name: 'James Miller (US Standard User)', country: 'US', tier: 'STANDARD' },
  { key: 'user-beta-01', name: 'Alex Rivera (Internal Beta Tester)', country: 'GB', tier: 'STANDARD' }
];

export default function DevToolbar({ currentContext, onContextChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Live evaluated flag values
  const geminiUi = useBooleanFlagValue('feature.chatbot-gemini-ui', false);
  const advancedInsights = useBooleanFlagValue('feature.advanced-financial-insights', false);
  const banner = useObjectFlagValue('config.banner-announcement', null);

  const handleUserSelect = (key) => {
    const selected = USERS.find((u) => u.key === key);
    if (selected) {
      const newCtx = {
        ...currentContext,
        targetingKey: selected.key,
        country: selected.country,
        userTier: selected.tier
      };
      onContextChange(newCtx);
      OpenFeature.setContext(newCtx);
    }
  };

  const handleCountryChange = (country) => {
    const newCtx = { ...currentContext, country };
    onContextChange(newCtx);
    OpenFeature.setContext(newCtx);
  };

  const handleTierChange = (userTier) => {
    const newCtx = { ...currentContext, userTier };
    onContextChange(newCtx);
    OpenFeature.setContext(newCtx);
  };

  const currentPersona =
    USERS.find((u) => u.key === currentContext.targetingKey)?.name || currentContext.targetingKey;

  return (
    <aside aria-label="OpenFeature Evaluation Dock" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[calc(100%-2rem)] select-none">
      {/* Expanded Controls Drawer */}
      {isExpanded && (
        <div className="bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl shadow-2xl p-5 mb-2.5 backdrop-blur space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                OF
              </div>
              <span className="font-bold text-xs text-white">OpenFeature Evaluation & Targeting Dock</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                OFREP React Provider
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href="http://localhost:4001"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium mr-2"
              >
                <span>Admin Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Collapse toolbar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Persona Switcher */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Targeting Persona
              </label>
              <select
                value={currentContext.targetingKey}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                {USERS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Context Attributes (Country & Tier) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Context Overrides
              </label>
              <div className="flex items-center space-x-2">
                {/* Country */}
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] px-1 font-mono">Geo:</span>
                  {['SG', 'US', 'GB', 'PH'].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleCountryChange(c)}
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                        currentContext.country === c
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Tier */}
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] px-1 font-mono">Tier:</span>
                  {['STANDARD', 'PREMIUM'].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTierChange(t)}
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                        currentContext.userTier === t
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'PREMIUM' ? 'VIP' : 'STD'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Evaluated Flags State */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Client-Side Evaluated State
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400 truncate">gemini-ui</span>
                  <span className={geminiUi ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {geminiUi ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400 truncate">adv-insights</span>
                  <span className={advancedInsights ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
                    {advancedInsights ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Dock Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-slate-900/95 hover:bg-slate-900 text-white border border-slate-700/80 rounded-full px-4 py-2 shadow-xl backdrop-blur flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
      >
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold tracking-tight text-white">OpenFeature Dev Bar</span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
            <span>{currentContext.targetingKey}</span>
            <span className="text-slate-500">({currentContext.country} &bull; {currentContext.userTier})</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden sm:flex items-center space-x-1 text-[11px] font-mono text-slate-400">
            <span>Copilot:</span>
            <span className={geminiUi ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {geminiUi ? 'ON' : 'OFF'}
            </span>
            <span className="text-slate-600 ml-1">&bull;</span>
            <span className="ml-1">Insights:</span>
            <span className={advancedInsights ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
              {advancedInsights ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="p-1 rounded-full bg-slate-800 text-slate-300">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>
    </aside>
  );
}
