<div align="center">

# 🚀 CollabSpace

### Modern AI-powered Team Collaboration Platform

**Build projects • Manage tasks • Collaborate • Organize work • AI-assisted productivity**

<p>
  <a href="https://github.com/piyusshhjangid/collabspace">
    <img src="https://img.shields.io/github/stars/piyusshhjangid/collabspace?style=for-the-badge&logo=github&label=Stars" />
  </a>
  <a href="https://github.com/piyusshhjangid/collabspace">
    <img src="https://img.shields.io/github/forks/piyusshhjangid/collabspace?style=for-the-badge&logo=github&label=Forks" />
  </a>
  <img src="https://img.shields.io/badge/Status-Active%20Development-58A6FF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" />
</p>

<p>
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-database-architecture">Database</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

</div>

---

# 🚀 About

**CollabSpace** is a full-stack SaaS collaboration platform designed to help modern teams organize projects, manage tasks, collaborate across workspaces, and eventually leverage AI for productivity.

The platform is inspired by products such as **Jira, Linear, Notion, ClickUp, and Slack**, while focusing on clean architecture and a scalable foundation.

Built with:

**React + TypeScript + Node.js + Express + PostgreSQL + Prisma**

---

# ✨ Features

## 🖥️ Frontend

- 📊 Analytics Dashboard
- 🏢 Workspace Management
- 📂 Project Management
- ✅ Task Management
- 📋 Interactive Kanban Board
- 🔍 Search & Filtering
- 🖱️ Drag & Drop Tasks
- 📝 Task Details
- 🎨 Responsive UI
- ⚡ Type-safe Components
- 🔄 Centralized State Management

## ⚙️ Backend

- Express + TypeScript
- REST API
- Nested Resource Routing
- Controller Layer
- Service Layer
- Repository Pattern
- Zod Request Validation
- Typed Middleware
- Request Logging
- CORS Configuration
- Centralized Error Handling
- Typed Request Lifecycle

## 🗄️ Database

- PostgreSQL
- Prisma ORM
- Relational Data Modeling
- Primary & Foreign Keys
- Many-to-Many Relationships
- Database Constraints
- SQL Joins
- Aggregate Queries
- Database Indexes
- Prisma-based Repository Data Access

## 🔐 Authentication

**Currently in development**

- User Registration
- bcrypt Password Hashing
- Login
- JWT Authentication
- Access Tokens
- Refresh Tokens
- Protected Routes

## 🔮 Planned

- Team Members
- Role-Based Access Control
- AI Assistant
- File Uploads
- Team Chat
- Notifications
- Real-time Collaboration
- Activity Feed
- Advanced Search
- AI-powered Productivity

---

# 🏗️ Architecture

CollabSpace follows a layered backend architecture designed to keep HTTP handling, business logic, and database access separated.

```text
                         ┌─────────────────┐
                         │     Client      │
                         │ React + TS      │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     Routes      │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   Controllers   │
                         │ HTTP handling   │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    Services     │
                         │ Business logic  │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Repositories   │
                         │  Data access    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     Prisma     │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   PostgreSQL    │
                         │ Persistent data │
                         └─────────────────┘
```

### 🛣️ Routes

Map HTTP endpoints to controllers.

### 🎮 Controllers

Handle HTTP requests, parameters, responses, and request-level concerns.

### 🧠 Services

Contain application and business logic.

### 📦 Repositories

Own database access and Prisma queries.

### 🐘 PostgreSQL

Provides persistent relational storage and database-level integrity.

---

# 🔄 Request Lifecycle

```text
HTTP Request
     ↓
 Middleware
     ↓
   Route
     ↓
 Controller
     ↓
  Service
     ↓
Repository
     ↓
  Prisma
     ↓
PostgreSQL
     ↓
Repository
     ↓
  Service
     ↓
 Controller
     ↓
HTTP Response
```

**Business logic stays in services and database access stays in repositories.**

---

# 🛠️ Tech Stack

## Frontend

