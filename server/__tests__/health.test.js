const request = require('supertest');

// Supabaseモック（外部接続なしでテスト）
jest.mock('../src/config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
    },
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({ error: null, data: [] })),
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
          order: jest.fn(() => ({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

jest.mock('../src/config/line', () => ({
  lineConfig: { channelAccessToken: 'test', channelSecret: 'test' },
  lineClient: { pushMessage: jest.fn(), getProfile: jest.fn() },
}));

jest.mock('../src/config/anthropic', () => ({
  anthropic: { messages: { create: jest.fn() } },
}));

const app = require('../src/index');

describe('ヘルスチェック API', () => {
  test('GET /api/health が200を返す', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('GRIP API');
    expect(res.body.checks).toBeDefined();
  });

  test('タイムスタンプがISO形式', async () => {
    const res = await request(app).get('/api/health');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});

describe('404ハンドラー', () => {
  test('存在しないエンドポイントで404を返す', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('エンドポイントが見つかりません');
  });
});
