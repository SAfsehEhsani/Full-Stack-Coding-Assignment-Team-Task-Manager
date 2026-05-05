# Team Task Manager (Full-Stack)

Full-stack web app for managing projects, team members, and tasks with **role-based access** (Admin/Member).

## Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express (REST)
- **DB**: Postgres (via Prisma)
- **Auth**: JWT + bcrypt

## Local setup

### 1) Install

```bash
npm install
```

### 2) Configure environment

Create `server/.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
JWT_SECRET="replace-me"
CLIENT_ORIGIN="http://localhost:5173"
PORT=4000
```

### 3) Create DB tables

```bash
npm -w server run prisma:generate
npm -w server run prisma:push
```

### 4) Run dev servers

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api/health`

## Railway deployment (Mandatory)

### 1) Create Railway project

- Create a new project on Railway
- Add **PostgreSQL** plugin

### 2) Add service from this repo

- Deploy from GitHub repo
- Set service **Root Directory** to repo root

### 3) Set environment variables (Railway service)

- **DATABASE_URL**: from Railway Postgres plugin
- **JWT_SECRET**: long random string
- **CLIENT_ORIGIN**: your Railway domain, e.g. `https://<app>.up.railway.app`
- (Optional) **PORT**: Railway injects `PORT`, server honors it

### 4) Build & Start commands

- **Build**: `npm install && npm run build`
- **Start**: `npm start`

After deploy, open the Railway domain; the server will serve the SPA and REST APIs from the same origin.
