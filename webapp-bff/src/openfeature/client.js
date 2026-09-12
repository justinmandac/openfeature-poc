const { OpenFeature } = require('@openfeature/server-sdk');
const OfrepServerProvider = require('./OfrepServerProvider');

const apiUrl = process.env.API_URL || 'http://localhost:4000';
const provider = new OfrepServerProvider({ baseUrl: apiUrl });

OpenFeature.setProvider(provider);
const client = OpenFeature.getClient('webapp-bff');

module.exports = {
  OpenFeature,
  client,
  provider
};