| Technology | Purpose |
|---|---|
| React | UI |
| TypeScript | Type safety |
| Vite | Development & build |
| Tailwind CSS | Styling |
| React Router | Routing |
| Redux Toolkit | State management |
| TanStack Query | Server state |

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express | HTTP framework |
| TypeScript | Type safety |
| Zod | Runtime validation |

## Database

| Technology | Purpose |
|---|---|
| PostgreSQL | Relational database |
| Prisma | ORM / database access |
| SQL | Relational query language |

## Authentication

| Technology | Purpose |
|---|---|
| bcrypt | Password hashing |
| JWT | Authentication |
| Refresh Tokens | Session management |
| RBAC | Authorization |

## AI

| Technology | Purpose |
|---|---|
| Gemini | AI capabilities |
| OpenAI | AI capabilities |
| RAG | Retrieval-augmented generation |
| pgvector | Vector search |

## DevOps

| Technology | Purpose |
|---|---|
| Docker | Containerization |
| GitHub Actions | CI/CD |
| Cloud deployment | Production infrastructure |

---

# 📂 Project Structure

```text
collabspace/
│
├── client/
│   └── src/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── hooks/
│       ├── store/
│       ├── routes/
│       ├── types/
│       ├── data/
│       └── utils/
│
├── server/
│   ├── controllers/
│   ├── db/
│   │   └── prisma.ts
│   ├── generated/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── types/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── prisma.config.ts
│   └── ...
│
├── README.md
└── ...
```

> Generated Prisma client files are generated from the Prisma schema and should generally be treated as generated artifacts rather than manually edited source code.

---

# 🗄️ Database Architecture

CollabSpace uses PostgreSQL as its persistent relational database.

```text
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ workspace_members   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     workspaces      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      projects       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       tasks         │
└─────────────────────┘
```

A user can belong to multiple workspaces, while a workspace can contain multiple users.

`workspace_members` represents this many-to-many relationship and stores membership-specific information such as roles.

Projects belong to workspaces, while tasks belong to projects and workspaces.

Tasks can also reference users as assignees.

## Core tables

```text
collabspace
│
├── users
├── workspaces
├── workspace_members
├── projects
└── tasks
```

## Database integrity

Relationships are protected using:

- Primary Keys
- Foreign Keys
- Unique Constraints
- NOT NULL Constraints
- Referential Integrity
- Indexes

---

# 🔌 API

## Workspace

```text
GET    /api/workspaces
GET    /api/workspaces/:workspaceId
```

## Projects

```text
GET    /api/workspaces/:workspaceId/projects
POST   /api/workspaces/:workspaceId/projects
```

## Tasks

```text
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
```

## Project Insights

```text
GET    /api/projects/:projectId/summary
```

## Authentication

Authentication supports registration, login, refresh-token rotation, logout, and protected routes.

```text
POST   /auth/register
POST   /auth/login
```

---

# 🔐 Authentication and Authorization

Passwords are hashed with bcrypt. Access tokens are short-lived JWTs and refresh tokens are rotated and revoked server-side. Workspace membership is resolved on the server for each protected request; tenant IDs supplied by clients are never treated as authorization.

The registration flow is designed around:

```text
Registration Request
        ↓
Zod Validation
        ↓
Auth Controller
        ↓
Auth Service
        ↓
bcrypt Password Hashing
        ↓
User Repository
        ↓
Prisma
        ↓
PostgreSQL
```

Passwords must never be stored in plaintext.

Protected workspace actions use the role permission matrix and resource ownership checks:

```text
Registration
    ↓
Login
    ↓
JWT Access Token
    ↓
Refresh Tokens
    ↓
Protected Routes
```

---

# 🗺️ Roadmap

## ✅ Phase 1 — Frontend Foundation

- [x] Dashboard
- [x] Project Management
- [x] Task Management
- [x] Kanban Board
- [x] Drag & Drop
- [x] Generic Types
- [x] API Integration Foundation

## ✅ Phase 2 — Backend Foundation

- [x] Express + TypeScript
- [x] REST API
- [x] Nested Routing
- [x] Controllers
- [x] Services
- [x] Repository Pattern
- [x] Typed Middleware
- [x] Request Logging
- [x] CORS
- [x] Zod Validation
- [x] Centralized Error Handling
- [x] Typed Request Lifecycle

