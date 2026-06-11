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

export default function AIGenerateModal({ onClose }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
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
        console.error(err)
      setError('Generation failed. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const applyToCanvas = () => {
    if (!result) return;

    const rfNodes = result.nodes.map((n) => ({
      id: n.id || uuid(),
      type: 'simNode',
      position: { x: n.x || 200, y: n.y || 200 },
      data: {
        type: n.type,
        label: n.label,
        ...(NODE_TYPES[n.type]?.defaultData || {}),
      },
    }));

    const rfEdges = (result.edges || []).map((e) => ({
      id: e.id || uuid(),
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      style: { stroke: '#4c6ef5', strokeWidth: 2 },
    }));

    setNodes(rfNodes);
    setEdges(rfEdges);
    setCurrentArchName(result.name || prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#12151d', border: '1px solid #2e3650', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
      >
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

        <div className="px-6 py-5 space-y-4">
          {/* Input */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Describe your system</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
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
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="px-2.5 py-1 rounded-full text-[11px] transition-all hover:scale-105"
                  style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#7c3aed', color: 'white' }}
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                Generating Architecture...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate Architecture
              </>
            )}
          </button>

          {error && (
            <div className="text-xs text-red-400 px-3 py-2 rounded-lg" style={{ background: '#ef444420', border: '1px solid #ef444440' }}>
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
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">Components</div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.nodes || []).map((n) => {
                    const cfg = NODE_TYPES[n.type] || NODE_TYPES.server;
                    return (
                      <span
                        key={n.id}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                        style={{ background: `${cfg.bgColor}cc`, color: cfg.color, border: `1px solid ${cfg.borderColor}50` }}
                      >
                        {cfg.icon} {n.label}
                      </span>
                    );
                  })}
                </div>
                {result.explanation && (
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{result.explanation}</p>
                )}
              </div>
              <div className="px-4 py-3" style={{ borderTop: '1px solid #1e2335' }}>
                <button
                  onClick={applyToCanvas}
                  className="w-full py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}
                >
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