import  { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Layers } from 'lucide-react';
import { adminAPI } from '../api/apiService.js';
import { NODE_TYPES } from '../config/NodeTypes.js';

export default function AdminPresets() {
  const [presets, setPresets]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [actionId, setActionId]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getPresets();
      setPresets(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPresets(); }, []);

  const deletePreset = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    setActionId(id);
    try {
      await adminAPI.deletePreset(id);
      setPresets(prev => prev.filter(p => p._id !== id));
    } finally {
      setActionId(null);
      setConfirmDelete(null);
    }
  };

  const DIFF_COLOR = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">{presets.length} preset templates</div>
        <button onClick={fetchPresets} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
          style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-600">
          <RefreshCw size={16} className="animate-spin mr-2" />Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {presets.map((preset) => (
            <div key={preset._id} className="rounded-xl overflow-hidden"
              style={{ background: '#12151d', border: '1px solid #1e2335' }}>
              {/* Header */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2335' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Layers size={13} color="#4c6ef5" />
                    <span className="text-sm font-semibold text-white">{preset.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ color: DIFF_COLOR[preset.difficulty], background: `${DIFF_COLOR[preset.difficulty]}20` }}>
                    {preset.difficulty}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{preset.description}</p>
              </div>

              {/* Stats */}
              <div className="px-4 py-2 flex items-center gap-4" style={{ borderBottom: '1px solid #1e2335' }}>
                <div className="text-center">
                  <div className="text-sm font-mono font-bold text-white">{preset.nodes?.length || 0}</div>
                  <div className="text-[10px] text-slate-500">nodes</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-mono font-bold text-white">{preset.edges?.length || 0}</div>
                  <div className="text-[10px] text-slate-500">edges</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-mono font-bold text-brand-400">{preset.popularity || 0}</div>
                  <div className="text-[10px] text-slate-500">loads</div>
                </div>
                <div className="ml-auto flex flex-wrap gap-1">
                  {(preset.tags || []).map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: '#1e2335', color: '#64748b', border: '1px solid #2e3650' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Nodes preview */}
              <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
                {(preset.nodes || []).slice(0, 6).map((n, i) => {
                  const cfg = NODE_TYPES[n.data?.type] || NODE_TYPES.server;
                  return (
                    <span key={i} className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                      style={{ background: `${cfg.bgColor}cc`, color: cfg.color, border: `1px solid ${cfg.borderColor}40` }}>
                      {cfg.icon} {n.data?.label || cfg.label}
                    </span>
                  );
                })}
                {preset.nodes?.length > 6 && (
                  <span className="text-[10px] text-slate-500">+{preset.nodes.length - 6} more</span>
                )}
              </div>

              {/* Delete */}
              <div className="px-4 py-2.5" style={{ borderTop: '1px solid #1e2335' }}>
                <button onClick={() => deletePreset(preset._id)} disabled={actionId === preset._id}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
                  style={{
                    background: confirmDelete === preset._id ? '#ef4444' : '#ef444415',
                    color: confirmDelete === preset._id ? 'white' : '#ef4444',
                    border: '1px solid #ef444430',
                  }}>
                  <Trash2 size={11} />
                  {confirmDelete === preset._id ? 'Confirm delete preset' : 'Delete Preset'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}