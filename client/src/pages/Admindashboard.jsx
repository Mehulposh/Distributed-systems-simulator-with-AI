import  { useState, useEffect } from 'react';
import {
  BarChart2, Users, FolderOpen, Activity, Layers, Globe,
  TrendingUp, ArrowLeft, RefreshCw, ShieldCheck,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { adminAPI } from '../api/apiService.js';
import AdminUsers from '../component/Adminusers.jsx';
import AdminArchitectures from '../component/Adminarchitectures.jsx';
import AdminPresets from '../component/AdminPresets.jsx';

// ── Palette ──────────────────────────────────────────────────────────────────
const NODE_COLORS = {
  loadBalancer:  '#4c6ef5', cache: '#fbbf24', database: '#10b981',
  replica:       '#34d399', messageQueue: '#f87171', apiGateway: '#a78bfa',
  cdn:           '#38bdf8', shard: '#fb923c', server: '#94a3b8',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color = '#4c6ef5', trend }) {
  return (
    <div className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: '#12151d', border: '1px solid #1e2335' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-500 mb-0.5">{label}</div>
        <div className="text-2xl font-bold font-mono text-white">{value}</div>
        {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className="ml-auto text-xs font-medium shrink-0"
          style={{ color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)} today
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#1e2335', border: '1px solid #2e3650' }}>
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white font-mono">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminAPI.stats();
      setStats(data);
    } catch (err) {
      setError(err.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const TABS = [
    { id: 'overview',       label: 'Overview',       icon: BarChart2  },
    { id: 'users',          label: 'Users',          icon: Users      },
    { id: 'architectures',  label: 'Architectures',  icon: FolderOpen },
    { id: 'presets',        label: 'Presets',        icon: Layers     },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0d0f14' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 shrink-0"
        style={{ background: '#12151d', borderBottom: '1px solid #1e2335' }}>
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to Simulator
        </button>
        <div className="w-px h-5 bg-surface-400" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#4c6ef5' }}>
            <ShieldCheck size={14} color="white" />
          </div>
          <span className="font-semibold text-white">Admin Dashboard</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: '#4c6ef520', color: '#6b8cff', border: '1px solid #4c6ef540' }}>
            DistSim
          </span>
        </div>
        <div className="flex-1" />
        <button onClick={fetchStats} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{ background: '#1e2335', color: '#94a3b8', border: '1px solid #2e3650' }}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 px-6 pt-3 shrink-0"
        style={{ borderBottom: '1px solid #1e2335' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-t-lg transition-all"
            style={{
              background: activeTab === id ? '#1e2335' : 'transparent',
              color: activeTab === id ? '#e2e8f0' : '#64748b',
              borderBottom: activeTab === id ? '2px solid #4c6ef5' : '2px solid transparent',
            }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-6 px-4 py-3 rounded-lg text-sm text-red-400"
            style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
            {error}
          </div>
        )}

        {activeTab === 'overview'      && <OverviewTab stats={stats} loading={loading} />}
        {activeTab === 'users'         && <AdminUsers />}
        {activeTab === 'architectures' && <AdminArchitectures />}
        {activeTab === 'presets'       && <AdminPresets />}
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw size={16} className="animate-spin" />
          Loading stats...
        </div>
      </div>
    );
  }
  if (!stats) return null;

  const { kpis, signupTrend, archTrend, nodeTypeStats, topForked } = stats;

  // Merge signup + arch trends by date
  const trendDates = [...new Set([
    ...signupTrend.map(d => d._id),
    ...archTrend.map(d => d._id),
  ])].sort();

  const trendData = trendDates.map(date => ({
    date: date.slice(5),  // MM-DD
    users: signupTrend.find(d => d._id === date)?.count || 0,
    archs: archTrend.find(d => d._id === date)?.count || 0,
  }));

  const nodeData = nodeTypeStats.map(n => ({
    type: n._id || 'unknown',
    count: n.count,
    color: NODE_COLORS[n._id] || '#475569',
  }));

  return (
    <div className="p-6 space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users}      label="Total Users"          value={kpis.totalUsers}
          color="#4c6ef5" trend={kpis.newUsersToday}
          sub={`+${kpis.newUsersToday} today`} />
        <KpiCard icon={FolderOpen} label="Architectures"        value={kpis.totalArchitectures}
          color="#10b981" trend={kpis.newArchsToday}
          sub={`${kpis.publicArchitectures} public`} />
        <KpiCard icon={Activity}   label="Simulations Run"      value={kpis.totalSimulations}
          color="#f59e0b" />
        <KpiCard icon={Layers}     label="Preset Templates"     value={kpis.totalPresets}
          color="#a78bfa" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signup + arch trend */}
        <div className="rounded-xl p-4" style={{ background: '#12151d', border: '1px solid #1e2335' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} color="#4c6ef5" />
            <span className="text-xs font-semibold text-slate-300">Activity — Last 14 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4c6ef5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="archGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="users" name="New Users"
                stroke="#4c6ef5" fill="url(#userGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="archs" name="New Architectures"
                stroke="#10b981" fill="url(#archGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className="w-2 h-2 rounded-full bg-blue-500" />Users
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />Architectures
            </div>
          </div>
        </div>

        {/* Node type usage */}
        <div className="rounded-xl p-4" style={{ background: '#12151d', border: '1px solid #1e2335' }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} color="#a78bfa" />
            <span className="text-xs font-semibold text-slate-300">Most Used Components</span>
          </div>
          {nodeData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
              No architecture data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={nodeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2335" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 10, fill: '#94a3b8' }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Usage" radius={[0, 4, 4, 0]}>
                  {nodeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top forked */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2335' }}>
        <div className="px-4 py-3 flex items-center gap-2"
          style={{ background: '#12151d', borderBottom: '1px solid #1e2335' }}>
          <Globe size={13} color="#fbbf24" />
          <span className="text-xs font-semibold text-slate-300">Top Community Architectures</span>
        </div>
        {topForked.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-600 text-sm">No public architectures yet</div>
        ) : (
          <div className="divide-y" style={{ divideColor: '#1e2335' }}>
            {topForked.map((arch, i) => (
              <div key={arch._id} className="flex items-center gap-3 px-4 py-3"
                style={{ background: i % 2 === 0 ? '#0d0f14' : '#12151d' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#fb923c', color: '#000' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{arch.name}</div>
                  <div className="text-[10px] text-slate-500">by {arch.userId?.name || 'Unknown'}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                  <FolderOpen size={11} />
                  {arch.forkCount} forks
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}