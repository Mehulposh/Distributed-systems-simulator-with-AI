/**
 * Simulation Engine
 * Tick-based simulation of distributed system components.
 * Computes per-node latency, throughput, error rate, cache hit ratio.
 */

const COMPONENT_PROFILES = {
  loadBalancer: {
    baseLatency: 2,
    maxThroughput: 100000,
    errorRate: 0.001,
    cpuCostPerReq: 0.00001,
  },
  cache: {
    baseLatency: 1,
    maxThroughput: 200000,
    errorRate: 0.0005,
    hitLatency: 0.5,
    missLatency: 50,
    defaultHitRatio: 0.85,
  },
  database: {
    baseLatency: 20,
    maxThroughput: 5000,
    errorRate: 0.005,
    writeLatency: 40,
    readLatency: 20,
    connectionPoolSize: 100,
  },
  replica: {
    baseLatency: 18,
    maxThroughput: 8000,
    errorRate: 0.003,
    replicationLag: 5,
  },
  messageQueue: {
    baseLatency: 3,
    maxThroughput: 50000,
    errorRate: 0.001,
    processingDelay: 10,
    maxQueueDepth: 10000,
  },
  apiGateway: {
    baseLatency: 5,
    maxThroughput: 80000,
    errorRate: 0.002,
  },
  cdn: {
    baseLatency: 0.3,
    maxThroughput: 500000,
    errorRate: 0.0001,
    hitRatio: 0.92,
  },
  shard: {
    baseLatency: 22,
    maxThroughput: 4000,
    errorRate: 0.006,
    hotspotProbability: 0.05,
  },
  server: {
    baseLatency: 10,
    maxThroughput: 10000,
    errorRate: 0.01,
  },
};

/**
 * Generate a normally distributed random value.
 * @param {number} mean
 * @param {number} stdDev
 * @returns {number}
 */
