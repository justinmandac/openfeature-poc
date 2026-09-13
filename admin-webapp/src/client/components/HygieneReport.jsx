import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function HygieneReport({ apiUrl, onOpenEdit }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHygiene = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/v1/admin/hygiene`);
      setIssues(res.data.hygieneIssues || []);
    } catch (err) {
      console.error('Failed to load hygiene report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHygiene();
  }, [apiUrl]);

  return (
    <div className="space-y-6 text-xs text-zinc-200">
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Flag Hygiene & Technical Debt</h3>
            <p className="text-xs text-zinc-400">
              Audit code technical debt, permanent features ready for code graduation, and inactive dormant flags.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-zinc-500 font-mono animate-pulse">
          Analyzing flag inventory and evaluation telemetry...
        </div>
      )}

      {!loading && issues.length === 0 && (
        <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="font-semibold text-white text-sm">Flag Inventory Healthy</h4>
          <p className="text-xs text-zinc-400">No stale flags, 100% saturated variants, or dormant disabled flags detected.</p>
        </div>
      )}

      <div className="space-y-3">
        {issues.map((issue, idx) => {
          const isHigh = issue.severity === 'HIGH';
          const isMed = issue.severity === 'MEDIUM';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-colors ${
                isHigh
                  ? 'bg-rose-950/20 border-rose-900/50 text-rose-200 border-l-4 border-l-rose-500'
                  : isMed
                  ? 'bg-amber-950/20 border-amber-900/50 text-amber-200 border-l-4 border-l-amber-500'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 border-l-4 border-l-blue-500'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold text-white text-xs">{issue.flagKey}</span>
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-mono font-semibold ${
                      isHigh
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {issue.type} &bull; {issue.severity}
                  </span>
                </div>
                <p className="text-zinc-300 text-xs">{issue.message}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[11px] font-medium text-zinc-400">
                  Recommended: Graduate or archive
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
