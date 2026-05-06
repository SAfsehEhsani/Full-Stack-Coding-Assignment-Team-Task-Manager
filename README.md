# Team Task Manager (Full-Stack)

Full-stack web app for managing projects, team members, and tasks with **role-based access** (Admin/Member).

## Live (Railway)

- **Frontend**: `https://loyal-ambition-production-19e3.up.railway.app`
- **Backend health**: `https://full-stack-coding-assignment-team-task-manager-production.up.railway.app/api/health`

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

### 2) Add services from this repo (2 services)

- Add **two** GitHub services from the same repo:
  - **server service**: Root Directory = `server`
  - **client service**: Root Directory = `client`

### 3) Set environment variables (Railway service)

Server service:

- **DATABASE_URL**: from Railway Postgres plugin
- **JWT_SECRET**: long random string (16+ chars)
- **CLIENT_ORIGIN**: your client domain, e.g. `https://<client>.up.railway.app`

Client service:

- **VITE_API_BASE**: your server domain, e.g. `https://<server>.up.railway.app`

### 4) Build & Start commands

- Server:
  - **Build**: `npm install && npm run build`
  - **Start**: `npm start`
- Client:
  - **Build**: `npm install && npm run build`
  - **Start**: `npm run preview -- --host 0.0.0.0 --port $PORT`

### Role testing (Admin vs Member)

- Create **Account A** and create a project → Account A becomes **ADMIN**
- Create **Account B** (signup)
- In project → **Team** section → add Account B by email → Account B becomes **MEMBER**
- Logout/login to verify:
  - Admin can create/edit/delete/assign tasks and manage members
  - Member can view assigned tasks and update only their task status
