import  { useState, useEffect, useCallback } from 'react';
import { Search, Globe, Lock, Trash2, RefreshCw, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { adminAPI } from '../api/apiService.js';

export default function AdminArchitectures() {
  const [archs, setArchs]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [visFilter, setVisFilter] = useState('');
  const [loading, setLoading]     = useState(false);
  const [actionId, setActionId]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const PAGE_SIZE = 15;

  const fetchArchs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getArchitectures({
        page, limit: PAGE_SIZE, search, isPublic: visFilter,
      });
      setArchs(data.architectures);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, visFilter]);

  useEffect(() => { fetchArchs(); }, [fetchArchs]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleVisibility = async (arch) => {
    setActionId(arch._id);
    try {
      await adminAPI.updateArchVisibility(arch._id, !arch.isPublic);
      setArchs(prev => prev.map(a => a._id === arch._id ? { ...a, isPublic: !a.isPublic } : a));
    } finally {
      setActionId(null);
    }
  };

  const deleteArch = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    setActionId(id);
    try {
      await adminAPI.deleteArchitecture(id);
      setArchs(prev => prev.filter(a => a._id !== id));
      setTotal(t => t - 1);
    } finally {
      setActionId(null);
      setConfirmDelete(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[200px]"
          style={{ background: '#12151d', border: '1px solid #2e3650' }}>
          <Search size={14} color="#475569" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none" />
        </div>
        <select value={visFilter} onChange={e => { setVisFilter(e.target.value); setPage(1); }}
          className="text-xs px-3 py-2 rounded-lg outline-none"
          style={{ background: '#12151d', border: '1px solid #2e3650', color: '#e2e8f0' }}>
          <option value="">All</option>
          <option value="true">Public only</option>
          <option value="false">Private only</option>
        </select>
        <button onClick={fetchArchs} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
          style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="text-xs text-slate-500 ml-auto">{total} architectures</span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2335' }}>
        <div className="grid text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5"
          style={{ gridTemplateColumns: '2fr 1.5fr 70px 60px 60px 90px', background: '#12151d', borderBottom: '1px solid #1e2335' }}>
          <span>Name</span><span>Owner</span><span className="text-center">Visibility</span>
          <span className="text-center">Nodes</span><span className="text-center">Forks</span>
          <span className="text-center">Actions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-600">
            <RefreshCw size={16} className="animate-spin mr-2" />Loading...
          </div>
        ) : archs.length === 0 ? (
          <div className="text-center py-16 text-slate-600 text-sm">No architectures found</div>
        ) : archs.map((arch, i) => (
          <div key={arch._id}
            className="grid items-center px-4 py-3"
            style={{
              gridTemplateColumns: '2fr 1.5fr 70px 60px 60px 90px',
              background: i % 2 === 0 ? '#0d0f14' : '#12151d',
              borderBottom: '1px solid #1e2335',
            }}>
            <div className="min-w-0 pr-2">
              <div className="text-sm text-slate-200 truncate">{arch.name}</div>
              <div className="text-[10px] text-slate-600">{new Date(arch.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="min-w-0 pr-2">
              <div className="text-xs text-slate-400 truncate">{arch.userId?.name || 'Unknown'}</div>
              <div className="text-[10px] text-slate-600 truncate">{arch.userId?.email}</div>
            </div>
            <div className="flex justify-center">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"
                style={{
                  background: arch.isPublic ? '#10b98120' : '#1e2335',
                  color: arch.isPublic ? '#10b981' : '#475569',
                  border: `1px solid ${arch.isPublic ? '#10b98140' : '#2e3650'}`,
                }}>
                {arch.isPublic ? <Globe size={9} /> : <Lock size={9} />}
                {arch.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            <div className="text-center text-xs font-mono text-slate-400">{arch.nodes?.length || 0}</div>
            <div className="text-center text-xs font-mono text-slate-400">{arch.forkCount || 0}</div>
            <div className="flex items-center justify-center gap-1.5">
              <button onClick={() => toggleVisibility(arch)} disabled={actionId === arch._id}
                title={arch.isPublic ? 'Make private' : 'Make public'}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
                style={{ background: arch.isPublic ? '#f59e0b20' : '#10b98120', color: arch.isPublic ? '#f59e0b' : '#10b981' }}>
                {arch.isPublic ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button onClick={() => deleteArch(arch._id)} disabled={actionId === arch._id}
                title={confirmDelete === arch._id ? 'Confirm delete' : 'Delete'}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
                style={{ background: confirmDelete === arch._id ? '#ef4444' : '#ef444415', color: confirmDelete === arch._id ? 'white' : '#ef4444' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
              style={{ background: '#1e2335', color: '#94a3b8' }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
              style={{ background: '#1e2335', color: '#94a3b8' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}