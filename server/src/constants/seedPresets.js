/**
 * Seed preset architectures used to populate the database on first startup.
 * These are example distributed systems templates for the simulator.
 */
const SEED_PRESETS = [
  {
    name: 'Basic Web App',
    category: 'starter',
    difficulty: 'beginner',
    description: 'Simple client → load balancer → API → database architecture',
    tags: ['basic', 'web', 'starter'],
    nodes: [
      { id: 'lb1', type: 'loadBalancer', position: { x: 300, y: 80 }, data: { label: 'Load Balancer', rps: 1000 } },
      { id: 'api1', type: 'server', position: { x: 200, y: 220 }, data: { label: 'API Server 1' } },
      { id: 'api2', type: 'server', position: { x: 400, y: 220 }, data: { label: 'API Server 2' } },
      { id: 'db1', type: 'database', position: { x: 300, y: 360 }, data: { label: 'PostgreSQL' } },
    ],
    edges: [
      { id: 'e1', source: 'lb1', target: 'api1' },
      { id: 'e2', source: 'lb1', target: 'api2' },
      { id: 'e3', source: 'api1', target: 'db1' },
      { id: 'e4', source: 'api2', target: 'db1' },
    ],
  },
  {
    name: 'Cached API',
    category: 'performance',
    difficulty: 'beginner',
    description: 'Adds Redis caching layer to reduce database load by ~85%',
    tags: ['cache', 'redis', 'performance'],
    nodes: [
      { id: 'lb1', type: 'loadBalancer', position: { x: 300, y: 60 }, data: { label: 'Load Balancer' } },
      { id: 'api1', type: 'server', position: { x: 300, y: 180 }, data: { label: 'API Server' } },
      { id: 'cache1', type: 'cache', position: { x: 160, y: 300 }, data: { label: 'Redis Cache', hitRatio: 0.85 } },
      { id: 'db1', type: 'database', position: { x: 440, y: 300 }, data: { label: 'PostgreSQL' } },
    ],
    edges: [
      { id: 'e1', source: 'lb1', target: 'api1' },
      { id: 'e2', source: 'api1', target: 'cache1' },
      { id: 'e3', source: 'api1', target: 'db1' },
      { id: 'e4', source: 'cache1', target: 'db1' },
    ],
  },
  {
    name: 'Read Replicas',
    category: 'scalability',
    difficulty: 'intermediate',
    description: 'Primary DB with read replicas to distribute query load',
    tags: ['replication', 'database', 'scalability'],
    nodes: [
      { id: 'lb1', type: 'loadBalancer', position: { x: 300, y: 60 }, data: { label: 'Load Balancer' } },
      { id: 'api1', type: 'server', position: { x: 300, y: 180 }, data: { label: 'API Server' } },
      { id: 'db1', type: 'database', position: { x: 180, y: 320 }, data: { label: 'Primary DB' } },
      { id: 'replica1', type: 'replica', position: { x: 380, y: 320 }, data: { label: 'Read Replica 1' } },
      { id: 'replica2', type: 'replica', position: { x: 540, y: 320 }, data: { label: 'Read Replica 2' } },
    ],
    edges: [
      { id: 'e1', source: 'lb1', target: 'api1' },
      { id: 'e2', source: 'api1', target: 'db1' },
      { id: 'e3', source: 'api1', target: 'replica1' },
      { id: 'e4', source: 'api1', target: 'replica2' },
      { id: 'e5', source: 'db1', target: 'replica1' },
      { id: 'e6', source: 'db1', target: 'replica2' },
    ],
  },
  {
    name: 'Event-Driven Microservices',
    category: 'microservices',
    difficulty: 'advanced',
    description: 'API gateway → Kafka message queue → worker services → databases',
    tags: ['kafka', 'microservices', 'event-driven', 'advanced'],
    nodes: [
      { id: 'gw1', type: 'apiGateway', position: { x: 300, y: 60 }, data: { label: 'API Gateway' } },
      { id: 'mq1', type: 'messageQueue', position: { x: 300, y: 180 }, data: { label: 'Kafka Queue' } },
      { id: 'svc1', type: 'server', position: { x: 120, y: 320 }, data: { label: 'Order Service' } },
      { id: 'svc2', type: 'server', position: { x: 300, y: 320 }, data: { label: 'Payment Service' } },
      { id: 'svc3', type: 'server', position: { x: 480, y: 320 }, data: { label: 'Notify Service' } },
      { id: 'db1', type: 'database', position: { x: 120, y: 460 }, data: { label: 'Orders DB' } },
      { id: 'db2', type: 'database', position: { x: 300, y: 460 }, data: { label: 'Payments DB' } },
    ],
    edges: [
      { id: 'e1', source: 'gw1', target: 'mq1' },
      { id: 'e2', source: 'mq1', target: 'svc1' },
      { id: 'e3', source: 'mq1', target: 'svc2' },
      { id: 'e4', source: 'mq1', target: 'svc3' },
      { id: 'e5', source: 'svc1', target: 'db1' },
      { id: 'e6', source: 'svc2', target: 'db2' },
    ],
  },
  {
    name: 'CDN + Sharded DB',
    category: 'global-scale',
    difficulty: 'advanced',
    description: 'Global CDN with horizontally sharded database for maximum scale',
    tags: ['cdn', 'sharding', 'global', 'advanced'],
    nodes: [
      { id: 'cdn1', type: 'cdn', position: { x: 300, y: 60 }, data: { label: 'CloudFront CDN' } },
      { id: 'lb1', type: 'loadBalancer', position: { x: 300, y: 180 }, data: { label: 'Load Balancer' } },
      { id: 'api1', type: 'server', position: { x: 300, y: 300 }, data: { label: 'API Cluster' } },
      { id: 'shard1', type: 'shard', position: { x: 100, y: 440 }, data: { label: 'Shard 1' } },
      { id: 'shard2', type: 'shard', position: { x: 300, y: 440 }, data: { label: 'Shard 2' } },
      { id: 'shard3', type: 'shard', position: { x: 500, y: 440 }, data: { label: 'Shard 3' } },
    ],
    edges: [
      { id: 'e1', source: 'cdn1', target: 'lb1' },
      { id: 'e2', source: 'lb1', target: 'api1' },
      { id: 'e3', source: 'api1', target: 'shard1' },
      { id: 'e4', source: 'api1', target: 'shard2' },
      { id: 'e5', source: 'api1', target: 'shard3' },
    ],
  },
];
 

export default SEED_PRESETS