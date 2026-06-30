import React, { useState } from 'react';
import { Play, Square, Zap, AlertTriangle, GitBranch, Save, FolderOpen, Cpu, History } from 'lucide-react';
import { useAppStore } from '../zustand/UseAppstore.js';
import { useSimulationSocket } from '../socket/UseSimulationSocket.jsx';

export default function Toolbar({ onSave, onOpenLoad, onAIGenerate, onOpenHistory, compact = false }) {
  const {
    isSimulating, simulationConfig, setSimulationConfig,
    nodes, globalMetrics, currentArchName, setCurrentArchName, selectedNode,
  } = useAppStore();

  const { startSimulation, stopSimulation, injectFailure } = useSimulationSocket();
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(); } finally { setSaving(false); }
  };

  const rpsOptions = [100, 500, 1000, 5000, 10000, 50000, 100000];

  // ── COMPACT (mobile / tablet) ──────────────────────────────────────────────
  if (compact) {
    return (
      <div className="shrink-0" style={{ background: '#12151d', borderBottom: '1px solid #1e2335' }}>
        {/* Row 1: name + save/load/ai */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #1e2335' }}>
          {editingName ? (
            <input autoFocus value={currentArchName}
              onChange={(e) => setCurrentArchName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              className="flex-1 text-sm font-semibold bg-transparent border-b border-brand-400 outline-none text-white min-w-0"
            />
          ) : (
            <button onClick={() => setEditingName(true)}
              className="flex-1 text-left text-sm font-semibold text-slate-200 truncate min-w-0">
              {currentArchName}
            </button>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onAIGenerate}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#7c3aed20', color: '#a78bfa', border: '1px solid #7c3aed40' }}>
              <Cpu size={11} /><span className="hidden sm:inline">AI</span>
            </button>
            <button onClick={onOpenLoad}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}>
              <FolderOpen size={11} />
            </button>
            {onOpenHistory && (
              <button onClick={onOpenHistory}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}>
                <History size={11} />
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
              style={{ background: '#4c6ef5', color: 'white' }}>
              <Save size={11} />{saving ? '...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Row 2: config + run */}
        <div className="flex items-center gap-2 px-3 py-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">RPS</span>
            <select value={simulationConfig.rps}
              onChange={(e) => setSimulationConfig({ rps: Number(e.target.value) })}
              disabled={isSimulating}
              className="text-xs rounded-md px-1.5 py-0.5 outline-none"
              style={{ background: '#1e2335', border: '1px solid #2e3650', color: '#e2e8f0' }}>
              {rpsOptions.map((r) => (
                <option key={r} value={r}>{r >= 1000 ? `${r / 1000}k` : r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">Dur</span>
            <select value={simulationConfig.duration}
              onChange={(e) => setSimulationConfig({ duration: Number(e.target.value) })}
              disabled={isSimulating}
              className="text-xs rounded-md px-1.5 py-0.5 outline-none"
              style={{ background: '#1e2335', border: '1px solid #2e3650', color: '#e2e8f0' }}>
              {[30, 60, 120, 300].map((d) => (
                <option key={d} value={d}>{d}s</option>
              ))}
            </select>
          </div>

          {!isSimulating ? (
            <button onClick={startSimulation} disabled={nodes.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-40"
              style={{ background: '#22c55e', color: '#000' }}>
              <Play size={11} />Run
            </button>
          ) : (
            <button onClick={stopSimulation}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: '#ef4444', color: 'white' }}>
              <Square size={11} />Stop
            </button>
          )}

          {/* Failure injection on same row when simulating */}
          {isSimulating && (
            <div className="flex items-center gap-1 ml-auto">
              {selectedNode && (
                <button onClick={() => injectFailure('kill', selectedNode.id)}
                  className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-medium"
                  style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}>
                  <AlertTriangle size={9} />Kill
                </button>
              )}
              <button onClick={() => injectFailure('spike')}
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-medium"
                style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40' }}>
                <Zap size={9} />Spike
              </button>
              <button onClick={() => injectFailure('partition')}
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-medium"
                style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa40' }}>
                <GitBranch size={9} />Split
              </button>
            </div>
          )}

          {/* Live metrics inline */}
          {isSimulating && globalMetrics.totalLatency !== undefined && (
            <div className="flex items-center gap-2 ml-1">
              <span className="text-[10px] font-mono font-semibold"
                style={{ color: globalMetrics.totalLatency > 500 ? '#ef4444' : '#22c55e' }}>
                {globalMetrics.totalLatency}ms
              </span>
              <span className="text-[10px] font-mono text-brand-400">
                {(globalMetrics.effectiveThroughput / 1000).toFixed(1)}k/s
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DESKTOP ────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 flex-wrap"
      style={{ background: '#12151d', borderBottom: '1px solid #1e2335', minHeight: 56 }}>

      {/* Architecture name */}
      <div className="flex items-center gap-2 mr-2 min-w-0">
        {editingName ? (
          <input autoFocus value={currentArchName}
            onChange={(e) => setCurrentArchName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
            className="text-sm font-semibold bg-transparent border-b border-brand-400 outline-none text-white w-44"
          />
        ) : (
          <button onClick={() => setEditingName(true)}
            className="text-sm font-semibold text-slate-200 hover:text-white transition-colors truncate max-w-40">
            {currentArchName}
          </button>
        )}
      </div>

      <div className="w-px h-6 bg-surface-400 mx-1 hidden lg:block" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">RPS</span>
        <select value={simulationConfig.rps}
          onChange={(e) => setSimulationConfig({ rps: Number(e.target.value) })}
          disabled={isSimulating}
          className="text-xs rounded-md px-2 py-1 outline-none"
          style={{ background: '#1e2335', border: '1px solid #2e3650', color: '#e2e8f0' }}>
          {rpsOptions.map((r) => (
            <option key={r} value={r}>{r >= 1000 ? `${r / 1000}k` : r} req/s</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Duration</span>
        <select value={simulationConfig.duration}
          onChange={(e) => setSimulationConfig({ duration: Number(e.target.value) })}
          disabled={isSimulating}
          className="text-xs rounded-md px-2 py-1 outline-none"
          style={{ background: '#1e2335', border: '1px solid #2e3650', color: '#e2e8f0' }}>
          {[30, 60, 120, 300].map((d) => (
            <option key={d} value={d}>{d}s</option>
          ))}
        </select>
      </div>

      <div className="w-px h-6 bg-surface-400 mx-1" />

      {!isSimulating ? (
        <button onClick={startSimulation} disabled={nodes.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#22c55e', color: '#000' }}>
          <Play size={12} />Run Simulation
        </button>
      ) : (
        <button onClick={stopSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style={{ background: '#ef4444', color: 'white' }}>
          <Square size={12} />Stop
        </button>
      )}

      {isSimulating && (
        <>
          <div className="w-px h-6 bg-surface-400 mx-1" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500">Inject:</span>
            {selectedNode && (
              <button onClick={() => injectFailure('kill', selectedNode.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all hover:scale-105"
                style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}>
                <AlertTriangle size={10} />Kill Node
              </button>
            )}
            <button onClick={() => injectFailure('spike')}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all hover:scale-105"
              style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40' }}>
              <Zap size={10} />Spike
            </button>
            <button onClick={() => injectFailure('partition')}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all hover:scale-105"
              style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa40' }}>
              <GitBranch size={10} />Partition
            </button>
          </div>
        </>
      )}

      {isSimulating && globalMetrics.totalLatency !== undefined && (
        <>
          <div className="w-px h-6 bg-surface-400 mx-1" />
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-[11px] font-mono font-semibold"
                style={{ color: globalMetrics.totalLatency > 500 ? '#ef4444' : globalMetrics.totalLatency > 200 ? '#f59e0b' : '#22c55e' }}>
                {globalMetrics.totalLatency}ms
              </div>
              <div className="text-[9px] text-slate-600">latency</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-mono font-semibold text-brand-400">
                {(globalMetrics.effectiveThroughput / 1000).toFixed(1)}k
              </div>
              <div className="text-[9px] text-slate-600">throughput</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-mono font-semibold"
                style={{ color: globalMetrics.errorRate > 0.05 ? '#ef4444' : '#94a3b8' }}>
                {(globalMetrics.errorRate * 100).toFixed(2)}%
              </div>
              <div className="text-[9px] text-slate-600">errors</div>
            </div>
          </div>
        </>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <button onClick={onAIGenerate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
          style={{ background: '#7c3aed20', color: '#a78bfa', border: '1px solid #7c3aed40' }}>
          <Cpu size={12} />AI Generate
        </button>
        <button onClick={onOpenLoad}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}>
          <FolderOpen size={12} />Load
        </button>
        {onOpenHistory && (
          <button onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}
            title="Simulation history">
            <History size={12} />History
          </button>
        )}
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
          style={{ background: '#4c6ef5', color: 'white' }}>
          <Save size={12} />{saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}