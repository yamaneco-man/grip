require('dotenv').config();
const { Client, Environment } = require('square');

// Square初期化（未設定時はnull）
let squareClient = null;

if (process.env.SQUARE_ACCESS_TOKEN && !process.env.SQUARE_ACCESS_TOKEN.startsWith('your-')) {
  squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
  });
}

// GRIPプラン定義
const PLANS = {
  free: { name: 'FREE', price: 0, lpLimit: 3, followerLimit: 50 },
  monitor: { name: 'MONITOR', price: 4980, lpLimit: null, followerLimit: 500 },
  standard: { name: 'STANDARD', price: 9800, lpLimit: null, followerLimit: 500 },
  pro: { name: 'PRO', price: 29800, lpLimit: null, followerLimit: null },
  vip: { name: 'VIP', price: 98000, lpLimit: null, followerLimit: null },
};

module.exports = { squareClient, PLANS };
