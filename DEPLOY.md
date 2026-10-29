# AlgoArena — Free Deployment Guide

This guide walks you through deploying **AlgoArena** (Frontend + Backend + PostgreSQL Database) completely **free** using modern cloud providers.

---

## Architecture Overview

| Component | Stack | Free Hosting Provider |
|-----------|-------|-----------------------|
| **Frontend** | React 18 + Vite | [Netlify](https://netlify.com) or [Vercel](https://vercel.com) (100% Free) |
| **Backend** | Spring Boot 3 + Java 21 | [Render](https://render.com), [Railway](https://railway.app), or [Koyeb](https://koyeb.com) (Free Tier) |
| **Database** | PostgreSQL 16 | [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or [Render Postgres](https://render.com) (Free Tier) |
| **Workers** | Node.js algorithms | Bundled with Docker or direct Node execution |

---

## Step 1: Create a Free PostgreSQL Database (5 minutes)

You can choose any of these free managed PostgreSQL providers:

### Option A: Neon (Recommended — Serverless Free Tier)
1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Create a new project called `algoarena`.
3. Copy your connection string (`postgres://...`).
4. In the SQL Editor tab, run the schema script located at `docs/schema.sql` to initialize all tables.

### Option B: Render PostgreSQL (Free Tier)
1. Go to [render.com](https://render.com) and create a free account.
2. Click **New + → PostgreSQL**.
3. Name it `algoarena-db` and select the Free tier.
4. Copy the **Internal Database URL** or **External Database URL**.

---

## Step 2: Deploy the Backend (Spring Boot)

### Option A: Render Web Service (Free)
1. On [render.com](https://render.com), click **New + → Web Service**.
2. Connect your GitHub repository: `https://github.com/Harshavardhan2006/Algo-Arena` (or your fork).
3. Set the following configuration:
   - **Name**: `algoarena-backend`
   - **Runtime**: `Java` (or `Docker`)
   - **Root Directory**: `backend`
   - **Build Command**: `mvn clean package -DskipTests`
   - **Start Command**: `java -jar target/backend-0.1.0.jar`
4. Under **Environment Variables**, add:
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://<your-db-host>:5432/<your-db-name>?sslmode=require
   SPRING_DATASOURCE_USERNAME=<your-db-user>
   SPRING_DATASOURCE_PASSWORD=<your-db-password>
   JWT_SECRET=super-secret-algoarena-production-jwt-key-change-me-at-least-64-chars-long!
   PORT=8080
   ```
5. Click **Create Web Service**.
6. When deployment finishes, copy your backend URL: e.g. `https://algoarena-backend.onrender.com`.

### Option B: Railway (Free Trial / Hobby)
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project → Deploy from GitHub repo**.
3. Add **PostgreSQL** from the plugin menu.
4. In the backend service settings:
   - **Build Command**: `cd backend && mvn clean package -DskipTests`
   - **Start Command**: `java -jar backend/target/backend-0.1.0.jar`
   - Add environment variables:
     ```env
     SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
     SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
     SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
     JWT_SECRET=super-secret-algoarena-production-jwt-key-change-me-at-least-64-chars-long!
     ```
5. In **Settings → Networking**, click **Generate Domain** to get your public URL.

---

## Step 3: Deploy the Frontend (Netlify or Vercel)

The frontend is fully configured with zero-config deployment files (`netlify.toml` and `vercel.json`).

### Option A: Netlify (Recommended)
1. Go to [netlify.com](https://netlify.com) and log in.
2. Click **Add new site → Import an existing project** and select your GitHub repo.
3. Configure the build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Under **Environment variables**, add:
   ```env
   VITE_API_BASE_URL=https://algoarena-backend.onrender.com
   ```
   *(Replace with your actual backend URL from Step 2)*
5. Click **Deploy AlgoArena**. Netlify will build and give you a live URL like `https://algoarena.netlify.app`.

### Option B: Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New... → Project**.
2. Import your GitHub repository.
3. In Project Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
4. In **Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://algoarena-backend.onrender.com
   ```
5. Click **Deploy**.

---

## Step 4: Verification Checklist

Once deployed:
1. Open your frontend URL (e.g. `https://algoarena.netlify.app`).
2. Verify the favicon appears in the browser tab.
3. Click **Home** to see the interactive animated race simulation.
4. Click **Leaderboards** to explore global algorithm win rates and charts.
5. Click **Login** / **Register** to create an account and authenticate.
6. Click **Create Race** or **Datasets** to start a real algorithmic race!

---

## Local Development (Quick Reference)

```bash
# 1. Start Backend (requires Java 21, PostgreSQL on port 5432)
cd backend
mvn clean package -DskipTests
java -jar target/backend-0.1.0.jar

# 2. Start Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```
