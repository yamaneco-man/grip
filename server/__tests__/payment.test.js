const request = require('supertest');

const mockSupabase = {
  auth: { getUser: jest.fn() },
};
const mockSupabaseAdmin = {
  from: jest.fn(),
};

jest.mock('../src/config/supabase', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabaseAdmin,
}));

jest.mock('../src/config/line', () => ({
  lineConfig: { channelAccessToken: 'test', channelSecret: 'test' },
  lineClient: { pushMessage: jest.fn(), getProfile: jest.fn() },
}));

jest.mock('../src/config/anthropic', () => ({
  anthropic: { messages: { create: jest.fn() } },
}));

const app = require('../src/index');

describe('Payment API (Square)', () => {
  describe('GET /api/payment/plans', () => {
    test('プラン一覧を返す', async () => {
      const res = await request(app).get('/api/payment/plans');
      expect(res.status).toBe(200);
      expect(res.body.free).toBeDefined();
      expect(res.body.standard).toBeDefined();
      expect(res.body.pro).toBeDefined();
      expect(res.body.vip).toBeDefined();
      expect(res.body.standard.price).toBe(9800);
    });
  });

  describe('POST /api/payment/checkout', () => {
    test('Square未設定時は503を返す', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const res = await request(app)
        .post('/api/payment/checkout')
        .set('Authorization', 'Bearer valid-token')
        .send({ plan: 'standard' });

      expect(res.status).toBe(503);
      expect(res.body.error).toContain('利用できません');
    });
  });

  describe('GET /api/payment/current-plan', () => {
    test('認証なしで401を返す', async () => {
      const res = await request(app).get('/api/payment/current-plan');
      expect(res.status).toBe(401);
    });
  });
});
