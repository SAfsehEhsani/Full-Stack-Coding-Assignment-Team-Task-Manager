TEAM TASK MANAGER — FULL EXPLANATION (PROJECT GUIDE)
===================================================

LIVE LINKS (Railway)
--------------------
Frontend (UI):
  https://loyal-ambition-production-19e3.up.railway.app

Live Projects page (direct):
  https://loyal-ambition-production-19e3.up.railway.app/projects

Backend health (API check):
  https://full-stack-coding-assignment-team-task-manager-production.up.railway.app/api/health

GitHub repository:
  https://github.com/SAfsehEhsani/Full-Stack-Coding-Assignment-Team-Task-Manager


WHAT THIS APP IS
----------------
This is a simple Team Task Management web app (like a mini Trello/Asana).
Users can:
  - signup/login
  - create projects and work in teams
  - create/assign tasks inside projects
  - track progress via task statuses and dashboard metrics

Roles are PROJECT-BASED:
  - ADMIN: manages members + tasks
  - MEMBER: can view/update ONLY tasks assigned to them (status only)


TECH STACK
----------
Frontend: React + Vite
Backend: Node.js + Express (REST APIs)
Database: PostgreSQL (Prisma ORM)
Auth: JWT (Bearer token)


HOW THE APP WORKS (END-TO-END FLOW)
-----------------------------------

1) Signup / Login
   - User signs up with Name, Email, Password.
   - Password is hashed in DB (bcrypt).
   - Login returns JWT token.
   - Frontend stores token in localStorage and sends it as:
       Authorization: Bearer <token>

2) Projects
   - Any logged-in user can create a project.
   - The creator automatically becomes ADMIN for that project.
   - A user only sees projects where they are a member.

3) Team / Members (Admin only)
   - Admin can add members by email.
   - Admin can remove members.
   - Admin can change roles (MEMBER <-> ADMIN).

4) Tasks (inside a project)
   Task fields:
     - Title
     - Description
     - Due Date
     - Priority (LOW/MEDIUM/HIGH)
     - Status (TODO/IN_PROGRESS/DONE)
     - Assigned user (optional)

   Admin abilities:
     - Create tasks
     - Assign tasks to project members
     - Edit task fields (title/description/due/priority/assignee)
     - Delete tasks

   Member abilities:
     - Can view only tasks assigned to them (within their projects)
     - Can update ONLY status of their assigned tasks
       (they cannot edit title/description/priority/assignee)

5) Dashboard (for logged-in users)
   Shows summary across all projects the user belongs to:
     - Total tasks
     - Tasks by status
     - Tasks per user (team summary)
     - Overdue tasks (due date passed and not DONE)
     - “My assigned tasks”


ROLE TESTING (ADMIN VS MEMBER) — EASY DEMO STEPS
------------------------------------------------
To demonstrate Admin vs Member clearly:

1) Create Account A (Signup)
2) Login as Account A
3) Create a project (Account A becomes ADMIN)
4) Create Account B (Signup)
5) Go back to project as Account A
6) In Team section: Add Account B by email (Account B becomes MEMBER)
7) Logout and login as Account B
8) Open the same project:
   - Account B should only see tasks assigned to B
   - Account B can only change status (TODO/IN_PROGRESS/DONE)


LOCAL SETUP (RUN ON YOUR PC)
----------------------------

STEP 1: Install dependencies (repo root)
  npm install

STEP 2: Create server env file
Create: server/.env
Example:
  DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
  JWT_SECRET="replace-with-long-random-string"
  CLIENT_ORIGIN="http://localhost:5173"
  PORT=4000

STEP 3: Create DB tables
  npm -w server run prisma:generate
  npm -w server run prisma:push

STEP 4: Run both client + server
  npm run dev

Open:
  Frontend: http://localhost:5173
  Backend:   http://localhost:4000/api/health


RAILWAY DEPLOYMENT (2 SERVICES) — STEP BY STEP
----------------------------------------------
This deployment runs as TWO services:
  - client (frontend)
  - server (backend)
Plus one PostgreSQL database.

1) Create Railway project
   - New Project -> Deploy from GitHub repo

2) Add database
   - Add -> Database -> PostgreSQL

3) Add services from GitHub repo (twice)
   A) Server service
      Root Directory: server
      Build Command:  npm install && npm run build
      Start Command:  npm start

   B) Client service
      Root Directory: client
      Build Command:  npm install && npm run build
      Start Command:  npm run preview -- --host 0.0.0.0 --port $PORT

4) Set environment variables
   Server service variables:
     - DATABASE_URL  (use Railway Postgres DATABASE_URL)
     - JWT_SECRET    (any long random string, 16+ chars)
     - CLIENT_ORIGIN (client public URL, example: https://<client>.up.railway.app)

   Client service variables:
     - VITE_API_BASE (server public URL, example: https://<server>.up.railway.app)

5) Deploy
   - Deploy server and client
   - Test server:
       https://<server>.up.railway.app/api/health  -> should return {"ok": true}
   - Open client URL and test signup/login


HOW THIS MATCHES THE ASSIGNMENT REQUIREMENTS (CHECKLIST)
--------------------------------------------------------

1) User Authentication
   - Signup (Name, Email, Password): YES
   - Secure login (JWT): YES

2) Project Management
   - Create projects (creator becomes Admin): YES
   - Admin can add/remove members: YES
   - Members can view assigned projects: YES

3) Task Management
   - Create tasks (Title, Description, Due Date, Priority): YES
   - Assign tasks to users: YES
   - Update status (To Do, In Progress, Done): YES
   - Admin manage tasks (edit + delete): YES
   - Member view/update assigned tasks only: YES (status-only updates)

4) Dashboard
   - Total tasks: YES
   - Tasks by status: YES
   - Tasks per user: YES
   - Overdue tasks: YES

5) Role-Based Access
   - Admin: Manage tasks and users: YES
   - Member: View and update assigned tasks only: YES

Backend & Database Requirements
   - RESTful APIs: YES
   - Database: YES (Postgres)
   - Proper relationships (Users, Projects, Tasks): YES
   - Validations and error handling: YES (zod + HTTP errors)


NOTES / IMPORTANT DETAILS
-------------------------
- Roles are per-project (one user can be ADMIN in one project, MEMBER in another).
- Frontend and backend are deployed separately, so:
    client uses VITE_API_BASE to call server
    server uses CLIENT_ORIGIN for CORS allowlist

