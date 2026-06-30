import React, { useState } from 'react';
import { Save, X, CheckCircle } from 'lucide-react';
import { useAppStore } from '../zustand/UseAppstore.js';
import { simAPI } from '../api/apiService.js';

export default function SaveLogPrompt() {
  const {
    lastSimulationSummary, setLastSimulationSummary,
    simulationConfig, currentArchId, token,
  } = useAppStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  if (!lastSimulationSummary || !token) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await simAPI.saveLog({
        architectureId: currentArchId || undefined,
        config: simulationConfig,
        summary: {
          avgLatency:    lastSimulationSummary.totalLatency,
          p50:           lastSimulationSummary.p50,
          p99:           lastSimulationSummary.p99,
          throughput:    lastSimulationSummary.effectiveThroughput,
          errorRate:     lastSimulationSummary.errorRate,
          cacheHitRatio: lastSimulationSummary.cacheHitRatio,
          totalRequests: lastSimulationSummary.rps,
        },
      });
      setSaved(true);
      setTimeout(() => setLastSimulationSummary(null), 1500);
    } catch (err) {
      console.error('Failed to save simulation log:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed z-40 rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#12151d',
        border: '1px solid #2e3650',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxWidth: 420,
        width: 'calc(100% - 32px)',
      }}
    >
      {saved ? (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle size={16} />
          Simulation log saved
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200">Simulation complete</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {lastSimulationSummary.totalLatency}ms latency ·{' '}
              {(lastSimulationSummary.effectiveThroughput / 1000).toFixed(1)}k rps ·{' '}
              {(lastSimulationSummary.errorRate * 100).toFixed(2)}% errors
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: '#4c6ef5', color: 'white' }}
          >
            <Save size={12} />
            {saving ? 'Saving...' : 'Save Log'}
          </button>
          <button
            onClick={() => setLastSimulationSummary(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
}