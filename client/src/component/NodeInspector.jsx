import  { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { useAppStore } from '../zustand/UseAppstore.js';
import { NODE_TYPES } from '../config/NodeTypes.js';
import { aiAPI } from '../api/apiService.js';

function StatRow({ label, value, unit = '', color }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #1e2335' }}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-mono font-medium" style={{ color: color || '#e2e8f0' }}>
        {value}{unit}
      </span>
    </div>
  );
}

export default function NodeInspector() {
  const { selectedNode, setSelectedNode, isSimulating } = useAppStore();
  const [explanation, setExplanation] = useState('');
  const [loadingExpl, setLoadingExpl] = useState(false);

  if (!selectedNode) return null;

  const config = NODE_TYPES[selectedNode.data?.type] || NODE_TYPES.server;
  const metrics = selectedNode.metrics;

  const fetchExplanation = async () => {
    setLoadingExpl(true);
    try {
      const res = await aiAPI.explainComponent({
        componentType: selectedNode.data?.type,
        label: selectedNode.data?.label,
        metrics,
      });
      setExplanation(res.explanation);
    } catch (err) {
        console.error(err);
        
      setExplanation('Could not load explanation.');
    } finally {
      setLoadingExpl(false);
    }
  };

  return (
    <div
      className="absolute right-4 top-4 z-10 rounded-xl overflow-hidden"
      style={{
        background: '#12151d',
        border: '1px solid #2e3650',
        width: 240,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ background: `${config.bgColor}`, borderBottom: '1px solid #1e2335' }}
      >
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <div>
            <div className="text-xs font-semibold" style={{ color: config.color }}>
              {selectedNode.data?.label}
            </div>
            <div className="text-[10px] text-slate-500">{config.label}</div>
          </div>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-3">
        {/* Config */}
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Configuration
          </div>
          {Object.entries(selectedNode.data || {})
            .filter(([k]) => !['type', 'label'].includes(k))
            .map(([k, v]) => (
              <StatRow key={k} label={k} value={String(v)} />
            ))}
        </div>

        {/* Live metrics */}
        {isSimulating && metrics && (
          <div className="mb-3">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Live Metrics
            </div>
            <StatRow label="Latency" value={metrics.latency} unit="ms"
              color={metrics.latency > 200 ? '#ef4444' : metrics.latency > 100 ? '#f59e0b' : '#22c55e'} />
            <StatRow label="P95 Latency" value={metrics.p95} unit="ms" color="#94a3b8" />
            <StatRow label="P99 Latency" value={metrics.p99} unit="ms" color="#94a3b8" />
            <StatRow label="Throughput" value={metrics.throughput} unit=" rps" color="#6b8cff" />
            <StatRow label="Error Rate" value={(metrics.errorRate * 100).toFixed(2)} unit="%"
              color={metrics.errorRate > 0.05 ? '#ef4444' : '#22c55e'} />
            <StatRow label="Utilization" value={(metrics.utilization * 100).toFixed(0)} unit="%"
              color={metrics.utilization > 0.8 ? '#ef4444' : metrics.utilization > 0.6 ? '#f59e0b' : '#22c55e'} />
            {metrics.cacheHitRatio > 0 && (
              <StatRow label="Cache Hit" value={(metrics.cacheHitRatio * 100).toFixed(1)} unit="%" color="#fbbf24" />
            )}
            {metrics.queueDepth > 0 && (
              <StatRow label="Queue Depth" value={metrics.queueDepth} color="#f87171" />
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: { healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444', down: '#475569' }[metrics.status],
                  boxShadow: `0 0 6px ${{ healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444', down: '#475569' }[metrics.status]}`,
                }}
              />
              <span className="text-[11px] font-medium capitalize" style={{
                color: { healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444', down: '#475569' }[metrics.status],
              }}>
                {metrics.status}
              </span>
            </div>
          </div>
        )}

        {/* AI Explain */}
        {explanation ? (
          <div
            className="rounded-lg p-2.5 text-[11px] text-slate-300 leading-relaxed"
            style={{ background: '#1e2335' }}
          >
            {explanation}
          </div>
        ) : (
          <button
            onClick={fetchExplanation}
            disabled={loadingExpl}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: '#7c3aed20', color: '#a78bfa', border: '1px solid #7c3aed40' }}
          >
            {loadingExpl ? (
              <>
                <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                Explaining...
              </>
            ) : (
              <>
                <Zap size={12} />
                AI Explain This
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}