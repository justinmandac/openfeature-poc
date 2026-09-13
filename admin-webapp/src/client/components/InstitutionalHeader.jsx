import React from 'react';
import {
  Radio,
  Clock,
  RefreshCw,
  Plus,
  Layers,
  Shield,
  Command
} from 'lucide-react';

export default function InstitutionalHeader({
  flagsCount = 0,
  sseConnected = false,
  onRefresh,
  onOpenCreate,
  onOpenScheduledModal,
  environment
}) {
  const isProd = environment?.startsWith('PROD');

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-5 flex items-center justify-between shrink-0 select-none z-30 text-zinc-200">
      {/* Left: System Breadcrumbs & Operational Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-zinc-400">Apex Platform</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-100 font-medium">FlagOps Management</span>
        </div>

        {/* Environment Safety Badge */}
        <div
          className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
            isProd
              ? 'bg-rose-950/60 border border-rose-800/80 text-rose-300'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
          }`}
        >
          <Shield className="w-3 h-3" />
          <span>{environment || 'PROD-US-EAST'}</span>
        </div>
      </div>

      {/* Center: Live Telemetry & Real Indicators */}
      <div className="hidden md:flex items-center space-x-3 text-xs">
        {/* Active Flags Count */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 text-[11px]">Flag Inventory:</span>
          <span className="font-mono font-semibold text-zinc-100 text-xs tabular-nums">{flagsCount}</span>
        </div>

        {/* SSE Live Connection Status */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800">
          <Radio className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 text-[11px]">SSE Sync:</span>
          <span className="flex items-center space-x-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sseConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span className="font-mono text-xs font-medium text-zinc-200">
              {sseConnected ? 'Live' : 'Connecting'}
            </span>
          </span>
        </div>
      </div>

      {/* Right: Quick Operational Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
          title="Refresh Flag Inventory"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenScheduledModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
        >
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Schedule Release</span>
        </button>

        {/* Solid High-Contrast Create Button (No Neon Gradient) */}
        <button
          onClick={onOpenCreate}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 text-zinc-950" />
          <span>New Flag</span>
        </button>
      </div>
    </header>
  );
}
