import React from 'react';
import { createRoot } from 'react-dom/client';
import { OpenFeature, OpenFeatureProvider } from '@openfeature/react-sdk';
import { OfrepWebProvider } from './openfeature/OfrepWebProvider';
import App from './App';
import './index.css';

// Initial evaluation context
const initialContext = {
  targetingKey: 'user-sg-vip',
  country: 'SG',
  userTier: 'PREMIUM',
  appId: 'webapp',
  appGroup: 'financial-portal',
  environment: 'production'
};

// Initialize OpenFeature Web Provider (via Central Feature Gateway)
const gatewayUrl = import.meta.env.VITE_FEATURE_GATEWAY_URL || 'http://localhost:4003';
const provider = new OfrepWebProvider({ baseUrl: gatewayUrl });
OpenFeature.setContext(initialContext);
OpenFeature.setProvider(provider);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <OpenFeatureProvider>
        <App />
      </OpenFeatureProvider>
    </React.StrictMode>
  );
}
