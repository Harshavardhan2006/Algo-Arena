# AlgoArena — Free Deployment Guide

## Architecture Overview

- **Frontend**: React (Vite) — deployed to **Netlify** (free)
- **Backend**: Spring Boot JAR — deployed to **Railway** (free tier)
- **Database**: PostgreSQL — provided by Railway (free tier)
- **Workers**: Node.js Docker containers — run by the backend

---

## Step 1: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project → Deploy from GitHub repo** and select your repo.
3. Add a **PostgreSQL** plugin from the Railway dashboard.
4. Set these environment variables in Railway → your service → Variables:
   ```
   SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
   SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
   SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
   JWT_SECRET=<generate a 64-char random string>
   ```
5. Set the **Start command** to:
   ```
   java -jar backend/target/backend-0.1.0.jar
   ```
6. Deploy — Railway will give you a URL like `https://algoarena-backend.railway.app`.

---

## Step 2: Update Frontend API URL

Edit `frontend/src/api.js`. Find:
```js
const response = await fetch(`/api${path}`, { ...options, headers });
```

For production, this proxying works via Netlify redirects. Add a `netlify.toml` redirect to proxy `/api/*` to your Railway backend.

Or update `netlify.toml` to:
```toml
[[redirects]]
  from = "/api/*"
  to = "https://algoarena-backend.railway.app/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Step 3: Deploy Frontend to Netlify

### Option A: Netlify CLI (Recommended)
```bash
cd frontend
npm install
npm run build
npx netlify deploy --dir=dist --prod
```

### Option B: Netlify Dashboard
1. Go to [netlify.com](https://netlify.com) and sign up with GitHub.
2. Click **Add new site → Import an existing project**.
3. Select your GitHub repo.
4. Set:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Click **Deploy site**.

---

## Step 4: Configure WebSocket for Production

In `frontend/src/hooks/useRace.js`, the WebSocket URL is auto-derived from `window.location.host`. For production on Netlify:

The Netlify redirect must also proxy `/ws/*` to your Railway backend WebSocket:
```toml
[[redirects]]
  from = "/ws/*"
  to = "https://algoarena-backend.railway.app/ws/:splat"
  status = 101
  force = true
```

> **Note**: Netlify does not support native WebSocket proxying. For WebSockets in production, consider using Railway's domain directly for the WebSocket connection, or use [Render](https://render.com) for the backend which supports WebSockets better.

---

## Alternative: Full Deploy on Render (Free)

Render supports both frontend static sites and backend services with WebSocket support.

### Backend on Render
1. Create a **Web Service** from your repo
2. Set build command: `cd backend && mvn clean package -DskipTests`
3. Set start command: `java -jar backend/target/backend-0.1.0.jar`
4. Add a **PostgreSQL** database from Render dashboard
5. Set environment variables from Render's database connection info

### Frontend on Render (Static Site)
1. Create a **Static Site** from your repo
2. Set build command: `cd frontend && npm install && npm run build`
3. Set publish directory: `frontend/dist`
4. Add redirect rule: `/* → /index.html → 200`

---

## Local Development

```bash
# Backend (requires Java 17+, Docker)
cd backend
mvn clean package -DskipTests
java -jar target/backend-0.1.0.jar

# Frontend
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173
