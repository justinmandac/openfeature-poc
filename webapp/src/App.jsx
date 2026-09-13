import React, { useState } from 'react';
import Header from './components/Header';
import AnnouncementBanner from './components/AnnouncementBanner';
import DashboardOverview from './components/DashboardOverview';
import Chatbot from './components/Chatbot';
import DevToolbar from './components/DevToolbar';
import { Bot, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { useBooleanFlagValue } from '@openfeature/react-sdk';

export default function App() {
  const [currentContext, setCurrentContext] = useState({
    targetingKey: 'user-sg-vip',
    country: 'SG',
    userTier: 'PREMIUM',
    appId: 'webapp',
    appGroup: 'financial-portal',
    environment: 'production'
  });

  const [isAssistantOpen, setIsAssistantOpen] = useState(true);

  // Evaluates client-side flag for Copilot
  const chatbotFlag = useBooleanFlagValue('feature.chatbot-gemini-ui', false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Institutional Apex Bank Header */}
      <Header currentContext={currentContext} />

      {/* Dynamic Announcement Banner (config.banner-announcement) */}
      <AnnouncementBanner />

      {/* Main Banking Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Financial Dashboard & Ledger */}
          <div className={isAssistantOpen ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'}>
            <DashboardOverview
              currentContext={currentContext}
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          </div>

          {/* Contextual Apex Copilot Assistant (feature.chatbot-gemini-ui) */}
          {isAssistantOpen && (
            <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
              <Chatbot
                currentContext={currentContext}
                onClose={() => setIsAssistantOpen(false)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Institutional Bank Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Apex Private Wealth & Custody. All rights reserved. Member FDIC / MAS Regulated.</span>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Security Disclosures</span>
            <span>&bull;</span>
            <span>API Status</span>
            <span>&bull;</span>
            <span>Terms of Custody</span>
          </div>
        </div>
      </footer>

      {/* Discreet Floating Developer Toolbar (Vercel/Stripe style) */}
      <DevToolbar
        currentContext={currentContext}
        onContextChange={(newCtx) => setCurrentContext(newCtx)}
      />
    </div>
  );
}
