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

## 🗄️ Database

- PostgreSQL
- Prisma ORM
- Relational Data Modeling
- Foreign Keys
- Many-to-Many Relationships
- Database Constraints
- SQL Joins
- Aggregate Queries

## 🔮 Planned

- Authentication
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

CollabSpace follows a layered backend architecture.

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
Own database access and SQL operations.

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

SQL stays in repositories and business logic stays in services.

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
| Prisma | ORM |
| SQL | Database queries |

## Authentication

| Technology | Purpose |
|---|---|
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
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── data/
│   ├── types/
│   └── utils/
│
├── README.md
└── ...
```

---

# 🗄️ Database Architecture

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

---

# 🔌 API

### Workspace

```text
GET    /api/workspaces
GET    /api/workspaces/:workspaceId
```

### Projects

```text
GET    /api/workspaces/:workspaceId/projects
POST   /api/workspaces/:workspaceId/projects
```

### Tasks

```text
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
```

### Project Insights

```text
GET    /api/projects/:projectId/summary
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

## 🚧 Phase 3 — PostgreSQL + Prisma

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
- [ ] Advanced Queries
- [ ] Repository Migration
- [ ] Prisma ORM

## 🔜 Phase 4 — Authentication

- [ ] User Registration
- [ ] Login
- [ ] Password Hashing
- [ ] JWT Authentication
- [ ] Access Tokens
- [ ] Refresh Tokens
- [ ] Protected Routes

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
| PostgreSQL Setup | 🚧 |
| Database Schema | 🚧 |
| SQL Queries | 🚧 |
| Prisma | ⏳ |
| Authentication | ⏳ |
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

Create `server/.env.example` instead:

```env
DATABASE_URL=
PORT=5000
```

---

# 🐘 PostgreSQL

CollabSpace uses PostgreSQL for persistent relational data.

```text
collabspace
│
├── users
├── workspaces
├── workspace_members
├── projects
└── tasks
```

Database relationships are enforced using:

- Primary Keys
- Foreign Keys
- Unique Constraints
- NOT NULL Constraints
- Referential Integrity

---

# 🧠 Engineering Principles

- **Separation of concerns** — each layer has a focused responsibility.
- **Type safety** — TypeScript is used across the application.
- **Runtime validation** — Zod validates API input.
- **Database integrity** — PostgreSQL enforces important relationships.
- **Repository abstraction** — database access stays inside repositories.
- **Clear API boundaries** — routes, controllers, services, and repositories remain separated.
- **Scalability** — the architecture is designed to support new features without excessive coupling.

---

# 🔐 Security

Planned security features include:

- Password hashing
- JWT authentication
- Refresh token rotation
- Role-based authorization
- Protected routes
- Request validation
- Environment-based secrets
- Database constraints

---

# 🧪 Development

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
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
Commit
```

The goal is to keep changes isolated, understandable, and easy to review.

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

Made with ❤️ using React, TypeScript, Node.js, Express and PostgreSQL.

</div>
