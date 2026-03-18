const crypto = require('crypto');
const request = require('supertest');

const mockSupabaseAdmin = {
  from: jest.fn(),
  rpc: jest.fn(),
};

const mockSupabase = {
  auth: { getUser: jest.fn() },
};

jest.mock('../src/config/supabase', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabaseAdmin,
}));

const mockLineClient = {
  pushMessage: jest.fn().mockResolvedValue({}),
  getProfile: jest.fn().mockResolvedValue({ displayName: 'テストユーザー' }),
};

jest.mock('../src/config/line', () => ({
  lineConfig: {
    channelAccessToken: 'test-token',
    channelSecret: 'test-line-secret',
  },
  lineClient: mockLineClient,
}));

jest.mock('../src/config/anthropic', () => ({
  anthropic: {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'ようこそ！' }],
      }),
    },
  },
}));

const app = require('../src/index');

// テスト用の署名生成
function generateSignature(body, secret) {
  return crypto
    .createHmac('SHA256', secret)
    .update(Buffer.from(JSON.stringify(body)))
    .digest('base64');
}

describe('LINE Webhook API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('署名なしで401を返す', async () => {
    const res = await request(app)
      .post('/api/line/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ events: [] }));

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('署名');
  });

  test('不正な署名で401を返す', async () => {
    const res = await request(app)
      .post('/api/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', 'invalid-signature')
      .send(JSON.stringify({ events: [] }));

    expect(res.status).toBe(401);
  });

  test('正しい署名で200を返す（空イベント）', async () => {
    const body = { events: [] };
    const signature = generateSignature(body, 'test-line-secret');

    const res = await request(app)
      .post('/api/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', signature)
      .send(JSON.stringify(body));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('フォローイベントの処理', async () => {
    const body = {
      events: [{
        type: 'follow',
        source: { userId: 'line-user-123' },
        replyToken: 'reply-token',
      }],
    };
    const signature = generateSignature(body, 'test-line-secret');

    // DB保存モック
    mockSupabaseAdmin.from.mockImplementation((table) => {
      if (table === 'line_followers') {
        return {
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'follower-123', display_name: 'テストユーザー' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'lps') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { product_name: 'テスト商品' },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'messages') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return { select: jest.fn().mockReturnValue({ eq: jest.fn() }) };
    });

    const res = await request(app)
      .post('/api/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', signature)
      .send(JSON.stringify(body));

    expect(res.status).toBe(200);
    expect(mockLineClient.getProfile).toHaveBeenCalledWith('line-user-123');
  });
});
