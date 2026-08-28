import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';

import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb } from './testDb';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('POST /api/auth/register', () => {
  it('main case: registers a new user and returns a usable token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'raj@example.com', password: 'correct-horse' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('raj@example.com');
    expect(res.body.user.passwordHash).toBeUndefined(); // never leak the hash
  });

  it('edge case: password under 8 characters is rejected', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'raj@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('failure case: duplicate email is rejected', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'raj@example.com', password: 'correct-horse' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'raj@example.com', password: 'different-pass' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'raj@example.com', password: 'correct-horse' });
  });

  it('main case: correct credentials return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'raj@example.com', password: 'correct-horse' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('failure case: wrong password is rejected', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'raj@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('failure case: unknown email gives the same error as wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});
