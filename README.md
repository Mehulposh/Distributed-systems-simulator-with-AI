# Distributed Systems Simulator with AI

DistSim is a full-stack MERN web application that lets you **drag, drop, connect and simulate** distributed system architectures in your browser. Build a topology using components like load balancers, caches, databases, and message queues — then fire configurable traffic at it and watch real-time latency, throughput, and error metrics update live on every node.
 
An embedded **AI assistant powered by Claude** (ArchAI) can analyze your architecture for bottlenecks, explain what each component does, or generate an entire system design from a natural-language prompt like _"design a ride-sharing backend like Uber"_.
 
Built for developers, engineering students, and system design interview candidates who want to go beyond reading about distributed systems and actually **see** how architectural decisions affect performance numbers.

---
 
## Features
 
### Visual Canvas
- Drag-and-drop 9 component types onto a React Flow canvas
- Connect components with animated edges showing data flow direction
- Click any node to open the **Node Inspector** with live metrics and AI explanation
- Delete nodes via the red hover button, `Delete` / `Backspace` key, or inspector panel
- Auto-layout when loading AI-generated or preset architectures
### Simulation Engine
- Tick-based engine running on the backend, streaming metrics every **500ms** via WebSocket
- Gaussian latency model with utilization-based degradation — the more load you push, the worse latency gets
- Configurable: RPS (100–100,000), duration (30s–300s), read/write ratio
- Real per-component behaviour: cache hit/miss blending, queue depth accumulation, shard hotspot detection
### Failure Injection
- **Kill a node** — marks it as `DOWN`, cascades through connected components, auto-recovers in 15s
- **Traffic spike** — multiplies RPS by 10 for 8 seconds, watch your p99 explode
- **Network partition** — isolates half the topology for 20 seconds to demonstrate CAP theorem tradeoffs
### Real-Time Metrics Dashboard
| Tab | What you see |
|---|---|
| Overview | KPI cards + latency/error rate area charts |
| Latency | p50 vs p99 line chart over time |
| Throughput | RPS area chart + cache hit ratio |
| Nodes | Per-node latency/error bar charts + status table |
 
### ArchAI — AI Assistant
- Streaming chat with full architecture context sent automatically
- **Analyze** — one-click bottleneck and single-point-of-failure detection
- **Generate** — describe any system in plain English, get a complete topology applied to the canvas
- **Explain** — click any node and ask "what does this do?"
- Quick prompts: optimize for performance, make it globally distributed, scale to 1M users, and more
### Persistence & Community
- Save, load, edit, and delete personal architectures
- Make architectures **public** and share them with the community
- Browse the **Community Gallery** and **fork** any public architecture into your account
- **Simulation History** — save completed simulation runs with full metric summaries and review them later
- 5 built-in preset templates loaded from MongoDB
### Admin Dashboard
- Platform analytics: user growth trends, architecture creation, most-used components
- User management: search, promote/demote admin, delete accounts
- Architecture moderation: toggle visibility, delete
- Preset template management
---
 
## Tech Stack
 
| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | SPA with HMR |
| Canvas | React Flow 11 | Drag-and-drop node graph |
| State | Zustand 4 | Global state management |
| Charts | Recharts 2 | Live metrics visualisation |
| Styling | Tailwind CSS 3 | Utility-first dark theme |
| Backend | Node.js 20 + Express 4 | REST API server |
| Real-time | Socket.io 4 | Bidirectional metrics streaming |
| Database | MongoDB 7 + Mongoose 8 | Persistence layer |
| AI | Anthropic Claude Sonnet | Architecture assistant |
| Auth | JWT + bcryptjs | Stateless authentication |
| Container | Docker + Docker Compose | One-command local setup |
 
---

## Project Structure

```text
client/         # React frontend
server/         # Express backend
Dockerfile      # Docker setup for services
docker-compose.yml
```

## Prerequisites

- Node.js 18+
- npm or pnpm
- MongoDB running locally or accessible remotely
- Docker and Docker Compose (optional, recommended)

## Environment Variables

Create a `.env` file in the project root with values similar to:

```env
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

The backend also uses these defaults if not provided:

- `PORT=8080`
- `MONGO_URI=mongodb://localhost:27017/distributed-sim`
- `CLIENT_URL=http://localhost:5173`

## Running Locally

### 1. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Start MongoDB

Make sure MongoDB is running on your machine or update `MONGO_URI` to match your setup.

### 3. Start the backend

```bash
cd server
npm start
```

### 4. Start the frontend

