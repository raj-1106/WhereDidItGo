import mongoose from 'mongoose';
import { Month } from '../../src/models/Month';
import { backfillUserId } from '../migrateAddUserId';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../../src/__tests__/testDb';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

// Bypass the schema's required-userId validation to simulate real pre-auth
// documents that predate the userId field entirely.
async function insertLegacyMonth(year: number, month: number, salary: number) {
  await Month.collection.insertOne({ year, month, salary, salaryDate: 7, expenses: [] } as any);
}

describe('backfillUserId', () => {
  it('failure case: rejects an invalid target user id without touching the DB', async () => {
    await insertLegacyMonth(2026, 1, 50000);
    await expect(backfillUserId('not-an-object-id', true)).rejects.toThrow(
      'targetUserId must be a valid Mongo ObjectId.'
    );
    const stillOrphaned = await Month.find({ userId: { $exists: false } });
    expect(stillOrphaned).toHaveLength(1);
  });

  it('edge case: dry run reports the count but writes nothing', async () => {
    await insertLegacyMonth(2026, 1, 50000);
    const targetId = new mongoose.Types.ObjectId().toString();

    const result = await backfillUserId(targetId, false);

    expect(result.dryRun).toBe(true);
    expect(result.found).toBe(1);
    expect(result.modified).toBe(0);
    const stillOrphaned = await Month.find({ userId: { $exists: false } });
    expect(stillOrphaned).toHaveLength(1); // nothing written
  });

  it('main case: backfills legacy docs and rebuilds the index', async () => {
    await insertLegacyMonth(2026, 1, 50000);
    await insertLegacyMonth(2026, 2, 55000);
    const targetId = new mongoose.Types.ObjectId().toString();

    const result = await backfillUserId(targetId, true);

    expect(result.dryRun).toBe(false);
    expect(result.found).toBe(2);
    expect(result.modified).toBe(2);

    const docs = await Month.find({});
    expect(docs).toHaveLength(2);
    docs.forEach((d) => expect(d.userId.toString()).toBe(targetId));

    const indexes = await Month.collection.indexes();
    const newIndex = indexes.find(
      (idx) => JSON.stringify(idx.key) === JSON.stringify({ userId: 1, year: 1, month: 1 })
    );
    expect(newIndex).toBeDefined();
    expect(newIndex?.unique).toBe(true);
  });

  it('edge case: a document that already has userId is left untouched and not double-counted', async () => {
    const existingUserId = new mongoose.Types.ObjectId();
    await Month.create({ userId: existingUserId, year: 2026, month: 3, salary: 60000, expenses: [] });
    await insertLegacyMonth(2026, 4, 40000);
    const targetId = new mongoose.Types.ObjectId().toString();

    const result = await backfillUserId(targetId, true);

    expect(result.found).toBe(1); // only the legacy doc, not the already-migrated one
    const migrated = await Month.findOne({ month: 3 });
    expect(migrated?.userId.toString()).toBe(existingUserId.toString()); // unchanged
  });
});
