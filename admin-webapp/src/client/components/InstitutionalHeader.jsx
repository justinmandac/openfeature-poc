import React from 'react';
import {
  Activity,
  Radio,
  Clock,
  ShieldCheck,
  RefreshCw,
  Plus,
  Zap,
  Lock,
  Layers
} from 'lucide-react';

export default function InstitutionalHeader({
  flagsCount = 0,
  sseConnected = false,
  onRefresh,
  onOpenCreate,
  onOpenScheduledModal,
  environment
}) {
  return (
    <header className="h-14 bg-[#0c1322] border-b border-[#16223b] px-5 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: System Breadcrumbs & Operational Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-300">Apex Enterprise</span>
          <span className="text-slate-600">/</span>
          <span className="text-teal-400 font-mono font-medium">FlagOps Control Center</span>
        </div>

        <div className="hidden xl:flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#111a2e] border border-[#1b2a47] text-[10px] text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono">Node ID: OF-API-4000</span>
        </div>
      </div>

      {/* Center: Live Telemetry Pulse & Institutional Indicators */}
      <div className="hidden lg:flex items-center space-x-3 text-xs">
        {/* Active Flags Metric */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#111a2e] border border-[#1b2a47]">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-slate-400 text-[11px]">Active Flags:</span>
          <span className="font-mono font-bold text-white text-xs">{flagsCount}</span>
        </div>

        {/* Evaluation Throughput */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#111a2e] border border-[#1b2a47]">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400 text-[11px]">Throughput:</span>
          <span className="font-mono font-bold text-blue-300 text-xs">42.8k QPS</span>
        </div>

        {/* SSE Heartbeat */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#111a2e] border border-[#1b2a47]">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 text-[11px]">SSE Live Stream:</span>
          <span className="flex items-center space-x-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sseConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            ></span>
            <span className="font-mono text-emerald-300 font-semibold text-[11px]">
              {sseConnected ? 'Synced' : 'Connecting'}
            </span>
          </span>
        </div>

        {/* Risk Exposure */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#111a2e] border border-[#1b2a47]">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 text-[11px]">Risk Exposure:</span>
          <span className="font-mono font-bold text-emerald-400 text-xs">LOW (1.2%)</span>
        </div>

        {/* Governance & Compliance */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-wide">SOX / SOC2 Compliant</span>
        </div>
      </div>

      {/* Right: Quick Operational Actions */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-[#111a2e] hover:bg-[#16233d] text-slate-300 hover:text-white border border-[#1b2a47] transition-all"
          title="Refresh Flag Inventory"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenScheduledModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#111a2e] hover:bg-[#16233d] text-teal-300 hover:text-teal-200 border border-teal-900/60 text-xs font-medium transition-all"
        >
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">Schedule Release</span>
        </button>

        <button
          onClick={onOpenCreate}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-md shadow-teal-950 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Flag</span>
        </button>
      </div>
    </header>
  );
}
