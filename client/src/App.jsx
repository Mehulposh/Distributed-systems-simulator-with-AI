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
import { BarChart2, MessageSquare, LogIn, LogOut, User } from 'lucide-react';

export default function App() {
  const {
    token, user, setUser, logout,
    nodes, edges, currentArchName, currentArchId, setCurrentArchId,
    isSimulating, aiPanelOpen, setAiPanelOpen,
  } = useAppStore();

  const [showAuth, setShowAuth] = useState(false);
  const [showAIGen, setShowAIGen] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [rightPanel, setRightPanel] = useState('metrics'); // 'metrics' | 'ai'
  const [saveStatus, setSaveStatus] = useState('');

  // Initialize socket
  useSimulationSocket();

  // Fetch user on mount if token exists
  useEffect(() => {
    if (token && !user) {
      authAPI.me().then(({ user }) => setUser(user)).catch(() => {});
    }
  }, []);

  const handleSave = async () => {
    if (!token) {
      setShowAuth(true);
      return;
    }
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
    } catch (err) {
      console.error(err)
      setSaveStatus('Save failed');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0d0f14' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-end gap-2 px-4 py-1.5 flex-shrink-0"
        style={{ background: '#0d0f14', borderBottom: '1px solid #12151d', height: 36 }}
      >
        {saveStatus && (
          <span className="text-xs text-green-400 font-medium">{saveStatus}</span>
        )}
        <div className="flex-1" />

        {/* Right panel toggles */}
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={() => setRightPanel('metrics')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all"
            style={{
              background: rightPanel === 'metrics' ? '#4c6ef520' : 'transparent',
              color: rightPanel === 'metrics' ? '#6b8cff' : '#475569',
              border: rightPanel === 'metrics' ? '1px solid #4c6ef540' : '1px solid transparent',
            }}
          >
            <BarChart2 size={12} />
            Metrics
          </button>
          <button
            onClick={() => setRightPanel('ai')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all"
            style={{
              background: rightPanel === 'ai' ? '#7c3aed20' : 'transparent',
              color: rightPanel === 'ai' ? '#a78bfa' : '#475569',
              border: rightPanel === 'ai' ? '1px solid #7c3aed40' : '1px solid transparent',
            }}
          >
            <MessageSquare size={12} />
            ArchAI
          </button>
        </div>

        {/* Auth */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs" style={{ background: '#1e2335', color: '#94a3b8' }}>
              <User size={11} />
              {user.name}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <LogOut size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:opacity-90"
            style={{ background: '#4c6ef5', color: 'white' }}
          >
            <LogIn size={11} />
            Sign In
          </button>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <Sidebar />

        {/* Center — toolbar + canvas */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Toolbar
            onSave={handleSave}
            onOpenLoad={() => {
              if (!token) { setShowAuth(true); return; }
              setShowLoad(true);
            }}
            onAIGenerate={() => {
              if (!token) { setShowAuth(true); return; }
              setShowAIGen(true);
            }}
          />
          <div className="flex-1 relative overflow-hidden">
            <Canvas />
            <NodeInspector />
          </div>
        </div>

        {/* Right panel */}
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: 340, borderLeft: '1px solid #1e2335' }}
        >
          {rightPanel === 'metrics' ? <MetricsDashboard /> : <AIPanel />}
        </div>
      </div>

      {/* Alerts */}
      <AlertsToast />

      {/* Modals */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showAIGen && <AIGenerateModal onClose={() => setShowAIGen(false)} />}
      {showLoad && <LoadModal onClose={() => setShowLoad(false)} />}
    </div>
  );
}