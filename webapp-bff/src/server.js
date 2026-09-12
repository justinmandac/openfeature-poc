const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`🚀 WebApp BFF listening on http://localhost:${PORT}`);
  console.log(`💬 Chat API endpoint: http://localhost:${PORT}/api/chat`);
});
