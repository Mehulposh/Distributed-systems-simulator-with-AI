import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '../zustand/UseAppstore.js';

let socketInstance = null;

export function useSimulationSocket() {
  const socketRef = useRef(null);
  const {
    setNodeMetrics,
    setGlobalMetrics,
    addAlert,
    setSimulating,
    setFailedNodes,
    nodes,
    simulationConfig,
    edges,
  } = useAppStore();

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io('http://localhost:8080', { transports: ['websocket'] });
    }
    socketRef.current = socketInstance;

    const socket = socketRef.current;

    socket.on('metrics:tick', ({ nodeMetrics, globalMetrics, failedNodes }) => {
      setNodeMetrics(nodeMetrics || []);
      setGlobalMetrics(globalMetrics || {});
      setFailedNodes(failedNodes || []);
    });

    socket.on('simulation:alert', (alert) => {
      addAlert(alert);
    });

    socket.on('simulation:ended', () => {
      setSimulating(false);
    });

    socket.on('simulation:error', ({ message }) => {
      addAlert({ type: 'error', message });
      setSimulating(false);
    });

    return () => {
      socket.off('metrics:tick');
      socket.off('simulation:alert');
      socket.off('simulation:ended');
      socket.off('simulation:error');
    };
  }, []);

  const startSimulation = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('simulation:start', {
      config: simulationConfig,
      nodes,
      edges,
    });
    setSimulating(true);
  }, [nodes, edges, simulationConfig]);

  const stopSimulation = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('simulation:stop');
    setSimulating(false);
  }, []);

  const injectFailure = useCallback((type, nodeId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('simulation:inject', { type, nodeId });
    addAlert({ type, message: `Injecting failure: ${type}${nodeId ? ` on ${nodeId}` : ''}` });
  }, []);

  return { startSimulation, stopSimulation, injectFailure };
}