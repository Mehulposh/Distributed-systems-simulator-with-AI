# Distributed Systems Simulator with AI

DistSim is a full-stack web application for designing, simulating, and analyzing distributed system architectures. It combines an interactive canvas-based editor with AI-assisted architecture generation, live simulation metrics, authentication, and admin controls.

## Features

- Visual architecture builder for distributed-system components
- Drag-and-drop node editing with connection flows
- Real-time simulation and metrics dashboard
- AI-powered architecture generation and suggestions
- Save, load, and browse simulation history
- User authentication and role-based admin features
- Docker-based development setup

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Flow
- Zustand
- Socket.IO client
- Recharts

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- Socket.IO
- JWT authentication
- Gemini AI integration

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
