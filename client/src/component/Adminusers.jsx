import  { useState, useEffect, useCallback } from 'react';
import { Search, Shield, ShieldOff, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminAPI } from '../api/apiService.js';

function Badge({ children, color = '#4c6ef5' }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
      {children}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading]   = useState(false);
  const [actionId, setActionId] = useState(null); // tracks in-flight action
  const [confirmDelete, setConfirmDelete] = useState(null);

  const PAGE_SIZE = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers({ page, limit: PAGE_SIZE, search, role: roleFilter });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleRole = async (user) => {
    setActionId(user._id);
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      const updated = await adminAPI.updateUserRole(user._id, newRole);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: updated.role } : u));
    } finally {
      setActionId(null);
    }
  };

  const deleteUser = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    setActionId(id);
    try {
      await adminAPI.deleteUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      setTotal(t => t - 1);
    } finally {
      setActionId(null);
      setConfirmDelete(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[200px]"
          style={{ background: '#12151d', border: '1px solid #2e3650' }}>
          <Search size={14} color="#475569" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="text-xs px-3 py-2 rounded-lg outline-none"
          style={{ background: '#12151d', border: '1px solid #2e3650', color: '#e2e8f0' }}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={fetchUsers} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all"
          style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="text-xs text-slate-500 ml-auto">{total} users</span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2335' }}>
        {/* Header */}
        <div className="grid text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5"
          style={{ gridTemplateColumns: '2fr 2fr 80px 70px 100px', background: '#12151d', borderBottom: '1px solid #1e2335' }}>
          <span>Name</span>
          <span>Email</span>
          <span className="text-center">Role</span>
          <span className="text-center">Archs</span>
          <span className="text-center">Actions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-600">
            <RefreshCw size={16} className="animate-spin mr-2" /> Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-600 text-sm">No users found</div>
        ) : (
          <div>
            {users.map((user, i) => (
              <div key={user._id}
                className="grid items-center px-4 py-3 transition-colors hover:bg-surface-300"
                style={{
                  gridTemplateColumns: '2fr 2fr 80px 70px 100px',
                  background: i % 2 === 0 ? '#0d0f14' : '#12151d',
                  borderBottom: '1px solid #1e2335',
                }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: user.role === 'admin' ? '#4c6ef520' : '#1e2335',
                             color: user.role === 'admin' ? '#6b8cff' : '#94a3b8' }}>
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm text-slate-200 truncate">{user.name}</span>
                </div>
                <span className="text-xs text-slate-400 truncate pr-2">{user.email}</span>
                <div className="flex justify-center">
                  <Badge color={user.role === 'admin' ? '#4c6ef5' : '#475569'}>
                    {user.role}
                  </Badge>
                </div>
                <div className="text-center text-xs font-mono text-slate-400">{user.archCount}</div>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => toggleRole(user)}
                    disabled={actionId === user._id}
                    title={user.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
                    style={{
                      background: user.role === 'admin' ? '#f59e0b20' : '#4c6ef520',
                      color: user.role === 'admin' ? '#f59e0b' : '#6b8cff',
                    }}>
                    {user.role === 'admin'
                      ? <ShieldOff size={13} />
                      : <Shield size={13} />}
                  </button>
                  <button
                    onClick={() => deleteUser(user._id)}
                    disabled={actionId === user._id}
                    title={confirmDelete === user._id ? 'Click again to confirm' : 'Delete user'}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
                    style={{
                      background: confirmDelete === user._id ? '#ef4444' : '#ef444415',
                      color: confirmDelete === user._id ? 'white' : '#ef4444',
                    }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
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