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
    <div className="space-y-6 text-xs">
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Flag Hygiene & Stale Flag Diagnostics</h3>
            <p className="text-xs text-slate-400">
              Identify technical debt, permanent features ready for code graduation, and inactive disabled flags.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-500 animate-pulse">
          Analyzing flag inventory and evaluation telemetry...
        </div>
      )}

      {!loading && issues.length === 0 && (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="font-bold text-white text-sm">Flag Inventory Healthy</h4>
          <p className="text-xs text-slate-400">No stale flags, 100% saturated variants, or dormant disabled flags detected.</p>
        </div>
      )}

      <div className="space-y-3">
        {issues.map((issue, idx) => {
          const isHigh = issue.severity === 'HIGH';
          const isMed = issue.severity === 'MEDIUM';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                isHigh
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : isMed
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  : 'bg-blue-950/40 border-blue-800/80 text-blue-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-white text-xs">{issue.flagKey}</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    isHigh ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}>
                    {issue.type} &bull; {issue.severity}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">{issue.message}</p>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-[11px] font-medium text-slate-400">
                  Action recommended: Graduate or archive
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
