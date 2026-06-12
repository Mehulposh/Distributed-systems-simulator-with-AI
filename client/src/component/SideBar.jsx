import  { useState, useEffect } from 'react';
import { NODE_TYPES, COMPONENT_CATEGORIES } from '../config/NodeTypes.js';
import { presetAPI } from '../api/apiService.js';
import { useAppStore } from '../zustand/UseAppstore.js';

function ComponentCard({ type, narrow }) {
  const config = NODE_TYPES[type];
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/simnode', type);
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div draggable onDragStart={onDragStart}
      className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02]"
      style={{ background: `${config.bgColor}cc`, border: `1px solid ${config.borderColor}50` }}
      title={config.description}>
      <span className="text-base shrink-0">{config.icon}</span>
      {!narrow && (
        <div className="min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: config.color }}>{config.label}</div>
          <div className="text-[10px] text-slate-500 truncate">{config.description}</div>
        </div>
      )}
    </div>
  );
}

function PresetCard({ preset, onLoad, narrow }) {
  const diffColor = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };
  if (narrow) {
    return (
      <button onClick={() => onLoad(preset)}
        className="w-full px-2 py-2 rounded-lg transition-all hover:bg-surface-300 text-left"
        style={{ border: '1px solid #1e2335' }}
        title={preset.name}>
        <div className="text-[10px] font-medium text-slate-200 truncate">{preset.name}</div>
        <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: diffColor[preset.difficulty] }} />
      </button>
    );
  }
  return (
    <button onClick={() => onLoad(preset)}
      className="w-full text-left px-3 py-2 rounded-lg transition-all hover:bg-surface-300 group"
      style={{ border: '1px solid #1e2335' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-200">{preset.name}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ color: diffColor[preset.difficulty], background: `${diffColor[preset.difficulty]}20` }}>
          {preset.difficulty}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 leading-tight">{preset.description}</p>
    </button>
  );
}

export default function Sidebar({ narrow = false, onSelect }) {
  const [tab, setTab] = useState('components');
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const { setNodes, setEdges, setCurrentArchName } = useAppStore();

  useEffect(() => {
    if (tab === 'presets' && !presets.length) {
      setLoadingPresets(true);
      presetAPI.list().then((data) => { setPresets(data); setLoadingPresets(false); }).catch(() => setLoadingPresets(false));
    }
  }, [tab]);

  const loadPreset = (preset) => {
    const rfNodes = preset.nodes.map((n) => ({
      id: n.id, type: 'simNode', position: n.position,
      data: { type: n.type, label: n.data?.label || n.label, ...(n.data || {}) },
    }));
    const rfEdges = preset.edges.map((e) => ({
      ...e, type: 'smoothstep', style: { stroke: '#4c6ef5', strokeWidth: 2 },
    }));
    setNodes(rfNodes);
    setEdges(rfEdges);
    setCurrentArchName(preset.name);
    onSelect?.();
  };

  const sidebarWidth = narrow ? 200 : 240;

  return (
    <div className="h-full flex flex-col"
      style={{ background: '#12151d', borderRight: '1px solid #1e2335', width: sidebarWidth, minWidth: sidebarWidth }}>

      {/* Logo — only full width */}
      {!narrow && (
        <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #1e2335' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: '#4c6ef5', color: 'white' }}>⬡</div>
            <div>
              <div className="text-sm font-semibold text-white">DistSim</div>
              <div className="text-[10px] text-slate-500">System Designer</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1.5 gap-1" style={{ borderBottom: '1px solid #1e2335' }}>
        {['components', 'presets'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-1 text-[10px] rounded-md font-medium transition-all"
            style={{
              background: tab === t ? '#4c6ef5' : 'transparent',
              color: tab === t ? 'white' : '#64748b',
            }}>
            {t === 'components' ? '⚙' : '📐'}
            {!narrow && ` ${t === 'components' ? 'Components' : 'Presets'}`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tab === 'components' && (
          <>
            {!narrow && (
              <p className="text-[10px] text-slate-600 px-1 pt-1">Drag onto canvas</p>
            )}
            {COMPONENT_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider px-1 mb-1">
                  {cat.label}
                </div>
                <div className="space-y-1">
                  {cat.types.map((type) => (
                    <ComponentCard key={type} type={type} narrow={narrow} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'presets' && (
          <>
            {loadingPresets ? (
              <div className="text-center py-8 text-slate-600 text-xs">Loading...</div>
            ) : (
              <div className="space-y-1.5">
                {presets.map((preset) => (
                  <PresetCard key={preset._id} preset={preset} onLoad={loadPreset} narrow={narrow} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {!narrow && (
        <div className="p-3" style={{ borderTop: '1px solid #1e2335' }}>
          <div className="rounded-lg p-2.5 text-[10px] text-slate-400 leading-relaxed" style={{ background: '#1e2335' }}>
            <span className="text-brand-400 font-medium">Tip: </span>
            Drag to connect nodes. Delete key removes selected.
          </div>
        </div>
      )}
    </div>
  );
}