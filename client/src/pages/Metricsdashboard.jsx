import  { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAppStore } from '../zustand/UseAppstore.js';
import { NODE_TYPES } from '../config/NodeTypes.js';

const CHART_COLORS = ['#4c6ef5', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#38bdf8'];

function MetricCard({ title, value, unit, sub, color, trend }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: '#12151d', border: '1px solid #1e2335' }}
    >
      <div className="text-xs text-slate-500">{title}</div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-mono font-bold" style={{ color: color || '#e2e8f0' }}>
          {value}
        </span>
        <span className="text-sm text-slate-500 mb-0.5">{unit}</span>
      </div>
      {sub && <div className="text-[11px] text-slate-600">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#1e2335', border: '1px solid #2e3650' }}>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-mono text-white">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function MetricsDashboard() {
  const { metricsHistory, nodeMetrics, globalMetrics, isSimulating, nodes } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');

  const chartData = metricsHistory.slice(-30).map((m, i) => ({
    t: i,
    latency: m.totalLatency,
    p99: m.p99,
    throughput: m.effectiveThroughput,
    errorRate: +(m.errorRate * 100).toFixed(2),
    cacheHit: +(m.cacheHitRatio * 100).toFixed(1),
  }));

  const nodeBarData = nodeMetrics.map((m) => ({
    name: m.label?.split(' ').slice(0, 2).join(' ') || m.nodeType,
    latency: m.latency,
    throughput: m.throughput,
    errorPct: +(m.errorRate * 100).toFixed(2),
  }));

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#0d0f14' }}>
      {/* Tab bar */}
      <div
        className="flex gap-1 px-4 pt-3 pb-0 shrink-0"
        style={{ borderBottom: '1px solid #1e2335' }}
      >
        {['overview', 'latency', 'throughput', 'nodes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-2 text-xs font-medium capitalize transition-all rounded-t-lg"
            style={{
              background: activeTab === tab ? '#12151d' : 'transparent',
              color: activeTab === tab ? '#e2e8f0' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid #4c6ef5' : '2px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Not simulating placeholder */}
        {!isSimulating && metricsHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-slate-400 text-sm">Start a simulation to see live metrics</p>
            <p className="text-slate-600 text-xs mt-1">Latency, throughput, errors and more</p>
          </div>
        )}

        {(isSimulating || metricsHistory.length > 0) && (
          <>
            {activeTab === 'overview' && (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    title="End-to-End Latency"
                    value={globalMetrics.totalLatency ?? '—'}
                    unit="ms"
                    sub={`P99: ${globalMetrics.p99 ?? '—'}ms`}
                    color={
                      globalMetrics.totalLatency > 500 ? '#ef4444' :
                      globalMetrics.totalLatency > 200 ? '#f59e0b' : '#22c55e'
                    }
                  />
                  <MetricCard
                    title="Throughput"
                    value={globalMetrics.effectiveThroughput ? (globalMetrics.effectiveThroughput / 1000).toFixed(1) : '—'}
                    unit="k rps"
                    color="#4c6ef5"
                  />
                  <MetricCard
                    title="Error Rate"
                    value={globalMetrics.errorRate ? (globalMetrics.errorRate * 100).toFixed(2) : '—'}
                    unit="%"
                    color={globalMetrics.errorRate > 0.05 ? '#ef4444' : '#22c55e'}
                  />
                  <MetricCard
                    title="Cache Hit Ratio"
                    value={globalMetrics.cacheHitRatio ? (globalMetrics.cacheHitRatio * 100).toFixed(1) : '—'}
                    unit="%"
                    color="#fbbf24"
                  />
                </div>

                {/* Combined chart */}
                {chartData.length > 1 && (
                  <div className="rounded-xl p-4" style={{ background: '#12151d', border: '1px solid #1e2335' }}>
                    <div className="text-xs font-medium text-slate-400 mb-3">Latency & Error Rate Over Time</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4c6ef5" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" />
                        <XAxis dataKey="t" hide />
                        <YAxis yAxisId="lat" stroke="#4c6ef5" tick={{ fontSize: 10, fill: '#475569' }} width={40} />
                        <YAxis yAxisId="err" orientation="right" stroke="#ef4444" tick={{ fontSize: 10, fill: '#475569' }} width={30} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area yAxisId="lat" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#4c6ef5" fill="url(#latGrad)" strokeWidth={2} dot={false} />
                        <Area yAxisId="err" type="monotone" dataKey="errorRate" name="Error %" stroke="#ef4444" fill="url(#errGrad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}

            {activeTab === 'latency' && chartData.length > 1 && (
              <div className="rounded-xl p-4" style={{ background: '#12151d', border: '1px solid #1e2335' }}>
                <div className="text-xs font-medium text-slate-400 mb-3">Latency Percentiles (ms)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" />
                    <XAxis dataKey="t" hide />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                    <Line type="monotone" dataKey="latency" name="Avg" stroke="#4c6ef5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p99" name="P99" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === 'throughput' && chartData.length > 1 && (
              <>
                <div className="rounded-xl p-4" style={{ background: '#12151d', border: '1px solid #1e2335' }}>
                  <div className="text-xs font-medium text-slate-400 mb-3">Throughput (req/s)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" />
                      <XAxis dataKey="t" hide />
                      <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="throughput" name="Throughput" stroke="#22c55e" fill="url(#tpGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#12151d', border: '1px solid #1e2335' }}>
                  <div className="text-xs font-medium text-slate-400 mb-3">Cache Hit Rate (%)</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="cacheGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" />
                      <XAxis dataKey="t" hide />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#475569' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="cacheHit" name="Cache Hit %" stroke="#fbbf24" fill="url(#cacheGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeTab === 'nodes' && nodeBarData.length > 0 && (
              <>
                <div className="rounded-xl p-4" style={{ background: '#12151d', border: '1px solid #1e2335' }}>
                  <div className="text-xs font-medium text-slate-400 mb-3">Per-Node Latency (ms)</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={nodeBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="latency" name="Latency (ms)" fill="#4c6ef5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-xl p-4" style={{ background: '#12151d', border: '1px solid #1e2335' }}>
                  <div className="text-xs font-medium text-slate-400 mb-3">Per-Node Error Rate (%)</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={nodeBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="errorPct" name="Error %" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Node status table */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2335' }}>
                  <div className="px-4 py-2.5 text-xs font-medium text-slate-400" style={{ background: '#12151d', borderBottom: '1px solid #1e2335' }}>
                    Node Status Table
                  </div>
                  <div className="divide-y" style={{ divideColor: '#1e2335' }}>
                    {nodeMetrics.map((m) => {
                      const cfg = NODE_TYPES[m.nodeType] || NODE_TYPES.server;
                      const sc = { healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444', down: '#475569' };
                      return (
                        <div key={m.nodeId} className="flex items-center gap-3 px-4 py-2" style={{ background: '#0d0f14' }}>
                          <span>{cfg.icon}</span>
                          <span className="text-xs text-slate-300 flex-1">{m.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">{m.latency}ms</span>
                          <span className="text-[10px] font-mono text-slate-500">{(m.errorRate * 100).toFixed(1)}%</span>
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sc[m.status], boxShadow: `0 0 5px ${sc[m.status]}` }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}