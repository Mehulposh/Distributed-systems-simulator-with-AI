import  { useState } from 'react';
import { X, Sparkles, Loader } from 'lucide-react';
import { aiAPI } from '../api/apiService.js';
import { useAppStore } from '../zustand/UseAppstore.js';
import { NODE_TYPES } from '../config/NodeTypes.js';
import { v4 as uuid } from 'uuid';

const EXAMPLE_PROMPTS = [
  'Twitter-like social media feed',
  'Netflix video streaming platform',
  'Uber ride-sharing backend',
  'E-commerce flash sale system',
  'Real-time collaborative document editor',
  'IoT sensor data pipeline',
];
 
// ── Maps ANY AI-returned type string → a valid NODE_TYPES key ──────────────
const TYPE_ALIAS = {
  // exact matches (no-op)
  loadBalancer:  'loadBalancer',
  cache:         'cache',
  database:      'database',
  replica:       'replica',
  messageQueue:  'messageQueue',
  apiGateway:    'apiGateway',
  cdn:           'cdn',
  shard:         'shard',
  server:        'server',
  // Gemini / Claude variants
  loadbalancer:  'loadBalancer',
  load_balancer: 'loadBalancer',
  'load balancer':'loadBalancer',
  queue:         'messageQueue',
  mq:            'messageQueue',
  kafka:         'messageQueue',
  rabbitmq:      'messageQueue',
  redis:         'cache',
  memcached:     'cache',
  db:            'database',
  postgres:      'database',
  mysql:         'database',
  mongodb:       'database',
  storage:       'database',
  'db replica':  'replica',
  dbreplica:     'replica',
  read_replica:  'replica',
  api_gateway:   'apiGateway',
  gateway:       'apiGateway',
  'api gateway': 'apiGateway',
  shards:        'shard',
  partition:     'shard',
  app:           'server',
  service:       'server',
  microservice:  'server',
  worker:        'server',
  backend:       'server',
};
 
function normaliseType(raw = '') {
  const key = raw.toString().toLowerCase().trim();
  return TYPE_ALIAS[key] || TYPE_ALIAS[raw] || 'server';
}
 
// Auto-layout: arrange nodes in a clean top-down tree grid
function autoLayout(nodes, edges) {
  const COL_W    = 230;
  const ROW_H    = 160;
  const OFFSET_X = 80;
  const OFFSET_Y = 60;
 
  // Try a BFS-based layered layout using edges
  const idSet  = new Set(nodes.map(n => n.id));
  const inDeg  = {};
  nodes.forEach(n => (inDeg[n.id] = 0));
  edges.forEach(e => { if (idSet.has(e.target)) inDeg[e.target] = (inDeg[e.target] || 0) + 1; });
 
  // Topological sort
  const queue  = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
  const layers = {};
  const visited = new Set();
  let layer = 0;
 
  while (queue.length) {
    const nextQueue = [];
    queue.forEach(id => {
      if (visited.has(id)) return;
      visited.add(id);
      layers[id] = layer;
      edges
        .filter(e => e.source === id && idSet.has(e.target))
        .forEach(e => {
          inDeg[e.target]--;
          if (inDeg[e.target] === 0) nextQueue.push(e.target);
        });
    });
    queue.length = 0;
    queue.push(...nextQueue);
    layer++;
  }
 
  // Assign any unvisited nodes to last layer
  nodes.forEach(n => { if (!(n.id in layers)) layers[n.id] = layer; });
 
  // Group by layer, assign x within each row
  const layerGroups = {};
  nodes.forEach(n => {
    const l = layers[n.id] ?? 0;
    if (!layerGroups[l]) layerGroups[l] = [];
    layerGroups[l].push(n.id);
  });
 
  const positions = {};
  Object.entries(layerGroups).forEach(([l, ids]) => {
    const rowWidth = ids.length * COL_W;
    ids.forEach((id, i) => {
      positions[id] = {
        x: OFFSET_X + i * COL_W - rowWidth / 2 + 400,
        y: OFFSET_Y + Number(l) * ROW_H,
      };
    });
  });
 
  return positions;
}
 
