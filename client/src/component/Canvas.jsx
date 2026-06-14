import  { useCallback, useMemo , useEffect , useRef} from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import { useAppStore } from '../zustand/UseAppstore.js';
import SimNode from './SimNode.jsx';
import { NODE_TYPES } from '../config/NodeTypes.js';
import { v4 as uuid } from 'uuid';

const nodeTypes = {
  simNode: SimNode,
};


export default function Canvas() {
  const {
    setNodes: storeSetNodes,
    setEdges: storeSetEdges,
    isSimulating,
    nodes: storeNodes,
    edges: storeEdges,
    deleteNode,
    deleteEdge,
    selectedNode,
  } = useAppStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Keep a ref to the "version" of storeNodes so we can tell when an external
  // write happened (preset load / AI generate / load-from-db).
  // We compare serialised IDs rather than array length alone so renaming/
  // replacing nodes of the same count is also detected.
  const storeNodesKey = storeNodes.map((n) => n.id).join(',');
  const storeEdgesKey = storeEdges.map((e) => e.id).join(',');
  const prevNodesKey = useRef('');
  const prevEdgesKey = useRef('');

  useEffect(() => {
    if (storeNodesKey !== prevNodesKey.current) {
      prevNodesKey.current = storeNodesKey;
      setNodes(storeNodes);
    }
  }, [storeNodesKey]);

  useEffect(() => {
    if (storeEdgesKey !== prevEdgesKey.current) {
      prevEdgesKey.current = storeEdgesKey;
      setEdges(storeEdges);
    }
  }, [storeEdgesKey]);

  // ── Keyboard delete handler ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't fire when typing in an input / textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          deleteNode(selectedNode.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode]);
  // ─────────────────────────────────────────────────────────────────────────

  const handleNodesChange = useCallback(
    (changes) => onNodesChange(changes),
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes) => onEdgesChange(changes),
    [onEdgesChange]
  );

  // Persist positions back to store after user drags a node
  const handleNodeDragStop = useCallback(
    (_, node) => {
      storeSetNodes((prev) =>
        prev.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
      );
    },
    [storeSetNodes]
  );

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: uuid(),
        animated: isSimulating,
        type: 'smoothstep',
        style: { stroke: '#4c6ef5', strokeWidth: 2 },
      };
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        storeSetEdges(updated);
        return updated;
      });
    },
    [isSimulating, setEdges, storeSetEdges]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/simnode');
      if (!type) return;

      const bounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 80,
        y: event.clientY - bounds.top - 40,
      };

      const config = NODE_TYPES[type] || NODE_TYPES.server;
      const newNode = {
        id: uuid(),
        type: 'simNode',
        position,
        data: { type, label: config.label, ...config.defaultData },
      };

      setNodes((nds) => {
        const updated = [...nds, newNode];
        storeSetNodes(updated);
        return updated;
      });
    },
    [setNodes, storeSetNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const animatedEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        animated: isSimulating,
        style: { ...e.style, stroke: isSimulating ? '#4c6ef5' : '#2e3650' },
      })),
    [edges, isSimulating]
  );

  const minimapNodeColor = useCallback((node) => {
    const config = NODE_TYPES[node.data?.type];
    return config?.borderColor || '#475569';
  }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={animatedEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStop={handleNodeDragStop}
        onEdgesDelete={(deletedEdges) => {
          deletedEdges.forEach((e) => deleteEdge(e.id));
        }}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e2335" />
        <Controls />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(13, 15, 20, 0.8)"
          style={{ background: '#12151d' }}
        />

        {nodes.length === 0 && (
          <Panel position="top-center">
            <div className="mt-20 text-center pointer-events-none select-none">
              <div className="text-4xl mb-3 opacity-30">&#x2B21;</div>
              <p className="text-slate-500 text-sm">
                Drag components from the sidebar to build your architecture
              </p>
              <p className="text-slate-600 text-xs mt-1">
                or load a preset template to get started
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}