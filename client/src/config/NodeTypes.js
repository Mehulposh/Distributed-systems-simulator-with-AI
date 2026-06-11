// Component type definitions with icons, colors, default configs

export const NODE_TYPES = {
  loadBalancer: {
    label: 'Load Balancer',
    icon: '⚖️',
    color: '#6b8cff',
    bgColor: '#1a2040',
    borderColor: '#4c6ef5',
    description: 'Distributes incoming traffic across multiple servers',
    defaultData: { rps: 10000, algorithm: 'round-robin' },
  },
  cache: {
    label: 'Cache',
    icon: '⚡',
    color: '#fbbf24',
    bgColor: '#1f1a00',
    borderColor: '#f59e0b',
    description: 'In-memory data store (Redis/Memcached)',
    defaultData: { hitRatio: 0.85, ttl: 3600 },
  },
  database: {
    label: 'Database',
    icon: '🗄️',
    color: '#34d399',
    bgColor: '#001f1a',
    borderColor: '#10b981',
    description: 'Persistent relational database',
    defaultData: { engine: 'PostgreSQL', connections: 100 },
  },
  replica: {
    label: 'DB Replica',
    icon: '📋',
    color: '#6ee7b7',
    bgColor: '#001a12',
    borderColor: '#34d399',
    description: 'Read-only database replica',
    defaultData: { replicationLag: 5 },
  },
  messageQueue: {
    label: 'Message Queue',
    icon: '📬',
    color: '#f87171',
    bgColor: '#1f0000',
    borderColor: '#ef4444',
    description: 'Async message broker (Kafka/RabbitMQ)',
    defaultData: { maxDepth: 10000, consumers: 3 },
  },
  apiGateway: {
    label: 'API Gateway',
    icon: '🔀',
    color: '#a78bfa',
    bgColor: '#120a2e',
    borderColor: '#7c3aed',
    description: 'Single entry point for API requests',
    defaultData: { rateLimit: 1000 },
  },
  cdn: {
    label: 'CDN',
    icon: '🌐',
    color: '#38bdf8',
    bgColor: '#001a2e',
    borderColor: '#0ea5e9',
    description: 'Content Delivery Network',
    defaultData: { hitRatio: 0.92, regions: 12 },
  },
  shard: {
    label: 'DB Shard',
    icon: '🔷',
    color: '#fb923c',
    bgColor: '#1f0a00',
    borderColor: '#f97316',
    description: 'Horizontal database partition',
    defaultData: { shardKey: 'user_id' },
  },
  server: {
    label: 'App Server',
    icon: '🖥️',
    color: '#94a3b8',
    bgColor: '#0f111a',
    borderColor: '#475569',
    description: 'Application server / microservice',
    defaultData: { instances: 1, cpu: 4, memory: 8 },
  },
};

export const COMPONENT_CATEGORIES = [
  {
    label: 'Routing',
    types: ['loadBalancer', 'apiGateway', 'cdn'],
  },
  {
    label: 'Compute',
    types: ['server'],
  },
  {
    label: 'Storage',
    types: ['database', 'replica', 'shard', 'cache'],
  },
  {
    label: 'Messaging',
    types: ['messageQueue'],
  },
];

export function getNodeStyle(type, status = 'healthy') {
  const config = NODE_TYPES[type] || NODE_TYPES.server;
  const statusColors = {
    healthy: config.borderColor,
    warning: '#f59e0b',
    critical: '#ef4444',
    down: '#475569',
  };
  return {
    background: config.bgColor,
    borderColor: statusColors[status] || statusColors.healthy,
    color: config.color,
  };
}