export default function AIGenerateModal({ onClose }) {
  const [prompt, setPrompt]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState(null);
  const { setNodes, setEdges, setCurrentArchName } = useAppStore();
 
  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await aiAPI.generatePreset({ prompt });
      setResult(data);
    } catch (err) {
      try {
            const message =
            JSON.parse(err?.error)?.error?.message ??
            "Failed to generate architecture";
            
            console.error(message)
            setError(message);
        } catch {
            setError("Failed to generate architecture");
        }
    } finally {
      setLoading(false);
    }
  };
 
  const applyToCanvas = () => {
    if (!result) return;
 
    // 1. Build rfNodes with normalised type + temp positions
    const rfNodes = (result.nodes || []).map((n) => {
      // Backend may send: { id, type, data: { type, label } }
      // or Gemini path:   { id, type: 'simNode', data: { type: 'simNode', label } }
      // Determine the real component type from multiple possible fields
      const rawType =
        n.data?.type ||          // preferred: already in data
        n.nodeType   ||          // Gemini schema field
        n.type       ||          // fallback
        'server';
 
      const componentType = normaliseType(rawType);
      const cfg           = NODE_TYPES[componentType] || NODE_TYPES.server;
 
      return {
        id:       n.id || uuid(),
        type:     'simNode',          // ReactFlow node type — always 'simNode'
        position: { x: 0, y: 0 },    // will be overwritten by autoLayout
        data: {
          type:  componentType,       // the ACTUAL component type for SimNode
          label: n.data?.label || n.label || n.name || cfg.label,
          ...cfg.defaultData,
        },
      };
    });
 
    // 2. Build rfEdges preserving IDs
    const rfEdges = (result.edges || []).map((e) => ({
      id:     e.id || uuid(),
      source: e.source,
      target: e.target,
      type:   'smoothstep',
      style:  { stroke: '#4c6ef5', strokeWidth: 2 },
    }));
 
    // 3. Auto-layout
    const positions = autoLayout(rfNodes, rfEdges);
    const positionedNodes = rfNodes.map((n) => ({
      ...n,
      position: positions[n.id] || { x: Math.random() * 500, y: Math.random() * 400 },
    }));
 
    setNodes(positionedNodes);
    setEdges(rfEdges);
    setCurrentArchName(result.name || prompt);
    onClose();
  };
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full rounded-2xl overflow-hidden"
        style={{ background: '#12151d', border: '1px solid #2e3650',
                 boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxWidth: 520 }}>
 
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2335' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#7c3aed' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div className="font-semibold text-white">AI Architecture Generator</div>
              <div className="text-xs text-slate-500">Describe a system and let AI design it</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
 
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: '80vh' }}>
          {/* Input */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Describe your system</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A video streaming platform like YouTube with CDN, caching and database replication..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none transition-all"
              style={{ background: '#1e2335', border: '1px solid #2e3650', color: '#e2e8f0' }}
              onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
              onBlur={(e) => (e.target.style.borderColor = '#2e3650')}
            />
          </div>
 
          {/* Example prompts */}
          <div>
            <div className="text-[10px] text-slate-600 mb-2 uppercase tracking-wider">Examples</div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button key={ex} onClick={() => setPrompt(ex)}
                  className="px-2.5 py-1 rounded-full text-[11px] transition-all hover:scale-105"
                  style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
 
          <button onClick={generate} disabled={!prompt.trim() || loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#7c3aed', color: 'white' }}>
            {loading
              ? <><Loader size={14} className="animate-spin" />Generating Architecture...</>
              : <><Sparkles size={14} />Generate Architecture</>}
          </button>
 
          {error && (
            <div className="text-xs text-red-400 px-3 py-2 rounded-lg"
              style={{ background: '#ef444420', border: '1px solid #ef444440' }}>
              {error}
            </div>
          )}
 
          {/* Result preview */}
          {result && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2e3650' }}>
              <div className="px-4 py-3" style={{ background: '#1a1040', borderBottom: '1px solid #2e3650' }}>
                <div className="font-medium text-white text-sm">{result.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{result.description}</div>
              </div>
              <div className="px-4 py-3 space-y-2" style={{ background: '#0d0f14' }}>
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                  Components ({result.nodes?.length || 0})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.nodes || []).map((n, i) => {
                    const rawType      = n.data?.type || n.nodeType || n.type || 'server';
                    const componentType = normaliseType(rawType);
                    const cfg           = NODE_TYPES[componentType] || NODE_TYPES.server;
                    const label         = n.data?.label || n.label || n.name || cfg.label;
                    return (
                      <span key={n.id || i}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                        style={{ background: `${cfg.bgColor}cc`, color: cfg.color,
                                 border: `1px solid ${cfg.borderColor}50` }}>
                        {cfg.icon} {label}
                      </span>
                    );
                  })}
                </div>
                {result.explanation && (
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{result.explanation}</p>
                )}
              </div>
              <div className="px-4 py-3" style={{ borderTop: '1px solid #1e2335' }}>
                <button onClick={applyToCanvas}
                  className="w-full py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}>
                  ✓ Apply to Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 