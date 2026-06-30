import React, { useState, useEffect } from 'react';
import { X, Activity, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import { simAPI } from '../api/apiService.js';

function StatChip({ label, value, color = '#94a3b8' }) {
  return (
    <div className="text-center">
      <div className="text-xs font-mono font-semibold" style={{ color }}>{value}</div>
      <div className="text-[9px] text-slate-600">{label}</div>
    </div>
  );
}

export default function SimulationHistoryModal({ onClose }) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    simAPI.getLogs()
      .then((data) => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#12151d', border: '1px solid #2e3650',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxWidth: 600, maxHeight: '85vh',
        }}>

        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1e2335' }}>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-brand-400" />
            <span className="font-semibold text-white">Simulation History</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-600 text-sm">
              <RefreshCw size={14} className="animate-spin mr-2" />Loading...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3 opacity-30">📊</div>
              <p className="text-slate-500 text-sm">No simulation logs saved yet</p>
              <p className="text-slate-600 text-xs mt-1">
                Run a simulation and click "Save Log" when it completes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log._id} className="rounded-xl px-4 py-3"
                  style={{ background: '#1e2335', border: '1px solid #2e3650' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TrendingUp size={12} color="#4c6ef5" />
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {log.architectureId?.name || 'Untitled Architecture'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-600 shrink-0">
                      <Clock size={9} />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2 text-[10px] text-slate-500">
                    <span>{log.config?.rps?.toLocaleString()} req/s</span>
                    <span>{log.config?.duration}s duration</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2" style={{ borderTop: '1px solid #2e3650' }}>
                    <StatChip label="latency" value={`${log.summary?.avgLatency ?? '—'}ms`}
                      color={log.summary?.avgLatency > 500 ? '#ef4444' : log.summary?.avgLatency > 200 ? '#f59e0b' : '#22c55e'} />
                    <StatChip label="p99" value={`${log.summary?.p99 ?? '—'}ms`} />
                    <StatChip label="throughput" value={`${((log.summary?.throughput || 0) / 1000).toFixed(1)}k`} color="#6b8cff" />
                    <StatChip label="errors" value={`${((log.summary?.errorRate || 0) * 100).toFixed(1)}%`}
                      color={log.summary?.errorRate > 0.05 ? '#ef4444' : '#94a3b8'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}