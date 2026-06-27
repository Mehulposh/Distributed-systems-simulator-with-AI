import  { useState, useEffect } from 'react';
import { useAppStore } from './zustand/UseAppstore.js';
import { authAPI, archAPI } from './api/apiService.js';
import Sidebar from './component/SideBar.jsx';
import Canvas from './component/Canvas.jsx';
import Toolbar from './component/ToolBar.jsx';
import NodeInspector from './component/NodeInspector.jsx';
import MetricsDashboard from './pages/Metricsdashboard.jsx';
import AIPanel from './pages/AiPanel.jsx';
import AuthModal from './component/Authmodal.jsx';
import AIGenerateModal from './component/Aigeneratemodal.jsx';
import LoadModal from './component/Loadmodal.jsx';
import AlertsToast from './component/Alertstoast.jsx';
import { useSimulationSocket } from './socket/UseSimulationSocket.jsx';
import { BarChart2, MessageSquare, LogIn, LogOut, User,
  LayoutDashboard, Bot, Menu, X, ShieldCheck } from 'lucide-react';

import AdminDashboard from './pages/Admindashboard.jsx';

// Hook to get window width reactively
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

export default function App() {
  const {
    token, user, setUser, logout,
    nodes, edges, currentArchName, currentArchId, setCurrentArchId,
  } = useAppStore();

  const [showAuth, setShowAuth]     = useState(false);
  const [showAIGen, setShowAIGen]   = useState(false);
  const [showLoad, setShowLoad]     = useState(false);
  const [showAdmin, setShowAdmin]   = useState(false);
  const [rightPanel, setRightPanel] = useState('metrics');
  const [saveStatus, setSaveStatus] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);  // mobile drawer
  const [mobileTab, setMobileTab]   = useState('canvas'); // canvas | metrics | ai

  const width    = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useSimulationSocket();

  useEffect(() => {
    if (token && !user) {
      authAPI.me().then(({ user: u }) => setUser(u)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSave = async () => {
    if (!token) { setShowAuth(true); return; }
    try {
      const payload = {
        name: currentArchName,
        nodes: nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.type })),
      };
      if (currentArchId) {
        await archAPI.update(currentArchId, payload);
      } else {
        const saved = await archAPI.create(payload);
        setCurrentArchId(saved._id);
      }
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch {
      setSaveStatus('Save failed');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0d0f14' }}>
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-3 py-2 shrink-0"
          style={{ background: '#12151d', borderBottom: '1px solid #1e2335', height: 48 }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ background: '#1e2335' }}>
              <Menu size={16} color="#94a3b8" />
            </button>
            <div className="text-sm font-bold" style={{ color: '#4c6ef5' }}>DistSim</div>
          </div>
          <div className="flex items-center gap-1.5">
            {saveStatus && <span className="text-[10px] text-green-400">{saveStatus}</span>}
            {user ? (
              <div className="flex items-center gap-1.5">
                {user?.role === 'admin' && (
                  <button onClick={() => setShowAdmin(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                    style={{ background: '#4c6ef520' }}>
                    <ShieldCheck size={14} color="#6b8cff" />
                  </button>
                )}
                <button onClick={logout}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                  style={{ background: '#1e2335', color: '#94a3b8' }}>
                  <User size={11} />
                  <LogOut size={10} />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
                style={{ background: '#4c6ef5', color: 'white' }}>
                <LogIn size={11} />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Toolbar (compact) */}
        <Toolbar
          onSave={handleSave}
          onOpenLoad={() => { if (!token) { setShowAuth(true); return; } setShowLoad(true); }}
          onAIGenerate={() => { if (!token) { setShowAuth(true); return; } setShowAIGen(true); }}
          compact
        />

        {/* Content area — swapped by tab */}
        <div className="flex-1 overflow-hidden relative">
          <div style={{ display: mobileTab === 'canvas' ? 'block' : 'none', height: '100%' }}>
            <Canvas />
            <NodeInspector />
          </div>
          <div style={{ display: mobileTab === 'metrics' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
            <MetricsDashboard />
          </div>
          <div style={{ display: mobileTab === 'ai' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
            <AIPanel />
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="flex shrink-0" style={{ background: '#12151d', borderTop: '1px solid #1e2335', height: 56 }}>
          {[
            { id: 'canvas',  icon: LayoutDashboard, label: 'Canvas'  },
            { id: 'metrics', icon: BarChart2,        label: 'Metrics' },
            { id: 'ai',      icon: Bot,              label: 'ArchAI'  },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setMobileTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all"
              style={{ color: mobileTab === id ? '#4c6ef5' : '#475569' }}>
              <Icon size={18} />
              <span className="text-[10px] font-medium">{label}</span>
              {mobileTab === id && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full" style={{ background: '#4c6ef5' }} />
              )}
            </button>
          ))}
        </div>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setSidebarOpen(false)} />
            <div className="relative z-10 h-full overflow-y-auto" style={{ width: 260 }}>
              <div className="absolute top-3 right-3">
                <button onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg"
                  style={{ background: '#2e3650' }}>
                  <X size={14} color="#94a3b8" />
                </button>
              </div>
              <Sidebar onSelect={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <AlertsToast />
        {showAuth    && <AuthModal        onClose={() => setShowAuth(false)} />}
        {showAIGen   && <AIGenerateModal  onClose={() => setShowAIGen(false)} />}
        {showLoad    && <LoadModal        onClose={() => setShowLoad(false)} />}
        {showAdmin   && <AdminDashboard   onClose={() => setShowAdmin(false)} />}
      </div>
    );
  }

  // ── TABLET LAYOUT (768–1023px) ─────────────────────────────────────────────
  if (isTablet) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0d0f14' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-1.5 shrink-0"
          style={{ background: '#0d0f14', borderBottom: '1px solid #12151d', height: 36 }}>
          <div className="flex items-center gap-1.5">
            <div className="text-sm font-bold" style={{ color: '#4c6ef5' }}>DistSim</div>
          </div>
          <div className="flex items-center gap-1.5">
            {saveStatus && <span className="text-xs text-green-400">{saveStatus}</span>}
            <div className="flex items-center gap-1">
              {[
                { id: 'metrics', Icon: BarChart2,       label: 'Metrics' },
                { id: 'ai',      Icon: MessageSquare,   label: 'ArchAI'  },
              ].map(({ id, Icon, label }) => (
                <button key={id} onClick={() => setRightPanel(id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all"
                  style={{
                    background: rightPanel === id ? (id === 'ai' ? '#7c3aed20' : '#4c6ef520') : 'transparent',
                    color: rightPanel === id ? (id === 'ai' ? '#a78bfa' : '#6b8cff') : '#475569',
                    border: `1px solid ${rightPanel === id ? (id === 'ai' ? '#7c3aed40' : '#4c6ef540') : 'transparent'}`,
                  }}>
                  <Icon size={11} />{label}
                </button>
              ))}
            </div>
            {user ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] px-2 py-1 rounded-md" style={{ background: '#1e2335', color: '#94a3b8' }}>
                  {user.name.split(' ')[0]}
                </span>
                {user?.role === 'admin' && (
                  <button onClick={() => setShowAdmin(true)}
                    className="w-6 h-6 flex items-center justify-center rounded-md transition-all"
                    style={{ background: '#4c6ef520', color: '#6b8cff' }}
                    title="Admin Dashboard">
                    <ShieldCheck size={11} />
                  </button>
                )}
                <button onClick={logout} className="text-slate-500 hover:text-slate-300 p-1">
                  <LogOut size={11} />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                style={{ background: '#4c6ef5', color: 'white' }}>
                <LogIn size={10} />Sign In
              </button>
            )}
          </div>
        </div>

        {/* Main: sidebar + canvas stacked with right panel below */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar narrow */}
          <div className="shrink-0" style={{ width: 200 }}>
            <Sidebar narrow />
          </div>

          {/* Center + right stacked vertically */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Toolbar
              onSave={handleSave}
              onOpenLoad={() => { if (!token) { setShowAuth(true); return; } setShowLoad(true); }}
              onAIGenerate={() => { if (!token) { setShowAuth(true); return; } setShowAIGen(true); }}
              compact
            />
            {/* Canvas top 60%, panel bottom 40% */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="overflow-hidden relative" style={{ flex: '0 0 60%' }}>
                <Canvas />
                <NodeInspector />
              </div>
              <div className="overflow-hidden" style={{ flex: '0 0 40%', borderTop: '1px solid #1e2335' }}>
                {rightPanel === 'metrics' ? <MetricsDashboard /> : <AIPanel />}
              </div>
            </div>
          </div>
        </div>

        <AlertsToast />
        {showAuth    && <AuthModal        onClose={() => setShowAuth(false)} />}
        {showAIGen   && <AIGenerateModal  onClose={() => setShowAIGen(false)} />}
        {showLoad    && <LoadModal        onClose={() => setShowLoad(false)} />}
        {showAdmin   && <AdminDashboard   onClose={() => setShowAdmin(false)} />}
      </div>
    );
  }

  // ── DESKTOP LAYOUT (1024px+) ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0d0f14' }}>
      {/* Top bar */}
      <div className="flex items-center justify-end gap-2 px-4 py-1.5 shrink-0"
        style={{ background: '#0d0f14', borderBottom: '1px solid #12151d', height: 36 }}>
        {saveStatus && <span className="text-xs text-green-400 font-medium">{saveStatus}</span>}
        <div className="flex-1" />
        <div className="flex items-center gap-1 mr-2">
          {[
            { id: 'metrics', Icon: BarChart2,     label: 'Metrics', activeColor: '#6b8cff', activeBg: '#4c6ef520', activeBorder: '#4c6ef540' },
            { id: 'ai',      Icon: MessageSquare, label: 'ArchAI',  activeColor: '#a78bfa', activeBg: '#7c3aed20', activeBorder: '#7c3aed40' },
          ].map(({ id, Icon, label, activeColor, activeBg, activeBorder }) => (
            <button key={id} onClick={() => setRightPanel(id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all"
              style={{
                background: rightPanel === id ? activeBg : 'transparent',
                color: rightPanel === id ? activeColor : '#475569',
                border: `1px solid ${rightPanel === id ? activeBorder : 'transparent'}`,
              }}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
              style={{ background: '#1e2335', color: '#94a3b8' }}>
              <User size={11} />{user.name}
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => setShowAdmin(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:opacity-90"
                style={{ background: '#4c6ef520', color: '#6b8cff', border: '1px solid #4c6ef540' }}>
                <ShieldCheck size={11} />Admin
              </button>
            )}
            <button onClick={logout}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <LogOut size={11} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:opacity-90"
            style={{ background: '#4c6ef5', color: 'white' }}>
            <LogIn size={11} />Sign In
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Toolbar
            onSave={handleSave}
            onOpenLoad={() => { if (!token) { setShowAuth(true); return; } setShowLoad(true); }}
            onAIGenerate={() => { if (!token) { setShowAuth(true); return; } setShowAIGen(true); }}
          />
          <div className="flex-1 relative overflow-hidden">
            <Canvas />
            <NodeInspector />
          </div>
        </div>
        <div className= "shrink-0 overflow-hidden"
          style={{ width: 340, borderLeft: '1px solid #1e2335' }}>
          {rightPanel === 'metrics' ? <MetricsDashboard /> : <AIPanel />}
        </div>
      </div>

      <AlertsToast />
      {showAuth    && <AuthModal        onClose={() => setShowAuth(false)} />}
      {showAIGen   && <AIGenerateModal  onClose={() => setShowAIGen(false)} />}
      {showLoad    && <LoadModal        onClose={() => setShowLoad(false)} />}
      {showAdmin   && <AdminDashboard   onClose={() => setShowAdmin(false)} />}
    </div>
  );
}