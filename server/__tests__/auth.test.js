const request = require('supertest');

const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
  },
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

describe('認証 API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    test('メール・パスワード必須バリデーション', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('必須');
    });

    test('正常な登録フロー', async () => {
      const mockUser = { id: 'user-123', email: 'test@test.com' };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token-123' } },
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({ error: null }),
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@test.com');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users');
    });
  });

  describe('POST /api/auth/login', () => {
    test('正常なログインフロー', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@test.com' },
          session: { access_token: 'token-456' },
        },
        error: null,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.session.access_token).toBe('token-456');
    });

    test('認証失敗時は401を返す', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: new Error('Invalid login credentials'),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    test('トークンなしで401を返す', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('トークン');
    });
  });
});
