/**
 * One-time backfill script.
 *
 * Adds totalSimulations to the User schema, but existing users who already
 * have saved SimulationLog documents will show 0 until backfilled. This
 * script counts each user's existing logs and sets User.totalSimulations
 * to match (overwrite, not increment — safe to re-run any number of times).
 *
 * Usage:
 *   cd backend
 *   node scripts/backfill-total-simulations.js
 *
 * Requires MONGO_URI in your .env (same as the main server).
 */

import mongoose from 'mongoose';
import SimulationLog from '../models/SimulationlogModel.js';
import User from '../models/userModel.js';

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/distributed-sim';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const counts = await SimulationLog.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);

  console.log(`Found simulation logs for ${counts.length} user(s)`);

  let updated = 0;

  for (const { _id: userId, count } of counts) {
    const result = await User.findByIdAndUpdate(
      userId,
      { totalSimulations: count },
      { new: true }
    );

    if (result) {
      console.log(`  - ${result.email}: ${count} simulation(s)`);
      updated++;
    } else {
      console.log(`  ! User ${userId} not found — skipping`);
    }
  }

  console.log(`\nDone. Updated: ${updated}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});