import  { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useAppStore } from '../zustand/UseAppstore.js';
import { NODE_TYPES, getNodeStyle } from '../config/NodeTypes.js';

function MetricBadge({ value, label, color = '#94a3b8' }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-mono font-medium" style={{ color }}>
        {value}
      </span>
      <span className="text-[9px] text-slate-500">{label}</span>
    </div>
  );
}

const SimNode = memo(({ id, data, selected }) => {  
  const { nodeMetrics, isSimulating, failedNodes, setSelectedNode } = useAppStore();

  const nodeData = data || {};
  const config = NODE_TYPES[nodeData?.type] || NODE_TYPES.server;
  const metrics = nodeMetrics.find((m) => m.nodeId === id);
  const isDown = failedNodes.includes(id);
  const status = isDown ? 'down' : metrics?.status || 'healthy';
  const style = getNodeStyle(nodeData?.type || "server", status);

  const statusDotColor = {
    healthy: '#22c55e',
    warning: '#f59e0b',
    critical: '#ef4444',
    down: '#475569',
  }[status];

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-300 cursor-pointer select-none ${
        selected ? 'ring-2 ring-brand-400 ring-offset-1 ring-offset-surface-50' : ''
      }`}
      style={{
        background: style.background,
        borderColor: style.borderColor,
        minWidth: 160,
        maxWidth: 200,
        boxShadow: selected
          ? `0 0 20px ${style.borderColor}40`
          : `0 4px 20px rgba(0,0,0,0.4)`,
        opacity: isDown ? 0.5 : 1,
      }}
      onClick={() => setSelectedNode({ id, data, metrics })}
    >
      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: statusDotColor,
            boxShadow: `0 0 6px ${statusDotColor}`,
            animation: isSimulating && status === 'healthy' ? 'pulse 2s infinite' : 'none',
          }}
        />
      </div>

      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{config.icon}</span>
          <div>
            <div className="text-xs font-semibold" style={{ color: style.color }}>
              {nodeData?.label || "Unknown Node"}
            </div>
            <div className="text-[10px] text-slate-500">{config.label}</div>
          </div>
        </div>
      </div>

      {/* Live metrics (shown during simulation) */}
      {isSimulating && metrics && !isDown && (
        <div
          className="mx-2 mb-2 px-2 py-1.5 rounded-lg grid grid-cols-3 gap-1"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <MetricBadge
            value={`${metrics.latency}ms`}
            label="latency"
            color={metrics.latency > 200 ? '#ef4444' : metrics.latency > 100 ? '#f59e0b' : '#22c55e'}
          />
          <MetricBadge
            value={`${(metrics.throughput / 1000).toFixed(1)}k`}
            label="rps"
            color="#6b8cff"
          />
          <MetricBadge
            value={`${(metrics.errorRate * 100).toFixed(1)}%`}
            label="err"
            color={metrics.errorRate > 0.05 ? '#ef4444' : '#94a3b8'}
          />
          {metrics.cacheHitRatio > 0 && (
            <MetricBadge
              value={`${(metrics.cacheHitRatio * 100).toFixed(0)}%`}
              label="hit"
              color="#fbbf24"
            />
          )}
          {metrics.queueDepth > 0 && (
            <MetricBadge
              value={metrics.queueDepth > 999 ? `${(metrics.queueDepth / 1000).toFixed(1)}k` : metrics.queueDepth}
              label="queue"
              color={metrics.queueDepth > 5000 ? '#ef4444' : '#94a3b8'}
            />
          )}
        </div>
      )}

      {isDown && (
        <div className="mx-2 mb-2 px-2 py-1 rounded-lg text-center text-xs text-red-400 font-medium"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          ⚠ NODE DOWN
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2"
        style={{ borderColor: style.borderColor, background: '#0d0f14' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2"
        style={{ borderColor: style.borderColor, background: '#0d0f14' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !border-2"
        style={{ borderColor: style.borderColor, background: '#0d0f14' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !border-2"
        style={{ borderColor: style.borderColor, background: '#0d0f14' }}
      />
    </div>
  );
});

SimNode.displayName = 'SimNode';
export default SimNode;