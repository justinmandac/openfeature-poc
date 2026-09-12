import React, { useState } from 'react';
import {
  Code,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { useFlag, useBooleanFlagValue, useObjectFlagValue } from '@openfeature/react-sdk';

export default function FeatureDebugPanel({ currentContext }) {
  const [expanded, setExpanded] = useState(false);

  // Evaluate flags via OpenFeature React SDK
  const geminiDetails = useFlag('feature.chatbot-gemini-ui', false);
  const insightsDetails = useFlag('feature.advanced-financial-insights', false);
  const bannerDetails = useFlag('config.banner-announcement', {});

  const flags = [
    {
      key: 'feature.chatbot-gemini-ui',
      type: 'BOOLEAN',
      eval: geminiDetails,
      description: 'Generative UI cards in Chatbot'
    },
    {
      key: 'feature.advanced-financial-insights',
      type: 'BOOLEAN',
      eval: insightsDetails,
      description: 'AI wealth projection forecast'
    },
    {
      key: 'config.banner-announcement',
      type: 'OBJECT',
      eval: bannerDetails,
      description: 'Dynamic regional marketing banner'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs flex items-center space-x-2">
              <span>OpenFeature Live Evaluation Inspector</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-[10px] text-emerald-300 font-mono">
                OFREP + SSE Active
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Inspect how targeting rules evaluate dynamically against current persona attributes
            </p>
          </div>
        </div>

        <button className="p-1 text-slate-400 hover:text-white">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          {/* Active Context Attributes */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
            <span className="text-slate-400 font-semibold block mb-1">Active Evaluation Context:</span>
            <pre className="text-teal-300 font-mono text-[10px] overflow-x-auto">
              {JSON.stringify(currentContext, null, 2)}
            </pre>
          </div>

          {/* Flags Evaluation Grid */}
          <div className="space-y-2">
            {flags.map((item) => {
              const res = item.eval;
              const isMatch = res.reason === 'TARGETING_MATCH';
              const isDefault = res.reason === 'DEFAULT';
              const isDisabled = res.reason === 'DISABLED';

              return (
                <div
                  key={item.key}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-white">{item.key}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Resolution Reason Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      isMatch
                        ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                        : isDisabled
                        ? 'bg-rose-950 border border-rose-800 text-rose-300'
                        : 'bg-amber-950 border border-amber-800 text-amber-300'
                    }`}>
                      reason: {res.reason || 'TARGETING_MATCH'}
                    </span>

                    {/* Variant / Value */}
                    <div className="font-mono text-xs text-right">
                      <span className="text-slate-400 mr-1">variant:</span>
                      <strong className="text-teal-300">{res.variant || 'active'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