```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:8080`.

## Running with Docker

```bash
docker compose up --build
```

This starts:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:8080`

## API Reference
 
### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | None | Create a new account |
| POST | `/api/v1/auth/login` | None | Log in, receive JWT |
| GET | `/api/v1/auth/me` | JWT | Get current user |
 
### Architectures
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/architectures` | JWT | List your saved architectures |
| POST | `/api/v1/architectures` | JWT | Save a new architecture |
| GET | `/api/v1/architectures/:id` | Optional | Load by ID (public or owned) |
| PUT | `/api/v1/architectures/:id` | JWT | Update an architecture |
| DELETE | `/api/v1/architectures/:id` | JWT | Delete an architecture |
| GET | `/api/v1/architectures/public` | Optional | Browse community gallery |
| POST | `/api/v1/architectures/:id/fork` | JWT | Fork a public architecture |
 
### Simulation
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/simulation/log` | JWT | Save a simulation run |
| GET | `/api/v1/simulation/logs` | JWT | Get your simulation history |
 
### AI
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/ai/analyze` | JWT | Analyze architecture for issues |
| POST | `/api/v1/ai/chat` | JWT | Streaming chat (SSE) |
| POST | `/api/v1/ai/generate-preset` | JWT | Generate architecture from prompt |
| POST | `/api/v1/ai/explain-component` | JWT | Explain a single component |
 
### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/admin/stats` | Admin | Platform analytics |
| GET | `/api/v1/admin/users` | Admin | List all users |
| PATCH | `/api/v1/admin/users/:id/role` | Admin | Promote/demote user |
| DELETE | `/api/v1/admin/users/:id` | Admin | Delete user and their data |
| GET | `/api/v1/admin/architectures` | Admin | List all architectures |
| PATCH | `/api/v1/admin/architectures/:id/visibility` | Admin | Toggle public/private |
| DELETE | `/api/v1/admin/architectures/:id` | Admin | Delete any architecture |
| GET | `/api/v1/admin/presets` | Admin | List all presets |
| DELETE | `/api/v1/admin/presets/:id` | Admin | Delete a preset |
| POST | `/api/v1/admin/make-admin` | Admin | Promote user to admin |
 
### WebSocket Events
```
Client → Server
  simulation:start    { config, nodes, edges }
  simulation:stop     {}
  simulation:inject   { type: 'kill' | 'spike' | 'partition', nodeId? }
 
Server → Client
  simulation:started  { sessionId }
  metrics:tick        { nodeMetrics[], globalMetrics, failedNodes[] }
  simulation:alert    { type, message, nodeId? }
  simulation:ended    { summary }
  simulation:error    { message }
```
 
---

Health check:

```bash
curl http://localhost:8080/api/health
```

---
 
## Component Simulation Profiles
 
Each component type has a realistic performance model built into the simulation engine:
 
| Component | Base Latency | Max Throughput | Base Error Rate |
|---|---|---|---|
| Load Balancer | 2ms | 100,000 rps | 0.1% |
| Redis Cache | 0.5ms hit / 50ms miss | 200,000 rps | 0.05% |
| PostgreSQL DB | 20ms read / 40ms write | 5,000 rps | 0.5% |
| DB Read Replica | 18ms | 8,000 rps | 0.3% |
| Kafka Queue | 3ms | 50,000 rps | 0.1% |
| API Gateway | 5ms | 80,000 rps | 0.2% |
| CDN | 0.3ms | 500,000 rps | 0.01% |
| DB Shard | 22ms | 4,000 rps | 0.6% |
| App Server | 10ms | 10,000 rps | 1.0% |
 
Latency increases exponentially as utilisation exceeds 80% of max throughput, modelled using a Gaussian distribution with ±30% variance per tick.

---
 
## Data Migration Scripts
 
If you have data from before certain schema changes were introduced, run these one-time backfill scripts:
 
```bash
cd backend
 
# Links architectures to their owner's savedArchitectures array
node scripts/backfill-saved-architectures.js
 
# Sets totalSimulations on each user from their existing SimulationLog records
node scripts/backfill-total-simulations.js
```
 
Both scripts are idempotent — safe to run multiple times.

## Notes

- The AI features depend on a valid Gemini API key.
- The app uses Socket.IO for live simulation updates.
- Admin-only routes require an authenticated user with the appropriate role.

## License

This project is currently licensed under the ISC license.

<div align="center">
  Built with React, Node.js, MongoDB, Socket.io and Claude AI
</div>