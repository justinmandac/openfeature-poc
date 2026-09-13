import React from 'react';
import { Building2, Bell, Shield, ExternalLink, ChevronDown } from 'lucide-react';

export default function Header({ currentContext }) {
  // Derive display persona details from context
  const personaName =
    currentContext.targetingKey === 'user-sg-vip'
      ? 'Sophia Chen'
      : currentContext.targetingKey === 'user-us-reg'
      ? 'James Miller'
      : currentContext.targetingKey === 'user-beta-01'
      ? 'Alex Rivera'
      : currentContext.targetingKey;

  const initials = personaName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isPremier = currentContext.userTier === 'PREMIUM';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Institutional Crest & Navigation Tabs */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">Apex Bank</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Private Wealth
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-slate-300">
            <a href="#overview" className="text-white border-b-2 border-blue-500 pb-5 pt-5 font-semibold">
              Overview
            </a>
            <a href="#accounts" className="hover:text-white transition-colors pb-5 pt-5">
              Accounts & Vaults
            </a>
            <a href="#transfers" className="hover:text-white transition-colors pb-5 pt-5">
              Transfers & Pay
            </a>
            <a href="#investments" className="hover:text-white transition-colors pb-5 pt-5">
              Wealth & Markets
            </a>
          </nav>
        </div>

        {/* Right: Security Badge, Admin Console Link & Customer Profile */}
        <div className="flex items-center space-x-4">
          <a
            href="http://localhost:4001"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            title="OpenFeature FlagOps Control Center"
          >
            <span>Admin Console</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-1.5 right-1.5"></span>
          </button>

          {/* User Persona Profile Pill */}
          <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-semibold text-xs flex items-center justify-center border border-slate-600">
              {initials}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-white leading-tight">{personaName}</div>
              <div className="flex items-center space-x-1 mt-0.5">
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                    isPremier
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isPremier ? 'PREMIER' : 'STANDARD'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">[{currentContext.country}]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
