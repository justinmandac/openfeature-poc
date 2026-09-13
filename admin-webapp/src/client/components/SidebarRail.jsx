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
      label: 'Flag Inventory',
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
      label: 'Flag Hygiene & Debt',
      icon: ShieldAlert,
      badge: 'Debt',
      description: 'Lifecycle & cleanup matrix'
    },
    {
      id: 'ANALYTICS',
      label: 'Evaluation Analytics',
      icon: BarChart3,
      description: 'OFREP telemetry & metrics'
    },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between shrink-0 h-full select-none text-zinc-200">
      {/* Top Bank Branding & Environment */}
      <div className="flex flex-col">
        {/* Platform Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 font-bold text-sm shadow-xs">
              <Building2 className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xs text-white tracking-wide">APEX PLATFORM</span>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                  Core
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 font-medium">FlagOps Management</div>
            </div>
          </div>
        </div>

        {/* Environment Selector Dropdown */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-950">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
            <span>Environment</span>
            <span className="flex items-center text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>
              ACTIVE
            </span>
          </div>
          <div className="relative">
            <select
              value={environment}
              onChange={(e) => onEnvironmentChange(e.target.value)}
              className="w-full appearance-none bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100 font-medium focus:outline-none focus:border-zinc-500 cursor-pointer pr-8 hover:bg-zinc-850 transition-colors"
            >
              <option value="PROD-US-EAST">PROD-US-EAST (Production Primary)</option>
              <option value="PROD-APAC-01">PROD-APAC-01 (Singapore Region)</option>
              <option value="UAT-GLOBAL">UAT-GLOBAL (Staging/Validation)</option>
              <option value="DEV-LOCAL">DEV-LOCAL (Sandbox)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {environment.startsWith('PROD') && (
            <div className="mt-2 flex items-center space-x-1.5 px-2 py-1 rounded bg-rose-950/30 border border-rose-900/50 text-rose-300 text-[10px]">
              <Lock className="w-3 h-3 text-rose-400 shrink-0" />
              <span>Production Guardrails Active</span>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-2 py-3 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2.5 mb-2">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors group ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5 ml-2">
                  {item.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                        isActive
                          ? 'bg-zinc-700 text-white'
                          : 'bg-zinc-900 text-zinc-400'
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
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 space-y-2.5">
        {/* Cluster Status */}
        <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center space-x-1">
              <Server className="w-3 h-3 text-zinc-400" />
              <span>Cluster Region</span>
            </span>
            <span className="font-mono text-zinc-200 font-medium">US-EAST-01</span>
          </div>

          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center space-x-1">
              <Radio className="w-3 h-3 text-zinc-400" />
              <span>SSE Protocol</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  sseConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span className="font-mono text-[10px] text-zinc-300">
                {sseConnected ? 'Live Synced' : 'Connecting'}
              </span>
            </span>
          </div>
        </div>

        {/* Operator Profile */}
        <div className="flex items-center space-x-2 px-1">
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-[10px] shrink-0">
            EC
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-zinc-200 truncate">E. Chen</div>
            <div className="text-[10px] text-zinc-400 truncate">Platform Architect</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
