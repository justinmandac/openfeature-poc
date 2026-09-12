const express = require('express');
const cors = require('cors');
const ofrepRoutes = require('./routes/ofrep');
const eventsRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// OpenAPI Spec summary
app.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'OpenFeature Core API',
      version: '1.1.0',
      description: 'Centralized OpenFeature OFREP, Flag Management, and Telemetry Service'
    },
    paths: {
      '/ofrep/v1/evaluate/flags/{key}': {
        post: { summary: 'Evaluate single flag via OFREP specification' }
      },
      '/ofrep/v1/evaluate/flags': {
        post: { summary: 'Bulk evaluate flags via OFREP specification with ETag caching' }
      },
      '/api/v1/events/flags': {
        get: { summary: 'Server-Sent Events stream for PROVIDER_CONFIGURATION_CHANGED' }
      },
      '/api/v1/admin/flags': {
        get: { summary: 'List all flags with inventory metadata' },
        post: { summary: 'Create new feature flag or dynamic configuration' }
      },
      '/api/v1/analytics/track': {
        post: { summary: 'Record OpenFeature client.track() business events' }
      }
    }
  });
});

// Mount Routes
app.use('/ofrep/v1', ofrepRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

module.exports = app;
