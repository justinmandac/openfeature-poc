import React, { useState } from 'react';
import ContextBar from './components/ContextBar';
import AnnouncementBanner from './components/AnnouncementBanner';
import Chatbot from './components/Chatbot';
import FeatureDebugPanel from './components/FeatureDebugPanel';
import { Sparkles, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

export default function App() {
  const [currentContext, setCurrentContext] = useState({
    targetingKey: 'user-sg-vip',
    country: 'SG',
    userTier: 'PREMIUM',
    appId: 'webapp',
    appGroup: 'financial-portal',
    environment: 'production'
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Brand Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-lg">
              OF
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">Apex Digital Banking</span>
              <span className="text-xs font-semibold px-2 py-0.5 ml-2 rounded-full bg-teal-950 border border-teal-800 text-teal-300">
                OpenFeature Demo WebApp
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="http://localhost:4001"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition-all shadow-sm"
            >
              <span>Admin Control Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Dynamic Announcement Banner (Governed by config.banner-announcement) */}
      <AnnouncementBanner />

      {/* Interactive Context Switcher Toolbar */}
      <ContextBar
        currentContext={currentContext}
        onContextChange={(newCtx) => setCurrentContext(newCtx)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Chatbot & Feature Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Main: Financial Chatbot */}
          <div className="lg:col-span-8">
            <Chatbot currentContext={currentContext} />
          </div>

          {/* Right: Architectural Highlights & Feature Context */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4" />
                <span>OpenFeature Enterprise POC Highlights</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-white mb-1 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span>Standardized OFREP Protocol</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Evaluations use standard OpenFeature Remote Evaluation Protocol endpoints across React and NodeJS.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-white mb-1 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Targeting Rule Precedence</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Evaluates rules in order: User &rarr; Country &rarr; Business Unit &rarr; Safe Default Variant.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-white mb-1 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span>Instant SSE Live Sync</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Toggling flags in Admin Control Center triggers <code className="text-teal-300 font-mono">PROVIDER_CONFIGURATION_CHANGED</code>, updating the UI instantly without page reload.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Evaluation Inspector Panel */}
            <FeatureDebugPanel currentContext={currentContext} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        OpenFeature Enterprise Proof-of-Concept &bull; Built with OpenFeature React & Node SDKs &bull; OFREP & SSE
      </footer>
    </div>
  );
}