function gaussian(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Calculate percentile from a numeric array.
 * @param {number[]} arr
 * @param {number} p
 * @returns {number}
 */
function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Compute metrics for an individual simulation node.
 * @param {object} node
 * @param {number} rps
 * @param {object} config
 * @param {Set<string>} failedNodes
 * @returns {object}
 */
function computeNodeMetrics(node, rps, config, failedNodes) {
  const isDown = failedNodes.has(node.id);
  const profile = COMPONENT_PROFILES[node.type] || COMPONENT_PROFILES.server;
  const nodeRps = rps / Math.max(1, config.nodeCount || 1);

  if (isDown) {
    return {
      nodeId: node.id,
      nodeType: node.type,
      label: node.data?.label || node.type,
      latency: 0,
      p50: 0, p95: 0, p99: 0,
      throughput: 0,
      errorRate: 1,
      cacheHitRatio: 0,
      queueDepth: 0,
      status: 'down',
      requestsProcessed: 0,
    };
  }

  // Utilization factor — more load = more latency
  const utilization = Math.min(nodeRps / profile.maxThroughput, 1);
  const overloadFactor = utilization > 0.8 ? Math.pow((utilization - 0.8) / 0.2 + 1, 3) : 1;

  let baseLatency = profile.baseLatency * overloadFactor;

  // Cache-specific logic
  let cacheHitRatio = 0;
  if (node.type === 'cache') {
    const warmup = Math.min(config.tick / 20, 1);
    cacheHitRatio = (node.data?.hitRatio || profile.defaultHitRatio) * warmup;
    baseLatency = cacheHitRatio * profile.hitLatency + (1 - cacheHitRatio) * profile.missLatency;
  }
  if (node.type === 'cdn') {
    cacheHitRatio = profile.hitRatio;
    baseLatency = profile.baseLatency;
  }

  // Queue depth for message queues
  let queueDepth = 0;
  if (node.type === 'messageQueue') {
    queueDepth = Math.min(nodeRps * 0.5, profile.maxQueueDepth);
    baseLatency += (queueDepth / profile.maxQueueDepth) * 200;
  }

  // Shard hotspot simulation
  if (node.type === 'shard' && Math.random() < profile.hotspotProbability) {
    baseLatency *= 5;
  }

  // Generate latency samples with some variance
  const samples = Array.from({ length: 50 }, () =>
    Math.max(0.1, gaussian(baseLatency, baseLatency * 0.3))
  );

  const errorRate = Math.min(
    profile.errorRate + utilization * 0.02,
    0.5
  );

  const throughput = Math.min(nodeRps * (1 - errorRate), profile.maxThroughput);

  return {
    nodeId: node.id,
    nodeType: node.type,
    label: node.data?.label || node.type,
    latency: Math.round(baseLatency * 10) / 10,
    p50: Math.round(percentile(samples, 50) * 10) / 10,
    p95: Math.round(percentile(samples, 95) * 10) / 10,
    p99: Math.round(percentile(samples, 99) * 10) / 10,
    throughput: Math.round(throughput),
    errorRate: Math.round(errorRate * 10000) / 10000,
    cacheHitRatio: Math.round(cacheHitRatio * 1000) / 1000,
    queueDepth: Math.round(queueDepth),
    utilization: Math.round(utilization * 1000) / 1000,
    status: utilization > 0.95 ? 'critical' : utilization > 0.7 ? 'warning' : 'healthy',
    requestsProcessed: Math.round(throughput),
  };
}

/**
 * Compute aggregated global simulation metrics.
 * @param {object[]} nodeMetrics
 * @param {number} rps
 * @returns {object}
 */
function computeGlobalMetrics(nodeMetrics, rps) {
  if (!nodeMetrics.length) return {};

  const activeNodes = nodeMetrics.filter((n) => n.status !== 'down');
  if (!activeNodes.length) return { totalLatency: 0, errorRate: 1, throughput: 0 };

  // End-to-end latency = sum of latencies along the critical path
  const totalLatency = activeNodes.reduce((sum, n) => sum + n.latency, 0);
  const avgErrorRate = activeNodes.reduce((sum, n) => sum + n.errorRate, 0) / activeNodes.length;
  const minThroughput = Math.min(...activeNodes.map((n) => n.throughput));
  const cacheNodes = activeNodes.filter((n) => n.cacheHitRatio > 0);
  const avgCacheHit = cacheNodes.length
    ? cacheNodes.reduce((s, n) => s + n.cacheHitRatio, 0) / cacheNodes.length
    : 0;

  const p50s = activeNodes.map((n) => n.p50);
  const p99s = activeNodes.map((n) => n.p99);

  return {
    totalLatency: Math.round(totalLatency * 10) / 10,
    p50: Math.round(p50s.reduce((a, b) => a + b, 0) * 10) / 10,
    p99: Math.round(p99s.reduce((a, b) => a + b, 0) * 10) / 10,
    errorRate: Math.round(avgErrorRate * 10000) / 10000,
    effectiveThroughput: Math.min(minThroughput, rps),
    cacheHitRatio: Math.round(avgCacheHit * 1000) / 1000,
    rps,
    activeNodes: activeNodes.length,
    downNodes: nodeMetrics.length - activeNodes.length,
  };
}

// ── Socket.io setup ──────────────────────────────────────────────────────────

const activeSessions = new Map();

/**
 * Attach Socket.io event handlers for simulation control.
 * @param {import('socket.io').Server} io
 */
function setupSimulationSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('simulation:start', (payload) => {
      const { config, nodes, edges } = payload;
      if (!nodes || !nodes.length) {
        socket.emit('simulation:error', { message: 'No nodes in architecture' });
        return;
      }

      const failedNodes = new Set();
      let tick = 0;

      const interval = setInterval(() => {
        tick++;
        const currentRps = config.rps + gaussian(0, config.rps * 0.05);
        const nodeMetrics = nodes.map((node) =>
          computeNodeMetrics(node, currentRps, { tick, nodeCount: nodes.length }, failedNodes)
        );
        const globalMetrics = computeGlobalMetrics(nodeMetrics, Math.round(currentRps));

        socket.emit('metrics:tick', {
          tick,
          timestamp: Date.now(),
          nodeMetrics,
          globalMetrics,
          failedNodes: [...failedNodes],
        });

        // Auto-stop after configured duration
        if (tick >= (config.duration || 60)) {
          clearInterval(interval);
          activeSessions.delete(socket.id);
          socket.emit('simulation:ended', {
            summary: globalMetrics,
            totalTicks: tick,
          });
        }
      }, 500);

      activeSessions.set(socket.id, { interval, failedNodes, config, nodes });
      socket.emit('simulation:started', { sessionId: socket.id });
    });

    socket.on('simulation:stop', () => {
      const session = activeSessions.get(socket.id);
      if (session) {
        clearInterval(session.interval);
        activeSessions.delete(socket.id);
        socket.emit('simulation:ended', { message: 'Stopped by user' });
      }
    });

    socket.on('simulation:inject', ({ type, nodeId }) => {
      const session = activeSessions.get(socket.id);
      if (!session) return;

      if (type === 'kill') {
        session.failedNodes.add(nodeId);
        socket.emit('simulation:alert', {
          nodeId,
          type: 'node_down',
          message: `Node ${nodeId} killed`,
        });
        // Auto recover after 15s
        setTimeout(() => {
          session.failedNodes.delete(nodeId);
          socket.emit('simulation:alert', {
            nodeId,
            type: 'node_recovered',
            message: `Node ${nodeId} recovered`,
          });
        }, 15000);
      } else if (type === 'spike') {
        const originalRps = session.config.rps;
        session.config.rps = originalRps * 10;
        setTimeout(() => {
          session.config.rps = originalRps;
        }, 8000);
        socket.emit('simulation:alert', {
          type: 'spike',
          message: `Traffic spike: 10x RPS for 8 seconds`,
        });
      } else if (type === 'partition') {
        const half = session.nodes.slice(0, Math.floor(session.nodes.length / 2));
        half.forEach((n) => session.failedNodes.add(n.id));
        socket.emit('simulation:alert', {
          type: 'partition',
          message: `Network partition: ${half.length} nodes isolated`,
        });
        setTimeout(() => {
          half.forEach((n) => session.failedNodes.delete(n.id));
          socket.emit('simulation:alert', { type: 'healed', message: 'Partition healed' });
        }, 20000);
      }
    });

    socket.on('disconnect', () => {
      const session = activeSessions.get(socket.id);
      if (session) clearInterval(session.interval);
      activeSessions.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

export { setupSimulationSocket, computeNodeMetrics, computeGlobalMetrics };