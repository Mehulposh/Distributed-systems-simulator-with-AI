import  { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Clock } from 'lucide-react';
import { archAPI } from '../api/apiService.js';
import { useAppStore } from '../zustand/UseAppstore.js';

export default function LoadModal({ onClose }) {
  const [architectures, setArchitectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setNodes, setEdges, setCurrentArchName, setCurrentArchId } = useAppStore();

  useEffect(() => {
    archAPI.list().then((data) => {
      setArchitectures(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadArch = (arch) => {
    const rfNodes = arch.nodes.map((n) => ({
      id: n.id,
      type: 'simNode',
      position: n.position,
      data: n.data,
    }));
    const rfEdges = arch.edges.map((e) => ({
      ...e,
      type: 'smoothstep',
      style: { stroke: '#4c6ef5', strokeWidth: 2 },
    }));
    setNodes(rfNodes);
    setEdges(rfEdges);
    setCurrentArchName(arch.name);
    setCurrentArchId(arch._id);
    onClose();
  };

  const deleteArch = async (id, e) => {
    e.stopPropagation();
    await archAPI.delete(id);
    setArchitectures((prev) => prev.filter((a) => a._id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#12151d', border: '1px solid #2e3650', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2335' }}>
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-brand-400" />
            <span className="font-semibold text-white">Saved Architectures</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading...</div>
          ) : architectures.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 opacity-30">📂</div>
              <p className="text-slate-500 text-sm">No saved architectures yet</p>
              <p className="text-slate-600 text-xs mt-1">Build something and click Save</p>
            </div>
          ) : (
            <div className="space-y-2">
              {architectures.map((arch) => (
                <div
                  key={arch._id}
                  onClick={() => loadArch(arch)}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all hover:bg-surface-300 group"
                  style={{ background: '#1e2335', border: '1px solid #2e3650' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{arch.name}</span>
                    <button
                      onClick={(e) => deleteArch(arch._id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {arch.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{arch.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-600">
                    <Clock size={10} />
                    {new Date(arch.updatedAt).toLocaleDateString()}
                    <span>·</span>
                    <span>{arch.nodes?.length || 0} nodes</span>
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