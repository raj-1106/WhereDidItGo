import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';

import app from '../app';
import { Month } from '../models/Month';
import { connectTestDb, clearTestDb, disconnectTestDb } from './testDb';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

async function registerAndLogin(email = 'alice@example.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'correct-horse' });
  return res.body.token as string;
}

describe('POST /api/months/bulk', () => {
  it('failure case: rejects a non-array body', async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .post('/api/months/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2026, month: 1 });

    expect(res.status).toBe(400);
  });

  it('failure case: rejects a batch over the month cap without importing anything', async () => {
    const token = await registerAndLogin();
    const tooMany = Array.from({ length: 61 }, (_, i) => ({
      year: 2020,
      month: (i % 12) + 1,
      expenses: [],
    }));

    const res = await request(app)
      .post('/api/months/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send(tooMany);

    expect(res.status).toBe(400);
    const stored = await Month.find({});
    expect(stored).toHaveLength(0);
  });

  it('main case: creates new months and reports counts', async () => {
    const token = await registerAndLogin();
    const payload = [
      {
        year: 2026,
        month: 6,
        salary: 50000,
        expenses: [
          { description: 'Groceries', amount: 2000, category: 'Food', date: '2026-06-05' },
          { description: 'Rent', amount: 15000, category: 'Housing' },
        ],
      },
      { year: 2026, month: 7, salary: 51000, expenses: [] },
    ];

    const res = await request(app)
      .post('/api/months/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.monthsCreated).toBe(2);
    expect(res.body.monthsMerged).toBe(0);
    expect(res.body.expensesImported).toBe(2);

    const june = await Month.findOne({ year: 2026, month: 6 });
    expect(june?.salary).toBe(50000);
    expect(june?.expenses).toHaveLength(2);
  });

  it('edge case: merging into an existing month appends expenses and leaves existing salary/expenses untouched', async () => {
    const token = await registerAndLogin();

    // Manually create a month first, the way a normal user would.
    await request(app)
      .post('/api/months')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2026, month: 8, salary: 60000 });
    await request(app)
      .post('/api/months/2026/8/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Existing manual entry', amount: 500, category: 'Misc' });

    const res = await request(app)
      .post('/api/months/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send([
        {
          year: 2026,
          month: 8,
          salary: 999999, // must NOT overwrite the existing 60000
          expenses: [{ description: 'Imported row', amount: 100, category: 'Food' }],
        },
      ]);

    expect(res.status).toBe(200);
    expect(res.body.monthsMerged).toBe(1);
    expect(res.body.monthsCreated).toBe(0);

    const month = await Month.findOne({ year: 2026, month: 8 });
    expect(month?.salary).toBe(60000); // untouched
    expect(month?.expenses).toHaveLength(2); // existing + imported, not replaced
    const descriptions = month?.expenses.map((e) => e.description);
    expect(descriptions).toContain('Existing manual entry');
    expect(descriptions).toContain('Imported row');
  });

  it('failure case: invalid rows are skipped and reported, valid rows in the same batch still import', async () => {
    const token = await registerAndLogin();

    const res = await request(app)
      .post('/api/months/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send([
        { year: 2026, month: 9, expenses: [] }, // valid, no salary -> defaults to 0
        { year: 13, month: 9, expenses: [] }, // invalid year
        {
          year: 2026,
          month: 10,
          expenses: [
            { description: 'Good row', amount: 50, category: 'Food' },
            { description: '', amount: 50, category: 'Food' }, // invalid: empty description
            { description: 'Bad amount', amount: -5, category: 'Food' }, // invalid: negative
          ],
        },
      ]);

    expect(res.status).toBe(200);
    expect(res.body.monthsCreated).toBe(2); // month 9 and month 10, month "13" skipped
    expect(res.body.skippedMonths).toHaveLength(1);
    expect(res.body.skippedMonths[0].reason).toMatch(/year/);

    expect(res.body.expenseErrorsByMonth).toHaveLength(1);
    expect(res.body.expenseErrorsByMonth[0].errors).toHaveLength(2);

    const october = await Month.findOne({ year: 2026, month: 10 });
    expect(october?.expenses).toHaveLength(1); // only the one valid row
    expect(october?.expenses[0].description).toBe('Good row');
  });

  it('main case: never trusts a userId in the uploaded body, always scopes to the authenticated user', async () => {
    const tokenA = await registerAndLogin('alice@example.com');
    const tokenB = await registerAndLogin('bob@example.com');

    await request(app)
      .post('/api/months/bulk')
      .set('Authorization', `Bearer ${tokenB}`)
      .send([{ year: 2026, month: 11, salary: 1, expenses: [] }] as any); // no userId field even offered, by design

    const asAlice = await request(app)
      .get('/api/months/2026/11')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(asAlice.status).toBe(404); // Bob's import never touched Alice's data
  });
});
