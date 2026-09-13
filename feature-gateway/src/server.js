const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 4003;

const server = app.listen(PORT, () => {
  console.log(`🚀 Central Feature Gateway listening on http://localhost:${PORT}`);
  console.log(`📡 Multi-Channel OFREP endpoint: http://localhost:${PORT}/ofrep/v1/evaluate/flags`);
  console.log(`⚡ Real-time SSE event stream: http://localhost:${PORT}/api/v1/events/flags`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[Feature Gateway] Port ${PORT} already in use, reusing active listener.`);
  } else {
    console.error('[Feature Gateway] Server error:', err);
  }
});

module.exports = server;
