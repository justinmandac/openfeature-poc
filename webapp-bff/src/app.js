const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const { client } = require('./openfeature/client');
const { transactionContextMiddleware } = require('./openfeature/transactionContext');

const app = express();

app.use(cors());
app.use(express.json());

// Bind request context into ambient OpenFeature Transaction Context
app.use(transactionContextMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'webapp-bff', timestamp: new Date().toISOString() });
});

// Evaluate account flags endpoint using transaction context
app.get('/api/account/features', async (req, res) => {
  try {
    const [geminiUi, advancedInsights, limits] = await Promise.all([
      client.getBooleanValue('feature.chatbot-gemini-ui', false),
      client.getBooleanValue('feature.advanced-financial-insights', false),
      client.getObjectValue('config.chatbot-limits', {})
    ]);

    res.json({
      features: {
        geminiUi,
        advancedInsights,
        limits
      },
      context: req.evalContext
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api', chatRoutes);

module.exports = app;
