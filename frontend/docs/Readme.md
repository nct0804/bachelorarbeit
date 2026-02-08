# GermanGains Frontend

A small guide to run the React/Vite frontend in **development** and **production** (Docker) modes.

---

## Prerequisites

* **Node.js** ≥ 18 & **npm**
* **Docker** & **Docker Compose** (v2)
* Backend + DB already configured in `docker-compose.yml`

---

## 1. Local Development

1. Open a terminal ➔ go to the frontend folder:

   ```bash
   cd frontend
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start Vite dev server:

   ```bash
   npm run dev
   ```
4. Open your browser at

   ```
   http://localhost:5173
   ```

   > **Proxy:** `/api/*` requests go to `http://localhost:3000` (backend must be running).

---

## 2. Production with Docker

*All in one command spins up DB, backend & frontend:*

1. From your project root (where `docker-compose.yml` lives), run:

   ```bash
   docker-compose up --build
   ```
2. Wait until all containers are “Up”. Then access:

   * **Frontend:** [http://localhost:4242](http://localhost:4242)
   * **Backend:**  [http://localhost:3000](http://localhost:3000)

*FE’s nginx+Docker setup automatically:*

* **SPA fallback** (`/login`, `/dashboard`, …)
* **Reverse-proxy** `/api/*` → backend service

---

## 3. Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_API_PROXY_TARGET=http://backend:3000
```

— used by Vite’s proxy in production.

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://germangains:…@db:5432/germangainsdb?schema=public
JWT_SECRET=...
JWT_REFRESH_SECRET=...
PORT=3000
NODE_ENV=development
```

---

## 4. Useful Commands

```bash
# Rebuild & restart everything
docker-compose up --build

# Only rebuild frontend
docker-compose up --build frontend

# Stop all containers
docker-compose down
```

---

