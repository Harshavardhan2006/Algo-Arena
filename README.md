# AlgoArena 🏁

<div align="center">

**Enterprise-Grade Real-Time Algorithmic Benchmarking & Telemetry Platform**

*A Major Final-Year Capstone Project in Distributed Systems & Empirical Algorithmics*

[![Spring Boot](https://img.shields.io/badge/Spring_Boot_3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java 21](https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![React 18](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

[Architecture](#system-architecture) •
[Features](#key-features) •
[Algorithms](#supported-algorithms--paradigms) •
[API Reference](#api-specification) •
[Deployment Guide](#free-cloud-deployment) •
[Getting Started](#getting-started-local)

</div>

---

## 📌 Executive Summary

Theoretical asymptotic complexity ($\mathcal{O}$-notation) often obscures the empirical wall-clock efficiency, cache dynamics, and memory overhead of algorithms operating on real-world problem instances. 

**AlgoArena** is a distributed, full-stack benchmarking platform designed to empirically evaluate, visualize, and compare competing algorithmic paradigms in real time. Users upload custom problem instances (e.g., multiprocessor makespan scheduling, routing, resource allocation), launch concurrent isolated executions, and monitor sub-second convergence trajectories, event streams, and Pareto trade-off frontiers over full-duplex WebSockets.

---

## 🏛 System Architecture

The platform follows an asynchronous, event-driven micro-modular architecture built around strict process isolation and sub-second telemetry broadcast:

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 SPA)"]
        UI["Modern Dark Futuristic UI"]
        Recharts["Recharts Convergence & Pareto Engine"]
        STOMP["STOMP / SockJS WebSocket Client"]
    end

    subgraph Gateway["Security & Ingress Layer"]
        CORS["CORS & Preflight Filter"]
        JWT["Stateless JWT Authentication Filter"]
    end

    subgraph Backend["Core Backend (Spring Boot 3 / Java 21)"]
        RC["Race Orchestration Controller"]
        DC["Dataset Management Service"]
        Broker["Spring SimpleMessageBroker (/topic/race/{id})"]
        Validator["Input & Schema Verification Engine"]
        ExecService["ExecutionService (Async Thread Pool)"]
    end

    subgraph Storage["Persistence Layer (PostgreSQL)"]
        DB[("PostgreSQL Database
        - Datasets & Problem Types
        - Races & Run States
        - High-Resolution Run Events")]
    end

    subgraph Sandbox["Worker Sandbox Layer"]
        ContainerMgr["Container / Process Lifecycle Monitor"]
        subgraph Workers["Sandboxed Workers (Docker / Node.js)"]
            W1["Branch & Bound (Exact)"]
            W2["Genetic Algorithm (Metaheuristic)"]
            W3["Simulated Annealing (Metaheuristic)"]
            W4["Longest Processing Time (LPT)"]
            W5["Greedy Shortest Job First (Heuristic)"]
        end
    end

    Client <-->|REST API + JWT| Gateway
    Client <-->|Full-Duplex STOMP Telemetry| Broker
    Gateway --> Backend
    Backend <-->|JPA / Hibernate| Storage
    ExecService --> ContainerMgr
    ContainerMgr -->|Memory/CPU Constrained Execution| Workers
    Workers -->|JSON Event Stream via stdout| ExecService
    ExecService -->|Persist Event Subsets| Storage
    ExecService -->|Broadcast Updates| Broker
```

---

## ⚡ Key Features

* **Real-Time WebSocket Telemetry**: Stream real-time score updates, node iterations, and active compute timestamps directly to the browser via STOMP over WebSockets.
* **Dynamic Convergence Curves**: Interactive step-after convergence tracking showing optimality progress over wall-clock milliseconds.
* **Pareto Frontier Optimality Analysis**: Automatic computation of the speed-versus-quality Pareto frontier, highlighting which algorithm delivers the best solution per millisecond of compute.
* **Sandboxed Worker Isolation**: Execution occurs within isolated Docker containers with strict `--memory`, `--cpus`, `--pids-limit`, `--cap-drop ALL`, and `--read-only` rootfs sandboxing, with automatic fallback for non-containerized environments.
* **Interactive Race Controls**: Real-time **Pause**, **Resume**, and **Cancel** controls leveraging container freeze primitives (`docker pause`/`unpause`) and atomic timeout watchdogs.
* **Automated Data Validation & Ingestion**: Ingests custom `.json`, `.csv`, `.tsv`, and `.txt` files with intelligent column and format inference.
* **Global Historical Leaderboards**: Aggregate win rates, average gap-to-bound percentages, and historical convergence rates across standard benchmark datasets.
* **Complete Report Export**: Export detailed JSON race summaries containing full audit logs, iteration metrics, and schedule payload assignments.

---

## 🧬 Supported Algorithms & Paradigms

For the NP-hard **Multiprocessor Makespan Scheduling Problem** ($P \parallel C_{\max}$):

| Algorithm | Paradigm | Theoretical Guarantee | Best For |
|:---|:---|:---|:---|
| **Branch & Bound** | Exact Branch-and-Bound | Optimal ($0.00\%$ gap guaranteed) | Small-to-medium instances ($n \le 30$) requiring mathematical proof of optimality |
| **Genetic Algorithm** | Population Metaheuristic | Asymptotically optimal via crossover & mutation | Large, complex instances where high solution diversity is required |
| **Simulated Annealing** | Thermodynamic Metaheuristic | Escapes local minima via Boltzmann acceptance | Non-convex solution spaces with deep local optima |
| **Longest Processing Time (LPT)** | Approximation Algorithm | $\frac{4}{3} - \frac{1}{3m}$-approximation bound | Fast polynomial-time execution with deterministic error bounds |
| **Greedy Heuristic (SJF)** | Greedy / Constructive | Heuristic local assignment | Ultra-fast baseline initialization |

---

## 🛠 Tech Stack

### Frontend
* **Core**: React 18, React DOM, Vite 5
* **Visualizations**: Recharts (Convergence charts, Pareto scatterplots, Historical win-rate trajectories)
* **Real-Time Telemetry**: `@stomp/stompjs` WebSocket client
* **Styling**: Pure semantic CSS3 with CSS custom properties (Dark cyberpunk/space-grade design system)

### Backend
* **Framework**: Spring Boot 3.3.2, Java 21 (LTS)
* **Data Access**: Spring Data JPA, Hibernate, HikariCP
* **Security**: Spring Security, Stateless JWT (`io.jsonwebtoken:jjwt`)
* **Real-Time Messaging**: Spring WebSocket, Simple STOMP Broker
* **Validation**: Jakarta Bean Validation (`hibernate-validator`)
* **JSON Processing**: Jackson Databind

### Infrastructure & Workers
* **Database**: PostgreSQL 16
* **Worker Runtime**: Node.js 22 (Alpine-based sandboxed workers)
* **Containerization**: Docker (Multi-container isolation)

---

## 🔌 API Specification

### Authentication
* `POST /api/auth/register` — Register a new account (`username`, `email`, `password`)
* `POST /api/auth/login` — Authenticate and receive a signed JWT token
* `GET /api/me` — Retrieve the currently authenticated principal

### Datasets
* `GET /api/datasets` — List all benchmark datasets
* `GET /api/datasets/{id}` — Retrieve a specific dataset instance
* `POST /api/datasets` — Upload and validate a new problem dataset

### Races & Execution
* `GET /api/races` — List all historical races
* `POST /api/races?datasetId={id}&timeLimitSeconds={sec}` — Initialize a new race
* `GET /api/races/{id}/state` — Fetch complete race status and run standings
* `GET /api/races/{id}/events?after={eventId}` — Incremental polling fallback for events
* `POST /api/races/{id}/start` — Launch all algorithm runs in parallel
* `POST /api/races/{id}/pause` — Pause execution of all active runs
* `POST /api/races/{id}/resume` — Resume execution of paused runs
* `POST /api/races/{id}/stop` — Cancel the race and terminate active containers

### WebSockets
* `Endpoint`: `/ws` (supports raw WebSocket + SockJS fallback)
* `Subscription`: `/topic/race/{raceId}` (receives real-time `RunProgressEvent` payloads)

---

## 🚀 Getting Started (Local)

### Prerequisites
* **Java**: JDK 21+
* **Node.js**: v18+ and npm
* **PostgreSQL**: PostgreSQL 14+ running on port `5432`
* **Docker** *(Optional)*: Docker Desktop for containerized sandboxing

### 1. Database Setup
Create the PostgreSQL database and initialize the schema:
```sql
CREATE DATABASE algoarena;
CREATE USER algoarena WITH PASSWORD 'algoarena';
GRANT ALL PRIVILEGES ON DATABASE algoarena TO algoarena;
```
*(The schema and seed data auto-initialize on first Spring Boot startup).*

### 2. Backend Setup
```bash
cd backend
mvn clean package -DskipTests
java -jar target/backend-0.1.0.jar
```
*Backend runs on `http://localhost:8081`.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🌐 Free Cloud Deployment

AlgoArena is pre-configured with zero-config deployment scripts for **100% free cloud hosting**:

| Layer | Recommended Free Host | Config File |
|:---|:---|:---|
| **Frontend** | [Netlify](https://netlify.com) or [Vercel](https://vercel.com) | [`frontend/netlify.toml`](./frontend/netlify.toml), [`frontend/vercel.json`](./frontend/vercel.json) |
| **Backend** | [Render](https://render.com) or [Railway](https://railway.app) | [`backend/src/main/resources/application-prod.yml`](./backend/src/main/resources/application-prod.yml) |
| **Database** | [Neon.tech](https://neon.tech) (Serverless Postgres) | [`docs/schema.sql`](./docs/schema.sql) |

👉 **Read the complete step-by-step instructions in [DEPLOY.md](./DEPLOY.md).**

---

## 📂 Repository Structure

```
AlgoArena/
├── backend/                               # Spring Boot 3 + Java 21 REST & WebSocket API
│   ├── src/main/java/com/algoarena/
│   │   ├── config/                        # Security, CORS, WebSocket, and DataSeeder
│   │   ├── controller/                    # REST API Controllers (Auth, Dataset, Race)
│   │   ├── dto/                           # Data Transfer Objects
│   │   ├── execution/                     # Docker / Local Container Process Orchestration
│   │   ├── model/                         # JPA Entities (User, Dataset, Race, Run, RunEvent)
│   │   ├── repository/                    # Spring Data JPA Repositories
│   │   ├── security/                      # JWT Authentication & Authorization Filters
│   │   └── service/                       # Business Logic & Input Validation
│   └── src/main/resources/
│       ├── application.yml                # Development Configuration
│       └── application-prod.yml           # Production Cloud Configuration
├── frontend/                              # React 18 + Vite SPA
│   ├── public/                            # Static assets and favicon
│   ├── src/
│   │   ├── components/                    # UI Views (Race Dashboard, Wizard, Leaderboards)
│   │   ├── hooks/                         # useRace WebSocket STOMP subscription hook
│   │   ├── api.js                         # REST client with JWT interceptors
│   │   ├── styles.css                     # Dark futuristic design system
│   │   └── utils.js                       # Mathematical formatters & algorithm palettes
│   ├── netlify.toml                       # Netlify deployment configuration
│   └── vercel.json                        # Vercel deployment configuration
├── workers/                               # Algorithmic Benchmark Implementations
│   ├── Dockerfile                         # Minimal sandboxed Node.js Alpine container
│   └── scheduling/                        # Scheduling Algorithms (B&B, Genetic, SA, LPT, Greedy)
├── docs/                                  # Database DDL Schemas & Versioned Migrations
├── DEPLOY.md                              # Free Deployment Guide (Netlify, Render, Railway, Neon)
└── README.md                              # Project Documentation
```

---

## 🎓 Capstone Project Attribution

* **Project Title**: AlgoArena — Real-Time Algorithmic Benchmarking Platform
* **Candidate**: Harshavardhan ([@Harshavardhan2006](https://github.com/Harshavardhan2006))
* **Repository**: [https://github.com/Harshavardhan2006/Algo-Arena](https://github.com/Harshavardhan2006/Algo-Arena)
* **License**: [MIT License](./LICENSE)
