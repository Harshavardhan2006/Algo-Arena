# AlgoArena 🏁

> **Real-Time Algorithmic Benchmarking Platform** — Upload a dataset, watch multiple algorithms race in real time.

[![Netlify Status](https://img.shields.io/badge/frontend-netlify-00C7B7?logo=netlify)](https://netlify.com)
[![Railway](https://img.shields.io/badge/backend-railway-0B0D0E?logo=railway)](https://railway.app)

---

## What is AlgoArena?

AlgoArena lets you:
- **Upload** custom scheduling / routing / resource-allocation / graph-coloring datasets
- **Race** multiple algorithms simultaneously (Genetic Algorithm, Branch & Bound, Greedy, LPT, Simulated Annealing)
- **Watch** real-time convergence charts, live event streams, and leaderboard standings
- **Analyze** post-race: Pareto frontier, solution quality, convergence profiles, exportable JSON reports

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Recharts |
| Backend | Spring Boot 3 + JPA + WebSocket (STOMP) |
| Database | PostgreSQL |
| Workers | Node.js (Docker containers) |
| Auth | JWT |

---

## Quick Start (Local)

```bash
# 1. Clone
git clone https://github.com/Harshavardhan2006/Algo-Arena
cd AlgoArena

# 2. Backend (requires Java 17+ and Docker)
cd backend
mvn clean package -DskipTests
java -jar target/backend-0.1.0.jar &

# 3. Frontend
cd ../frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for step-by-step instructions to deploy **free** on:
- **Netlify** (frontend)
- **Railway** (backend + PostgreSQL)
- or **Render** (full-stack)

---

## Project Structure

```
AlgoArena/
├── backend/           Spring Boot API + WebSocket + JWT
│   └── src/main/java/com/algoarena/
│       ├── controller/    REST endpoints
│       ├── service/       Race orchestration
│       ├── execution/     Docker-based algorithm execution
│       ├── model/         JPA entities
│       └── security/      JWT auth
├── frontend/          React (Vite) SPA
│   └── src/
│       ├── components/    UI components
│       ├── hooks/         useRace WebSocket hook
│       ├── api.js         REST client
│       └── styles.css     Global design system
├── workers/           Node.js algorithm implementations
│   └── scheduling/    Genetic, Branch&Bound, Greedy, LPT, SA
└── docs/              Schema, API reference
```

---

## License

MIT © Harshavardhan
