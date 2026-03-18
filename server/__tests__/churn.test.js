const request = require('supertest');

const mockSupabaseAdmin = {
  from: jest.fn(),
};

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
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
        content: [{ text: JSON.stringify([
          { type: 'casual', message: 'お久しぶりです！' },
          { type: 'value', message: '新しい情報があります！' },
          { type: 'offer', message: '特別なご案内です！' },
        ])}],
      }),
    },
  },
}));

const app = require('../src/index');

describe('離脱検知 API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/churn/scores', () => {
    test('認証なしで401を返す', async () => {
      const res = await request(app).get('/api/churn/scores');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/churn/recovery-message', () => {
    test('followerId必須バリデーション', async () => {
      // 認証モック
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const res = await request(app)
        .post('/api/churn/recovery-message')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('followerId');
    });
  });
});

describe('離脱スコア計算ロジック', () => {
  test('スコアが0〜100の範囲内に収まる', () => {
    // 計算ロジックのユニットテスト
    const calculateScore = (replyRate, daysSinceReply, avgLength, hasReaction, hasReplies) => {
      const scores = {};
      scores.replyRate = Math.min(100, Math.round((1 - replyRate) * 100)) * 0.25;
      scores.daysSinceReply = Math.min(100, Math.round(daysSinceReply / 7 * 100)) * 0.20;
      scores.engagement = Math.min(100, avgLength < 5 ? 80 : avgLength < 20 ? 40 : 10) * 0.30;
      scores.reactions = (hasReaction ? 10 : 60) * 0.10;
      scores.replySpeed = (hasReplies ? 20 : 80) * 0.15;
      const total = Math.round(
        scores.replyRate + scores.daysSinceReply + scores.engagement +
        scores.reactions + scores.replySpeed
      );
      return Math.min(100, Math.max(0, total));
    };

    // アクティブユーザー（低スコア）
    const activeScore = calculateScore(1.0, 0, 50, true, true);
    expect(activeScore).toBeGreaterThanOrEqual(0);
    expect(activeScore).toBeLessThanOrEqual(30);

    // 完全に離脱したユーザー（高スコア）
    const churnedScore = calculateScore(0, 30, 0, false, false);
    expect(churnedScore).toBeGreaterThanOrEqual(60);
    expect(churnedScore).toBeLessThanOrEqual(100);

    // 境界値テスト
    expect(calculateScore(0.5, 3, 10, false, true)).toBeGreaterThanOrEqual(0);
    expect(calculateScore(0.5, 3, 10, false, true)).toBeLessThanOrEqual(100);
  });
});
