import React, { useState } from 'react';
import { Play, Sparkles, CheckCircle2, AlertCircle, Clock, Code2, Copy, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function EvaluationPlayground({ flag, apiUrl }) {
  const [contextJson, setContextJson] = useState(
    JSON.stringify(
      {
        targetingKey: 'vip-client-8812',
        country: 'SG',
        businessUnit: 'Wealth Management',
        userTier: 'VIP',
        appId: 'webapp'
      },
      null,
      2
    )
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleRunEvaluation = async () => {
    if (!flag) return;
    setError(null);
    setLoading(true);
    const startTime = performance.now();

    try {
      let parsedContext = {};
      try {
        parsedContext = JSON.parse(contextJson);
      } catch (err) {
        throw new Error(`Invalid Context JSON: ${err.message}`);
      }

      const res = await axios.post(`${apiUrl}/ofrep/v1/evaluate/flags/${encodeURIComponent(flag.key)}`, {
        context: parsedContext
      });

      const elapsed = (performance.now() - startTime).toFixed(1);
      setLatencyMs(elapsed);
      setResult({
        ...res.data,
        etag: res.headers['etag'] || 'W/"live-etag-1"'
      });
    } catch (err) {
      setError(err.response?.data?.errorDetails || err.response?.data?.errorCode || err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetContext) => {
    setContextJson(JSON.stringify(presetContext, null, 2));
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Description & Quick Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium text-[11px]">Evaluation Context (OFREP)</span>
          <div className="flex items-center space-x-1 text-[10px]">
            <span className="text-slate-500">Presets:</span>
            <button
              onClick={() =>
                applyPreset({
                  targetingKey: 'sg-vip-user-01',
                  country: 'SG',
                  businessUnit: 'Wealth Management',
                  userTier: 'VIP'
                })
              }
              className="px-1.5 py-0.5 rounded bg-[#16223b] text-teal-300 hover:text-white"
            >
              SG VIP
            </button>
            <button
              onClick={() =>
                applyPreset({
                  targetingKey: 'retail-ph-user-42',
                  country: 'PH',
                  businessUnit: 'Retail Banking',
                  userTier: 'STANDARD'
                })
              }
              className="px-1.5 py-0.5 rounded bg-[#16223b] text-teal-300 hover:text-white"
            >
              PH Retail
            </button>
            <button
              onClick={() =>
                applyPreset({
                  targetingKey: 'anon-visitor-999',
                  country: 'US',
                  businessUnit: 'Consumer'
                })
              }
              className="px-1.5 py-0.5 rounded bg-[#16223b] text-teal-300 hover:text-white"
            >
              Anon Default
            </button>
          </div>
        </div>

        {/* JSON Context Textarea */}
        <div className="relative rounded-lg border border-[#1b2a47] bg-[#090f1c] overflow-hidden">
          <textarea
            value={contextJson}
            onChange={(e) => setContextJson(e.target.value)}
            rows={5}
            className="w-full bg-transparent p-2.5 text-slate-200 font-mono text-[11px] focus:outline-none resize-none leading-relaxed"
            placeholder="{ targetingKey: 'user-1' }"
          />
        </div>
      </div>

      {/* Evaluate Trigger Button */}
      <button
        onClick={handleRunEvaluation}
        disabled={loading}
        className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-teal-950 disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Evaluating against Core OFREP Engine...</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run OFREP Evaluation Simulator</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-900/80 text-rose-300 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <div className="font-bold text-[11px]">Evaluation Error</div>
            <div className="text-[11px] text-rose-200 font-mono break-words">{error}</div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="p-3.5 rounded-xl bg-[#090f1c] border border-teal-900/60 space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-[#16223b] pb-2">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolved Evaluation Result</span>
            </div>

            <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{latencyMs}ms</span>
              </span>
            </div>
          </div>

          {/* Grid of Outcome */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-[#111a2e] border border-[#1b2a47]">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Variant</span>
              <span className="font-mono font-bold text-teal-300 text-xs">
                {result.variant || 'N/A'}
              </span>
            </div>

            <div className="p-2 rounded bg-[#111a2e] border border-[#1b2a47]">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reason</span>
              <span className="font-mono font-bold text-white text-xs">
                {result.reason || 'TARGETING_MATCH'}
              </span>
            </div>
          </div>

          {/* Evaluated Value Box */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold">
              <span>Evaluated Value</span>
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-teal-400 hover:text-teal-300 lowercase font-mono"
              >
                {showRawJson ? 'hide raw' : 'view raw OFREP'}
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-[#070b14] border border-[#16223b] font-mono text-[11px] text-emerald-300 max-h-36 overflow-y-auto">
              {showRawJson ? (
                <pre className="text-slate-300 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : typeof result.value === 'object' ? (
                <pre className="text-slate-200 whitespace-pre-wrap">
                  {JSON.stringify(result.value, null, 2)}
                </pre>
              ) : (
                <span className="font-bold text-emerald-400">{String(result.value)}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
