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

Authentication endpoints are being added as part of the current authentication phase.

Planned:

```text
POST   /auth/register
POST   /auth/login
```

---

# 🔐 Authentication Direction

The authentication layer is being built incrementally.

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

The authentication implementation will later expand to include:

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

## 🚧 Phase 4 — Authentication

- [ ] User Registration
- [ ] Password Hashing with bcrypt
- [ ] Login
- [ ] JWT Authentication
- [ ] Access Tokens
- [ ] Refresh Tokens
- [ ] Protected Routes
- [ ] Tenant Isolation

## 🔜 Phase 5 — Authorization

- [ ] Workspace Roles
- [ ] Role-Based Access Control
- [ ] Permissions
- [ ] Protected Resources
- [ ] Authorization Middleware

## 🔮 Future

- [ ] AI Assistant
- [ ] File Uploads
- [ ] Team Chat
- [ ] Notifications
- [ ] Real-time Collaboration
- [ ] Activity Feed
- [ ] Advanced Search
- [ ] AI-powered Productivity
- [ ] Docker
- [ ] CI/CD
- [ ] Production Deployment

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
| Authentication | 🚧 |
| Password Hashing | 🚧 |
| JWT | ⏳ |
| RBAC | ⏳ |
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
DATABASE_URL=postgresql://username:password@localhost:5432/collabspace
PORT=5000
```

Never commit `.env`.

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

Made with ❤️ using React, TypeScript, Node.js, Express, PostgreSQL and Prisma.

</div>
