import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // Auth
  user: null,
  token: localStorage.getItem('token') || null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  // Canvas nodes/edges
  nodes: [],
  edges: [],
  setNodes: (nodesOrUpdater) =>
    set((state) => ({
      nodes: typeof nodesOrUpdater === 'function'
        ? nodesOrUpdater(state.nodes)
        : nodesOrUpdater,
    })),
  setEdges: (edgesOrUpdater) =>
    set((state) => ({
      edges: typeof edgesOrUpdater === 'function'
        ? edgesOrUpdater(state.edges)
        : edgesOrUpdater,
    })),
  
  // Delete a node and all its connected edges
  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
    })),
 
  // Delete a single edge
  deleteEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),

  // Selected node for inspect panel
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),

  // Simulation state
  isSimulating: false,
  simulationConfig: { rps: 1000, duration: 60, readWriteRatio: 0.8, payloadSize: 1 },
  setSimulating: (v) => set({ isSimulating: v }),
  setSimulationConfig: (config) =>
    set((s) => ({ simulationConfig: { ...s.simulationConfig, ...config } })),

  // Live metrics from socket
  nodeMetrics: [],
  globalMetrics: {},
  metricsHistory: [], // [{timestamp, globalMetrics}]
  setNodeMetrics: (metrics) => set({ nodeMetrics: metrics }),
  setGlobalMetrics: (metrics) =>
    set((s) => ({
      globalMetrics: metrics,
      metricsHistory: [
        ...s.metricsHistory.slice(-59),
        { timestamp: Date.now(), ...metrics },
      ],
    })),
  clearMetrics: () => set({ nodeMetrics: [], globalMetrics: {}, metricsHistory: [] }),

  // Alerts / events
  alerts: [],
  addAlert: (alert) =>
    set((s) => ({ alerts: [{ id: Date.now(), ...alert }, ...s.alerts].slice(0, 20) })),
  removeAlert: (id) =>
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  clearAlerts: () => set({ alerts: [] }),

  // UI panels
  activePanel: 'canvas', // 'canvas' | 'metrics' | 'ai'
  setActivePanel: (panel) => set({ activePanel: panel }),
  aiPanelOpen: false,
  setAiPanelOpen: (v) => set({ aiPanelOpen: v }),

  // Current architecture
  currentArchName: 'Untitled Architecture',
  setCurrentArchName: (name) => set({ currentArchName: name }),
  currentArchId: null,
  setCurrentArchId: (id) => set({ currentArchId: id }),

  // Failed nodes from failure injection
  failedNodes: [],
  setFailedNodes: (nodes) => set({ failedNodes: nodes }),
}));