import React from 'react';
import { User, Globe, Award, Sliders, RefreshCw } from 'lucide-react';
import { OpenFeature } from '@openfeature/react-sdk';

const USERS = [
  { key: 'user-sg-vip', name: 'Sophia Chen (Singapore Premier VIP)', country: 'SG', tier: 'PREMIUM' },
  { key: 'user-us-reg', name: 'James Miller (US Standard User)', country: 'US', tier: 'STANDARD' },
  { key: 'user-beta-01', name: 'Alex Rivera (Internal Beta Tester)', country: 'GB', tier: 'STANDARD' }
];

export default function ContextBar({ currentContext, onContextChange }) {
  const handleUserSelect = (e) => {
    const selected = USERS.find(u => u.key === e.target.value);
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

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Quick Persona Switcher */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Evaluation Persona:</span>
            <select
              value={currentContext.targetingKey}
              onChange={handleUserSelect}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-teal-500"
            >
              {USERS.map(u => (
                <option key={u.key} value={u.key}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Context Attributes Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Country Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <span className="text-slate-400 text-[11px] mr-1">Country:</span>
            {['SG', 'US', 'GB', 'PH'].map(c => (
              <button
                key={c}
                onClick={() => handleCountryChange(c)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                  currentContext.country === c
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* User Tier Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <Award className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <span className="text-slate-400 text-[11px] mr-1">Tier:</span>
            {['STANDARD', 'PREMIUM'].map(t => (
              <button
                key={t}
                onClick={() => handleTierChange(t)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                  currentContext.userTier === t
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Active OpenFeature Context Summary */}
        <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Context: targetingKey={currentContext.targetingKey}, country={currentContext.country}, tier={currentContext.userTier}</span>
        </div>
      </div>
    </div>
  );
}
