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

      const channel = parsedContext.channel || parsedContext.channelId || 'web';
      const headers = {
        'X-Client-App': 'admin-playground',
        'X-Channel': channel
      };
      if (parsedContext.targetingKey || parsedContext.userId) {
        headers['X-Actor'] = parsedContext.targetingKey || parsedContext.userId;
      }
      if (parsedContext.businessUnit) {
        headers['X-Business-Unit'] = parsedContext.businessUnit;
      }

      const simulationPayload = {
        ...parsedContext,
        appId: parsedContext.appId || 'admin-playground',
        callerApp: parsedContext.callerApp || 'admin-playground'
      };

      const res = await axios.post(
        `${apiUrl}/ofrep/v1/evaluate/flags/${encodeURIComponent(flag.key)}?appTag=admin&appId=admin-playground`,
        { context: simulationPayload },
        { headers }
      );

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
    <div className="space-y-4 text-xs text-zinc-200">
      {/* Description & Quick Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 font-medium text-[11px]">Evaluation Context (OFREP)</span>
          <div className="flex items-center space-x-1 text-[10px]">
            <span className="text-zinc-500 font-mono">Presets:</span>
            <button
              onClick={() =>
                applyPreset({
                  targetingKey: 'sg-vip-user-01',
                  country: 'SG',
                  businessUnit: 'Wealth Management',
                  userTier: 'VIP'
                })
              }
              className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 font-mono transition-colors"
            >
              SG VIP
            </button>
            <button
              onClick={() =>
                applyPreset({
                  targetingKey: 'hk-wealth-user-88',
                  country: 'HK',
                  businessUnit: 'Wealth Management',
                  userTier: 'PREMIUM'
                })
              }
              className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 font-mono transition-colors"
            >
              HK Wealth
            </button>
            <button
              onClick={() =>
                applyPreset({
                  targetingKey: 'uae-corp-user-12',
                  country: 'AE',
                  businessUnit: 'Treasury & Markets',
                  userTier: 'STANDARD'
                })
              }
              className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 font-mono transition-colors"
            >
              UAE Corp
            </button>
            <button
              onClick={() =>
                applyPreset({
                  targetingKey: 'in-retail-user-42',
                  country: 'IN',
                  businessUnit: 'Retail Banking',
                  userTier: 'STANDARD'
                })
              }
              className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 font-mono transition-colors"
            >
              India Retail
            </button>
          </div>
        </div>

        {/* JSON Context Textarea */}
        <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
          <textarea
            value={contextJson}
            onChange={(e) => setContextJson(e.target.value)}
            rows={5}
            className="w-full bg-transparent p-2.5 text-zinc-200 font-mono text-[11px] focus:outline-none resize-none leading-relaxed"
            placeholder="{ targetingKey: 'user-1' }"
          />
        </div>
      </div>

      {/* Evaluate Trigger Button */}
      <button
        onClick={handleRunEvaluation}
        disabled={loading}
        className="w-full py-2 px-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
            <span>Evaluating against OFREP Engine...</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current text-zinc-950" />
            <span>Run OFREP Evaluation Simulator</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <div className="font-semibold text-[11px]">Evaluation Error</div>
            <div className="text-[11px] text-rose-200 font-mono break-words">{error}</div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolved Evaluation Result</span>
            </div>

            <div className="flex items-center space-x-2 font-mono text-[10px] text-zinc-400">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>{latencyMs}ms</span>
              </span>
            </div>
          </div>

          {/* Grid of Outcome */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Variant</span>
              <span className="font-mono font-semibold text-zinc-100 text-xs">
                {result.variant || 'N/A'}
              </span>
            </div>

            <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Reason</span>
              <span className="font-mono font-semibold text-zinc-100 text-xs">
                {result.reason || 'TARGETING_MATCH'}
              </span>
            </div>
          </div>

          {/* Evaluated Value Box */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-semibold">
              <span>Evaluated Value</span>
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-zinc-400 hover:text-white lowercase font-mono transition-colors"
              >
                {showRawJson ? 'hide raw' : 'view raw OFREP'}
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-200 max-h-36 overflow-y-auto">
              {showRawJson ? (
                <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : typeof result.value === 'object' ? (
                <pre className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(result.value, null, 2)}
                </pre>
              ) : (
                <span className="font-semibold text-emerald-400">{String(result.value)}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
