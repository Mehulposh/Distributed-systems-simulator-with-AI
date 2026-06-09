import mongoose from 'mongoose';

const simulationLogSchema = new mongoose.Schema(
  {
    architectureId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Architecture' 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', required: true 
    },
    config: {
      rps: Number,
      duration: Number,
      readWriteRatio: Number,
      payloadSize: Number,
    },
    summary: {
      avgLatency: Number,
      p50: Number,
      p95: Number,
      p99: Number,
      throughput: Number,
      errorRate: Number,
      cacheHitRatio: Number,
      totalRequests: Number,
    },
    events: [
      {
        timestamp: Number,
        type: String,
        nodeId: String,
        message: String,    
      },
    ],
    ticks: { 
        type: mongoose.Schema.Types.Mixed 
    },
  },
  { timestamps: true }
);

export default mongoose.model('SimulationLog', simulationLogSchema);