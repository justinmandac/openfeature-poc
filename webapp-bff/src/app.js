const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const { client } = require('./openfeature/client');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'webapp-bff', timestamp: new Date().toISOString() });
});

// Evaluate account flags endpoint
app.get('/api/account/features', async (req, res) => {
  try {
    const { country = 'SG', userTier = 'STANDARD', targetingKey = 'anon-user' } = req.query;
    const context = { country, userTier, targetingKey, appId: 'bff' };

    const [geminiUi, advancedInsights, limits] = await Promise.all([
      client.getBooleanValue('feature.chatbot-gemini-ui', false, context),
      client.getBooleanValue('feature.advanced-financial-insights', false, context),
      client.getObjectValue('config.chatbot-limits', {}, context)
    ]);

    res.json({
      features: {
        geminiUi,
        advancedInsights,
        limits
      },
      context
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api', chatRoutes);

module.exports = app;
