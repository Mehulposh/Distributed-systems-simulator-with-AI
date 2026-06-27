import { create } from 'zustand';

/**
 * Application state store for the distributed system simulator.
 * Manages authentication, canvas state, simulation configuration,
 * live metrics, alerts, and UI panel selection.
 */
export const useAppStore = create((set) => ({
  // Auth state and helpers
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

  // Canvas nodes and edges for the editor graph
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

  // Remove a node and any connected edges from the graph.
  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
    })),
 
  // Remove a single connection edge.
  deleteEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),

  // Currently selected node for the inspector panel.
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),

  // Simulation control and configuration.
  isSimulating: false,
  simulationConfig: { rps: 1000, duration: 60, readWriteRatio: 0.8, payloadSize: 1 },
  setSimulating: (v) => set({ isSimulating: v }),
  setSimulationConfig: (config) =>
    set((s) => ({ simulationConfig: { ...s.simulationConfig, ...config } })),

  // Live metrics streamed from the simulator socket.
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

  // Client-side alert notifications.
  alerts: [],
  addAlert: (alert) =>
    set((s) => ({ alerts: [{ id: Date.now(), ...alert }, ...s.alerts].slice(0, 20) })),
  removeAlert: (id) =>
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  clearAlerts: () => set({ alerts: [] }),

  // UI panel visibility state.
  activePanel: 'canvas', // 'canvas' | 'metrics' | 'ai'
  setActivePanel: (panel) => set({ activePanel: panel }),
  aiPanelOpen: false,
  setAiPanelOpen: (v) => set({ aiPanelOpen: v }),

  // Current architecture metadata.
  currentArchName: 'Untitled Architecture',
  setCurrentArchName: (name) => set({ currentArchName: name }),
  currentArchId: null,
  setCurrentArchId: (id) => set({ currentArchId: id }),

  // Simulated failure injection state.
  failedNodes: [],
  setFailedNodes: (nodes) => set({ failedNodes: nodes }),
}));