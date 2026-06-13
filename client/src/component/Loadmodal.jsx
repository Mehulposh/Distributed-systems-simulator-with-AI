import  { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Clock } from 'lucide-react';
import { archAPI } from '../api/apiService.js';
import { useAppStore } from '../zustand/UseAppstore.js';

export default function LoadModal({ onClose }) {
  const [architectures, setArchitectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setNodes, setEdges, setCurrentArchName, setCurrentArchId } = useAppStore();
 
  useEffect(() => {
    archAPI.list()
      .then((data) => { setArchitectures(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
 
  // Map any stale/corrupted type string back to a valid NODE_TYPES key
  const TYPE_ALIAS = {
    loadbalancer: 'loadBalancer', load_balancer: 'loadBalancer',
    queue: 'messageQueue', mq: 'messageQueue', kafka: 'messageQueue',
    redis: 'cache', memcached: 'cache',
    db: 'database', postgres: 'database', mysql: 'database', mongodb: 'database', storage: 'database',
    dbreplica: 'replica', read_replica: 'replica',
    gateway: 'apiGateway', api_gateway: 'apiGateway',
    shards: 'shard', partition: 'shard',
    app: 'server', service: 'server', microservice: 'server', worker: 'server',
    simNode: 'server',   // corrupted saves where type was set to 'simNode'
  };
  const normaliseType = (raw = '') => {
    const key = raw.toString().toLowerCase().trim();
    return TYPE_ALIAS[key] || (['loadBalancer','cache','database','replica','messageQueue',
      'apiGateway','cdn','shard','server'].includes(raw) ? raw : 'server');
  };
 
  const loadArch = (arch) => {
    const rfNodes = arch.nodes.map((n) => {
      const componentType = normaliseType(n.data?.type || '');
      return {
        id: n.id,
        type: 'simNode',
        position: n.position || { x: 200, y: 200 },
        data: { ...n.data, type: componentType },
      };
    });
    const rfEdges = arch.edges.map((e) => ({
      ...e, type: 'smoothstep', style: { stroke: '#4c6ef5', strokeWidth: 2 },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full rounded-2xl overflow-hidden"
        style={{ background: '#12151d', border: '1px solid #2e3650', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxWidth: 480 }}>
 
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2335' }}>
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-brand-400" />
            <span className="font-semibold text-white">Saved Architectures</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
 
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
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
                /* Changed outer element from button to div to avoid nested-button error */
                <div key={arch._id}
                  onClick={() => loadArch(arch)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && loadArch(arch)}
                  className="w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-all hover:bg-surface-300 group"
                  style={{ background: '#1e2335', border: '1px solid #2e3650' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{arch.name}</span>
                    <button
                      onClick={(e) => deleteArch(arch._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all rounded"
                      style={{ background: 'transparent' }}>
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