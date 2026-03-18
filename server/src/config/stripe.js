require('dotenv').config();

// Stripe初期化（未設定時はnull）
let stripe = null;

if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('your-')) {
  const Stripe = require('stripe');
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// GRIPプラン定義
const PLANS = {
  free: { name: 'FREE', price: 0, lpLimit: 3, followerLimit: 50 },
  standard: { name: 'STANDARD', price: 9800, lpLimit: null, followerLimit: 500 },
  pro: { name: 'PRO', price: 29800, lpLimit: null, followerLimit: null },
  vip: { name: 'VIP', price: 98000, lpLimit: null, followerLimit: null },
};

module.exports = { stripe, PLANS };
