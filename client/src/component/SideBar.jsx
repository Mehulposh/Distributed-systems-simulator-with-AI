import  { useState, useEffect } from 'react';
import { NODE_TYPES, COMPONENT_CATEGORIES } from '../config/NodeTypes.js';
import { presetAPI } from '../api/apiService.js';
import { useAppStore } from '../zustand/UseAppstore.js';
import { v4 as uuid } from 'uuid';

function ComponentCard({ type }) {
  const config = NODE_TYPES[type];

  const onDragStart = (e) => {
    e.dataTransfer.setData('application/simnode', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-150 hover:scale-[1.02]"
      style={{
        background: `${config.bgColor}cc`,
        border: `1px solid ${config.borderColor}50`,
      }}
      title={config.description}
    >
      <span className="text-base">{config.icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-medium" style={{ color: config.color }}>
          {config.label}
        </div>
        <div className="text-[10px] text-slate-500 truncate">{config.description}</div>
      </div>
    </div>
  );
}

function PresetCard({ preset, onLoad }) {
  const diffColor = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };

  return (
    <button
      onClick={() => onLoad(preset)}
      className="w-full text-left px-3 py-2 rounded-lg transition-all duration-150 hover:bg-surface-300 group"
      style={{ border: '1px solid #1e2335' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-200">{preset.name}</span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
          style={{
            color: diffColor[preset.difficulty],
            background: `${diffColor[preset.difficulty]}20`,
          }}
        >
          {preset.difficulty}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 leading-tight">{preset.description}</p>
    </button>
  );
}

export default function Sidebar() {
  const [tab, setTab] = useState('components');
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const { setNodes, setEdges, setCurrentArchName } = useAppStore();

  useEffect(() => {
    if (tab === 'presets' && !presets.length) {
      setLoadingPresets(true);
      presetAPI.list().then((data) => {
        setPresets(data);
        setLoadingPresets(false);
      }).catch(() => setLoadingPresets(false));
    }
  }, [tab]);

  const loadPreset = (preset) => {
    // Convert preset nodes to ReactFlow format
    const rfNodes = preset.nodes.map((n) => ({
      id: n.id,
      type: 'simNode',
      position: n.position,
      data: { type: n.type, label: n.data?.label || n.label, ...(n.data || {}) },
    }));

    const rfEdges = preset.edges.map((e) => ({
      ...e,
      type: 'smoothstep',
      style: { stroke: '#4c6ef5', strokeWidth: 2 },
    }));

    setNodes(rfNodes);
    setEdges(rfEdges);
    setCurrentArchName(preset.name);
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        background: '#12151d',
        borderRight: '1px solid #1e2335',
        width: 240,
        minWidth: 240,
      }}
    >
      {/* Logo */}
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #1e2335' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: '#4c6ef5', color: 'white' }}
          >
            ⬡
          </div>
          <div>
            <div className="text-sm font-semibold text-white">DistSim</div>
            <div className="text-[10px] text-slate-500">System Designer</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-1" style={{ borderBottom: '1px solid #1e2335' }}>
        {['components', 'presets'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-1.5 text-xs rounded-md font-medium transition-all"
            style={{
              background: tab === t ? '#4c6ef5' : 'transparent',
              color: tab === t ? 'white' : '#64748b',
            }}
          >
            {t === 'components' ? '⚙ Components' : '📐 Presets'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {tab === 'components' && (
          <>
            <p className="text-[10px] text-slate-600 px-1 pt-1">
              Drag components onto the canvas
            </p>
            {COMPONENT_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 mb-1.5">
                  {cat.label}
                </div>
                <div className="space-y-1">
                  {cat.types.map((type) => (
                    <ComponentCard key={type} type={type} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'presets' && (
          <>
            <p className="text-[10px] text-slate-600 px-1 pt-1">
              Click to load a template architecture
            </p>
            {loadingPresets ? (
              <div className="text-center py-8 text-slate-600 text-xs">Loading...</div>
            ) : (
              <div className="space-y-1.5">
                {presets.map((preset) => (
                  <PresetCard key={preset._id} preset={preset} onLoad={loadPreset} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tips */}
      <div className="p-3" style={{ borderTop: '1px solid #1e2335' }}>
        <div
          className="rounded-lg p-2.5 text-[10px] text-slate-400 leading-relaxed"
          style={{ background: '#1e2335' }}
        >
          <span className="text-brand-400 font-medium">Tips: </span>
          Drag to connect nodes. Press Delete to remove. Shift+click to multi-select.
        </div>
      </div>
    </div>
  );
}