const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;
const API_URL = process.env.API_URL || 'http://localhost:4000';

app.use(cors());
app.use(express.json());

// Set up EJS view engine with layout rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets from public/
app.use(express.static(path.join(__dirname, '../public')));

// Helper for layout rendering
function renderWithLayout(res, view, data = {}) {
  res.render(view, data, (err, html) => {
    if (err) {
      console.error('EJS View Error:', err);
      return res.status(500).send(`Render Error: ${err.message}`);
    }
    res.render('layout', {
      ...data,
      body: html
    });
  });
}

// Routes
app.get('/', (req, res) => {
  renderWithLayout(res, 'index', {
    title: 'Flag Inventory & Governance',
    apiUrl: API_URL
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'admin-webapp', timestamp: new Date().toISOString() });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 OpenFeature Admin Web App listening on http://localhost:${PORT}`);
    console.log(`🔗 Connected to Core API at ${API_URL}`);
  });
}

module.exports = app;
