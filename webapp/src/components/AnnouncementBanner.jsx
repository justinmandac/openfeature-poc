import React from 'react';
import { useObjectFlagValue } from '@openfeature/react-sdk';
import { Megaphone, AlertCircle, CheckCircle, Info, ArrowRight } from 'lucide-react';

const defaultBanner = {
  title: 'Welcome to Apex Wealth',
  message: 'Institutional grade security and real-time portfolio rebalancing are active.',
  urgency: 'info',
  cta: { label: 'Explore Services', link: '#accounts' }
};

export default function AnnouncementBanner() {
  // Evaluates dynamic OBJECT flag via OpenFeature React hook
  const banner = useObjectFlagValue('platform.banner.announcement', defaultBanner);

  if (!banner || !banner.title) return null;

  const isWarning = banner.urgency === 'warning';
  const isSuccess = banner.urgency === 'success';

  return (
    <div
      data-testid="announcement-banner"
      role="region"
      aria-label="Platform Announcement"
      className={`border-b text-xs transition-colors ${
        isWarning
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-blue-50/80 border-blue-200 text-blue-950'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          {isWarning ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : isSuccess ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
          )}
          <div className="text-xs flex items-center flex-wrap gap-1.5">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-medium">
              Platform BU
            </span>
            <span className="font-semibold mr-1">{banner.title}:</span>
            <span className="text-slate-700">{banner.message}</span>
          </div>
        </div>

        {banner.cta && banner.cta.label && (
          <a
            href={banner.cta.link || '#'}
            className="flex items-center space-x-1 px-3 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium text-[11px] shadow-sm transition-colors shrink-0"
          >
            <span>{banner.cta.label}</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
          </a>
        )}
      </div>
    </div>
  );
}
