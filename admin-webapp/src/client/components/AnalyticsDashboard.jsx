import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Zap, RefreshCw, PieChart, TrendingUp } from 'lucide-react';
import axios from 'axios';

export default function AnalyticsDashboard({ apiUrl }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/v1/admin/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [apiUrl]);

  if (loading && !analytics) {
    return (
      <div className="py-12 text-center text-zinc-500 font-mono text-xs animate-pulse">
        Loading evaluation analytics and telemetry...
      </div>
    );
  }

  const flagMetrics = analytics?.flagMetrics || [];
  const trackingEvents = analytics?.trackingEvents || [];
  const totalEvaluations = flagMetrics.reduce((sum, m) => sum + m.totalEvaluations, 0);

  return (
    <div className="space-y-6 text-xs text-zinc-200">
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">{totalEvaluations.toLocaleString()}</div>
            <div className="text-xs text-zinc-400 font-medium">Total Flag Evaluations</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {trackingEvents.reduce((s, e) => s + e.count, 0)}
            </div>
            <div className="text-xs text-zinc-400 font-medium">Client Track Events (OpenFeature)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Protocol Layer</div>
            <div className="text-xs font-mono font-medium text-zinc-200 mt-1">OFREP REST + SSE Stream</div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Flag Variant Distribution Breakdown */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xs">
        <div className="flex items-center space-x-2 font-semibold text-white text-sm">
          <BarChart3 className="w-4 h-4 text-zinc-400" />
          <span>Flag Evaluation & Variant Distribution</span>
        </div>

        <div className="space-y-3">
          {flagMetrics.map((item) => (
            <div key={item.flagKey} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-zinc-100">{item.flagKey}</span>
                <span className="text-zinc-400 font-mono text-[11px] tabular-nums">
                  {item.totalEvaluations.toLocaleString()} evaluations
                </span>
              </div>

              {/* Progress split bar */}
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden flex border border-zinc-800">
                {Object.entries(item.variants).map(([variant, count], idx) => {
                  const percent = Math.round((count / item.totalEvaluations) * 100);
                  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#64748B'];
                  const color = colors[idx % colors.length];
                  return (
                    <div
                      key={variant}
                      style={{ width: `${percent}%`, backgroundColor: color }}
                      title={`${variant}: ${count} (${percent}%)`}
                      className="h-full transition-all duration-300"
                    />
                  );
                })}
              </div>

              {/* Variant Legend */}
              <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono">
                {Object.entries(item.variants).map(([variant, count], idx) => {
                  const percent = Math.round((count / item.totalEvaluations) * 100);
                  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#64748B'];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={variant} className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-semibold">{variant}:</span>
                      <span>{count} ({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
