/**
 * Entry point for the backend server.
 * Configures Express middleware, API routes, health checking,
 * Socket.io simulation event handling, and MongoDB connectivity.
 */
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import architectureRoutes from './routes/ArchitectureRoutes.js';
import simulationRoutes from './routes/SimulationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import presetRoutes from './routes/PresetRoutes.js';
import adminRoutes from './routes/adminRoutes.js'
import { setupSimulationSocket } from './Simulationservice/Simulationservice.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://fronend:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://frontend:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/architectures', architectureRoutes);
app.use('/api/admin', adminRoutes)
app.use('/api/simulation', simulationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/presets', presetRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.io simulation handler
setupSimulationSocket(io);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/distributed-sim';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export { app, io };