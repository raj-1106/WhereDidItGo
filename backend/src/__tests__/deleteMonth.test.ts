import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';

import app from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb } from './testDb';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

async function registerAndLogin(email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'correct-horse' });
  return res.body.token as string;
}

describe('DELETE /api/months/:year/:month', () => {
  it('failure case: unauthenticated request is rejected', async () => {
    const res = await request(app).delete('/api/months/2026/8');
    expect(res.status).toBe(401);
  });

  it('failure case: deleting a month that does not exist returns 404', async () => {
    const token = await registerAndLogin('alice@example.com');
    const res = await request(app)
      .delete('/api/months/2026/8')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('main case: deletes the month and it is actually gone afterward', async () => {
    const token = await registerAndLogin('alice@example.com');
    await request(app)
      .post('/api/months')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2026, month: 8, salary: 50000 });

    const del = await request(app)
      .delete('/api/months/2026/8')
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const after = await request(app)
      .get('/api/months/2026/8')
      .set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(404);
  });

  it("failure case: user B cannot delete user A's month", async () => {
    const tokenA = await registerAndLogin('alice@example.com');
    const tokenB = await registerAndLogin('bob@example.com');
    await request(app)
      .post('/api/months')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ year: 2026, month: 9, salary: 40000 });

    const del = await request(app)
      .delete('/api/months/2026/9')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(del.status).toBe(404); // looks like "not found" to Bob, not "forbidden"

    // Confirm it's still there for Alice, Bob's attempt did nothing.
    const stillThere = await request(app)
      .get('/api/months/2026/9')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(stillThere.status).toBe(200);
  });
});
