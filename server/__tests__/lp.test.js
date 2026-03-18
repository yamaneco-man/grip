const request = require('supertest');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
};

const mockSupabaseAdmin = {
  from: jest.fn(),
  rpc: jest.fn(),
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
  anthropic: {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: '<html><body>Generated LP</body></html>' }],
      }),
    },
  },
}));

const app = require('../src/index');

describe('LP API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/lp/generate', () => {
    test('認証なしで401を返す', async () => {
      const res = await request(app)
        .post('/api/lp/generate')
        .send({ productName: 'テスト商品', target: '20代女性' });

      expect(res.status).toBe(401);
    });

    test('商品名・ターゲット必須バリデーション', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const res = await request(app)
        .post('/api/lp/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('必須');
    });

    test('正常なLP生成フロー', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockLP = {
        id: 'lp-123',
        product_name: 'テスト商品',
        html_content: '<html>test</html>',
      };

      mockSupabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockLP, error: null }),
          }),
        }),
      });

      const res = await request(app)
        .post('/api/lp/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({ productName: 'テスト商品', target: '20代女性' });

      expect(res.status).toBe(200);
      expect(res.body.product_name).toBe('テスト商品');
    });
  });

  describe('GET /api/lp/view/:id', () => {
    test('存在しないLPで404を返す', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('not found'),
            }),
          }),
        }),
      });

      const res = await request(app).get('/api/lp/view/nonexistent-id');
      expect(res.status).toBe(404);
    });
  });
});
