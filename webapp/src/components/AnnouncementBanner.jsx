import React from 'react';
import { useObjectFlagValue } from '@openfeature/react-sdk';
import { Megaphone, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';

const defaultBanner = {
  title: 'Welcome to Global Banking',
  message: 'Experience next-generation banking powered by runtime OpenFeature configuration.',
  urgency: 'info',
  cta: { label: 'Explore', link: '#' }
};

export default function AnnouncementBanner() {
  // Evaluates dynamic OBJECT flag via OpenFeature React hook
  const banner = useObjectFlagValue('config.banner-announcement', defaultBanner);

  if (!banner || !banner.title) return null;

  const isWarning = banner.urgency === 'warning';
  const isSuccess = banner.urgency === 'success';

  return (
    <div className={`border-b transition-colors ${
      isWarning
        ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
        : isSuccess
        ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
        : 'bg-blue-950/60 border-blue-800/80 text-blue-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2.5 text-center sm:text-left">
          {isWarning ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <Megaphone className="w-4 h-4 text-blue-400 flex-shrink-0" />
          )}
          <span>
            <strong className="font-semibold text-white mr-1.5">{banner.title}:</strong>
            {banner.message}
          </span>
        </div>

        {banner.cta && banner.cta.label && (
          <a
            href={banner.cta.link || '#'}
            className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition-all flex-shrink-0"
          >
            <span>{banner.cta.label}</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
