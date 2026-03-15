const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Claude APIクライアント
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

module.exports = { anthropic };