## ✅ Phase 3 — PostgreSQL + SQL + Prisma

- [x] PostgreSQL Setup
- [x] Database Creation
- [x] User Schema
- [x] Workspace Schema
- [x] Workspace Members
- [x] Foreign Keys
- [x] Database Constraints
- [x] Projects Table
- [x] Tasks Table
- [x] SQL Joins
- [x] Aggregate Queries
- [x] Database Indexes
- [x] Prisma ORM Introduction
- [x] Prisma Schema Introspection
- [x] Prisma Repository Migration
- [x] Prisma Relations / `include`
- [x] Shared Prisma Client
- [x] Data Layer Review

## ✅ Phase 4 — Authentication + Multi-Tenancy

- [x] Registration, bcrypt password hashing, and login
- [x] JWT access tokens and rotating refresh tokens
- [x] Protected routes and workspace membership checks
- [x] Tenant isolation across workspace resources

## ✅ Phase 5 — RBAC + Authorization

- [x] Owner, admin, member, and viewer roles
- [x] Role-based permission matrix and middleware
- [x] Resource ownership checks and audit logging

## ✅ Phase 6 — Frontend Architecture + Execution Model (Days 46–52)

- [x] Redux Toolkit for small client-only UI state
- [x] Workspace-aware TanStack Query server-state caching
- [x] Optimistic task updates with rollback on failure
- [x] Outcome, goal, and milestone CRUD
- [x] Tenant-safe task dependencies with cycle prevention
- [x] Append-only, versioned delivery contracts and execution plans

## ✅ Phase 7 — Execution Graph + Real-Time (Days 53–60)

- [x] Pure graph traversal, topological sort, cycle reporting, and critical path/slack
- [x] Interactive execution graph with dependency editing and critical-path highlighting
- [x] Authenticated Socket.IO connections and membership-checked workspace rooms
- [x] Monotonic workspace event sequence and reconnect/refetch recovery
- [x] Live graph updates for task and dependency changes

## 🔜 Next — Days 61–100

- [ ] Redis and measured performance improvements
- [ ] Background jobs and GitHub webhook evidence
- [ ] Delivery truth, forecast, and drift engine
- [ ] Grounded AI analysis and safe tool calling
- [ ] Docker, CI/CD, and Internship Release 1.0

---

# 📊 Current Status

| Module | Status |
|---|:---:|
| Frontend UI | ✅ |
| Dashboard | ✅ |
| Project Management | ✅ |
| Task Management | ✅ |
| Kanban Board | ✅ |
| Drag & Drop | ✅ |
| Express Setup | ✅ |
| REST API | ✅ |
| Controllers | ✅ |
| Services | ✅ |
| Repository Pattern | ✅ |
| Middleware | ✅ |
| Request Logging | ✅ |
| Zod Validation | ✅ |
| Centralized Error Handling | ✅ |
| PostgreSQL | ✅ |
| Database Schema | ✅ |
| SQL Queries | ✅ |
| Database Indexes | ✅ |
| Prisma ORM | ✅ |
| Repository Migration | ✅ |
| Authentication | ✅ |
| Password Hashing | ✅ |
| JWT + Refresh Tokens | ✅ |
| RBAC + Tenant Isolation | ✅ |
| Outcomes + Baselines | ✅ |
| Dependency DAG + Critical Path | ✅ |
| Live Execution Graph | ✅ |
| AI Assistant | ⏳ |
| Real-time Collaboration | ⏳ |
| Docker | ⏳ |
| CI/CD | ⏳ |
| Deployment | ⏳ |

---

# 🚀 Getting Started

## Prerequisites

- Node.js
- npm
- PostgreSQL
- Git

## Clone

```bash
git clone https://github.com/piyusshhjangid/collabspace.git
cd collabspace
```

## Frontend

```bash
cd client
npm install
npm run dev
```

## Backend

Open another terminal:

```bash
cd server
npm install
npm run dev
```

