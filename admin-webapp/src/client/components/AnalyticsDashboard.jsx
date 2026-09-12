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
      <div className="py-12 text-center text-slate-500 text-xs animate-pulse">
        Loading evaluation analytics and telemetry...
      </div>
    );
  }

  const flagMetrics = analytics?.flagMetrics || [];
  const trackingEvents = analytics?.trackingEvents || [];
  const totalEvaluations = flagMetrics.reduce((sum, m) => sum + m.totalEvaluations, 0);

  return (
    <div className="space-y-6 text-xs">
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalEvaluations.toLocaleString()}</div>
            <div className="text-xs text-slate-400 font-medium">Total Flag Evaluations</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{trackingEvents.reduce((s, e) => s + e.count, 0)}</div>
            <div className="text-xs text-slate-400 font-medium">Business Track Events (client.track)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluation Protocol</div>
            <div className="text-sm font-bold text-teal-300 mt-1">OFREP REST + SSE Live Stream</div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flag Variant Distribution Breakdown */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 font-bold text-white text-sm">
          <BarChart3 className="w-4 h-4 text-teal-400" />
          <span>Flag Evaluation & Variant Distribution Split</span>
        </div>

        <div className="space-y-3">
          {flagMetrics.map((item) => (
            <div key={item.flagKey} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white">{item.flagKey}</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {item.totalEvaluations} total evaluations
                </span>
              </div>

              {/* Progress split bar */}
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                {Object.entries(item.variants).map(([variant, count], idx) => {
                  const percent = Math.round((count / item.totalEvaluations) * 100);
                  const colors = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
                  const color = colors[idx % colors.length];
                  return (
                    <div
                      key={variant}
                      style={{ width: `${percent}%`, backgroundColor: color }}
                      title={`${variant}: ${count} (${percent}%)`}
                      className="h-full transition-all"
                    />
                  );
                })}
              </div>

              {/* Variant labels */}
              <div className="flex flex-wrap gap-3 pt-1 text-[11px]">
                {Object.entries(item.variants).map(([variant, count], idx) => {
                  const percent = Math.round((count / item.totalEvaluations) * 100);
                  const colors = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
                  return (
                    <div key={variant} className="flex items-center space-x-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className="text-slate-300">{variant}:</span>
                      <strong className="text-white">{count} ({percent}%)</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking Events Summary */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 font-bold text-white text-sm">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span>OpenFeature client.track() Business Outcomes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {trackingEvents.map((evt) => (
            <div key={evt.event} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="font-mono text-slate-300 text-xs">{evt.event}</span>
              <span className="font-bold text-teal-400 font-mono text-sm">{evt.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
