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

## API Overview

The backend exposes REST endpoints under `/api` for:

- Authentication: `/api/auth`
- Architectures: `/api/architectures`
- Simulations: `/api/simulation`
- AI features: `/api/ai`
- Presets: `/api/presets`
- Admin actions: `/api/admin`

Health check:

```bash
curl http://localhost:8080/api/health
```

## Notes

- The AI features depend on a valid Gemini API key.
- The app uses Socket.IO for live simulation updates.
- Admin-only routes require an authenticated user with the appropriate role.

## License

This project is currently licensed under the ISC license.
