/**
 * One-time backfill script.
 *
 * Architectures created before the User.savedArchitectures sync fix have no
 * corresponding entry in their owner's `savedArchitectures` array. This script
 * walks every Architecture document and pushes its _id into the owner's
 * savedArchitectures array (using $addToSet so it's safe to re-run).
 *
 * Usage:
 *   cd backend
 *   node scripts/backfill-saved-architectures.js
 *
 * Requires MONGO_URI in your .env (same as the main server).
 */

import mongoose from 'mongoose'
import  Architecture from '../models/architectureModel.js';
import  User from '../models/userModel.js';
import dotenv from 'dotenv'

dotenv.config()

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/distributed-sim';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const architectures = await Architecture.find().select('_id userId name');
  console.log(`Found ${architectures.length} architecture(s) to check`);

  let updated = 0;
  let skipped = 0;

  for (const arch of architectures) {
    if (!arch.userId) {
      console.log(`  ! Skipping "${arch.name}" (${arch._id}) — no userId`);
      skipped++;
      continue;
    }

    const result = await User.findByIdAndUpdate(
      arch.userId,
      { $addToSet: { savedArchitectures: arch._id } },
      { new: true }
    );

    if (result) {
      console.log(`  - Linked "${arch.name}" -> user ${result.email}`);
      updated++;
    } else {
      console.log(`  ! Skipping "${arch.name}" (${arch._id}) — owner user not found`);
      skipped++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});