## Environment Variables

Create:

```text
server/.env
```

Example:

```env
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/collabspace
PORT=5000
```

Never commit `.env`.

If the server reports Prisma `P1000`, PostgreSQL rejected the username or password in `DATABASE_URL`. Replace `YOUR_POSTGRES_PASSWORD` in `server/.env` with the password configured for your local PostgreSQL `postgres` account. If the password contains URL-reserved characters, percent-encode them. Then, from `server`, run `npx prisma migrate deploy` and `npm run dev`.

Create `server/.env.example` for documenting required variables:

```env
DATABASE_URL=
PORT=5000
```

---

# 🐘 PostgreSQL + Prisma

The database layer uses PostgreSQL for persistent relational storage and Prisma for application-level database access.

The repository layer owns Prisma queries:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

This keeps database implementation details isolated from the HTTP and business-logic layers.

The project also deliberately retains SQL knowledge because understanding joins, constraints, indexes, aggregates, and relational modeling remains important even when using an ORM.

---

# 🧠 Engineering Principles

- **Separation of concerns** — each layer has a focused responsibility.
- **Type safety** — TypeScript is used across the application.
- **Runtime validation** — Zod validates API input.
- **Database integrity** — PostgreSQL enforces important relationships.
- **Repository abstraction** — database access stays inside repositories.
- **ORM without losing SQL knowledge** — Prisma improves application-level data access while PostgreSQL concepts remain fundamental.
- **Clear API boundaries** — routes, controllers, services, and repositories remain separated.
- **Security by design** — authentication credentials must never be stored or exposed insecurely.
- **Scalability** — the architecture is designed to support new features without excessive coupling.

---

# 🔐 Security

Current and planned security features include:

- Password hashing with bcrypt
- JWT authentication
- Refresh token rotation
- Role-based authorization
- Protected routes
- Request validation
- Environment-based secrets
- Database constraints
- Workspace / tenant isolation

### Password security rule

Passwords must never be stored in plaintext.

The intended registration flow is:

```text
Plaintext password
       ↓
    bcrypt
       ↓
Password hash
       ↓
PostgreSQL
```

The plaintext password and password hash should not be returned in normal registration responses.

---

# 🧪 Development

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

### TypeScript check

```bash
cd server
npx tsc --noEmit
```

---

# 🧩 Development Workflow

```text
Feature
   ↓
Design
   ↓
Database / API
   ↓
Repository
   ↓
Service
   ↓
Controller
   ↓
Testing
   ↓
Review
   ↓
Commit
```

The goal is to keep changes isolated, understandable, testable, and easy to review.

---

# 🤝 Contributing

Contributions, feedback, and ideas are welcome.

```text
Fork
  ↓
Create Branch
  ↓
Implement
  ↓
Test
  ↓
Commit
  ↓
Pull Request
```

For bugs and feature requests, open an Issue.

---

# ⭐ Support

If you find **CollabSpace** interesting, consider giving the repository a ⭐ on GitHub.

---

# 📌 Repository

<div align="center">

<a href="https://github.com/piyusshhjangid/collabspace">
  <img src="https://img.shields.io/badge/GitHub-CollabSpace-181717?style=for-the-badge&logo=github" />
</a>

<br><br>

<a href="https://github.com/piyusshhjangid/collabspace/issues">
  <img src="https://img.shields.io/badge/Issues-Report%20a%20problem-orange?style=flat-square&logo=github" />
</a>

<a href="https://github.com/piyusshhjangid/collabspace/pulls">
  <img src="https://img.shields.io/badge/Pull%20Requests-Contribute-blue?style=flat-square&logo=github" />
</a>

</div>

---

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=18&duration=3500&pause=1200&color=8B949E&center=true&vCenter=true&width=650&lines=Build.+Collaborate.+Ship.;Designed+for+modern+teams.;Powered+by+React%2C+TypeScript+%26+PostgreSQL." alt="Animated footer" />

<br>

Made with ❤️ by me using React, TypeScript, Node.js, Express, PostgreSQL and Prisma.

</div>
