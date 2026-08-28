/**
 * One-time migration for pre-auth Month documents.
 *
 * Run locally, against your own MONGODB_URI (never pasted into chat).
 * Defaults to a dry run — nothing is written until you pass --confirm.
 *
 * Usage:
 *   MONGODB_URI="..." npx ts-node scripts/migrateAddUserId.ts <targetUserId>
 *   MONGODB_URI="..." npx ts-node scripts/migrateAddUserId.ts <targetUserId> --confirm
 */
import mongoose from 'mongoose';
import { Month } from '../src/models/Month';

export interface MigrationResult {
  found: number;
  modified: number;
  staleIndexDropped: string | null;
  dryRun: boolean;
}

export async function backfillUserId(
  targetUserId: string,
  confirm: boolean
): Promise<MigrationResult> {
  if (!mongoose.isValidObjectId(targetUserId)) {
    throw new Error('targetUserId must be a valid Mongo ObjectId.');
  }

  const orphaned = await Month.find({ userId: { $exists: false } });

  if (!confirm) {
    return { found: orphaned.length, modified: 0, staleIndexDropped: null, dryRun: true };
  }

  let modified = 0;
  if (orphaned.length > 0) {
    const result = await Month.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: new mongoose.Types.ObjectId(targetUserId) } }
    );
    modified = result.modifiedCount;
  }

  const indexes = await Month.collection.indexes();
  const staleIndex = indexes.find(
    (idx) => JSON.stringify(idx.key) === JSON.stringify({ year: 1, month: 1 })
  );
  let staleIndexDropped: string | null = null;
  if (staleIndex?.name) {
    await Month.collection.dropIndex(staleIndex.name);
    staleIndexDropped = staleIndex.name;
  }

  await Month.collection.createIndex({ userId: 1, year: 1, month: 1 }, { unique: true });

  return { found: orphaned.length, modified, staleIndexDropped, dryRun: false };
}

async function main() {
  const targetUserId = process.argv[2];
  const confirm = process.argv.includes('--confirm');

  if (!targetUserId || !mongoose.isValidObjectId(targetUserId)) {
    console.error('Usage: ts-node migrateAddUserId.ts <targetUserId> [--confirm]');
    console.error('targetUserId must be a valid Mongo ObjectId (the user.id returned by /api/auth/register).');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected. Dry run: ${!confirm}`);

  try {
    const result = await backfillUserId(targetUserId, confirm);
    console.log(`Found ${result.found} month document(s) with no userId.`);
    if (result.dryRun) {
      console.log('\nDry run only. Re-run with --confirm to actually write changes.');
    } else {
      console.log(`Backfilled ${result.modified} document(s).`);
      console.log(
        result.staleIndexDropped
          ? `Dropped stale index: ${result.staleIndexDropped}`
          : 'No stale { year, month } index found.'
      );
      console.log('Confirmed { userId, year, month } unique index exists.');
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
