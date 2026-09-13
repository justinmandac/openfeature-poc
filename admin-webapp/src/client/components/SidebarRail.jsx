import React from 'react';
import {
  Layers,
  Users,
  Clock,
  ShieldAlert,
  BarChart3,
  Server,
  ChevronDown,
  Building2,
  Lock,
  Radio
} from 'lucide-react';

export default function SidebarRail({
  activeTab,
  onSelectTab,
  flagsCount = 0,
  environment,
  onEnvironmentChange,
  sseConnected
}) {
  const navItems = [
    {
      id: 'FLAGS',
      label: 'Flag Catalog',
      icon: Layers,
      count: flagsCount,
      description: 'Feature toggles & configs'
    },
    {
      id: 'SEGMENTS',
      label: 'Audience Segments',
      icon: Users,
      description: 'Reusable user targets'
    },
    {
      id: 'SCHEDULED',
      label: 'Scheduled Releases',
      icon: Clock,
      description: 'Automated release queue'
    },
    {
      id: 'HYGIENE',
      label: 'Stale Flags & Hygiene',
      icon: ShieldAlert,
      badge: 'Debt',
      description: 'Lifecycle & cleanup matrix'
    },
    {
      id: 'ANALYTICS',
      label: 'Evaluation Analytics',
      icon: BarChart3,
      description: 'OFREP telemetry & QPS'
    },
  ];

  return (
    <aside className="w-64 bg-[#0c1322] border-r border-[#16223b] flex flex-col justify-between shrink-0 h-full select-none">
      {/* Top Bank Branding & Environment */}
      <div className="flex flex-col">
        {/* Institutional Bank Header */}
        <div className="p-4 border-b border-[#16223b] flex items-center justify-between bg-[#090f1c]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-teal-900/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-white tracking-wide">APEX BANK</span>
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-teal-950 text-teal-300 border border-teal-800/80 rounded">
                  Tier-1
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">FlagOps Control Center</div>
            </div>
          </div>
        </div>

        {/* Environment Selector Dropdown */}
        <div className="p-3 border-b border-[#16223b] bg-[#0c1322]/80">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
            <span>Target Environment</span>
            <span className="flex items-center text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1 animate-pulse"></span>
              LIVE
            </span>
          </div>
          <div className="relative">
            <select
              value={environment}
              onChange={(e) => onEnvironmentChange(e.target.value)}
              className="w-full appearance-none bg-[#111a2e] border border-[#1b2a47] rounded-lg px-3 py-2 text-xs font-mono text-white font-medium focus:outline-none focus:border-teal-500 cursor-pointer pr-8 hover:bg-[#16233d] transition-colors"
            >
              <option value="PROD-US-EAST">PROD-US-EAST (Primary Live)</option>
              <option value="PROD-APAC-01">PROD-APAC-01 (Singapore Node)</option>
              <option value="UAT-GLOBAL">UAT-GLOBAL (Staging/Validation)</option>
              <option value="DEV-LOCAL">DEV-LOCAL (Sandbox)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {environment.startsWith('PROD') && (
            <div className="mt-2 flex items-center space-x-1.5 px-2 py-1 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[10px]">
              <Lock className="w-3 h-3 text-rose-400 shrink-0" />
              <span>Production Guardrails Active (Four-Eyes / Maker-Checker)</span>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Operations Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111a2e] border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5 ml-2">
                  {item.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        isActive
                          ? 'bg-teal-500/30 text-teal-200'
                          : 'bg-[#16223b] text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Institutional Telemetry & Operator Card */}
      <div className="p-3 border-t border-[#16223b] bg-[#090f1c] space-y-2.5">
        {/* Cluster Status */}
        <div className="p-2.5 rounded-lg bg-[#111a2e] border border-[#1b2a47] text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1">
              <Server className="w-3 h-3 text-slate-400" />
              <span>Cluster Node</span>
            </span>
            <span className="font-mono text-slate-200 font-medium">US-EAST-01</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1">
              <Radio className="w-3 h-3 text-slate-400" />
              <span>SSE Stream</span>
            </span>
            <span className="flex items-center space-x-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              ></span>
              <span className="font-mono text-[10px] text-slate-300">
                {sseConnected ? 'Synced (1.8ms)' : 'Connecting...'}
              </span>
            </span>
          </div>
        </div>

        {/* Operator Profile */}
        <div className="flex items-center space-x-2 px-1">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
            EC
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">E. Chen</div>
            <div className="text-[10px] text-slate-400 truncate">Lead Platform Architect</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
