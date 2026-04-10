const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Claude APIクライアント
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 120000,
  maxRetries: 2,
});

module.exports = { anthropic };
