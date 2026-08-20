<div align="center">

# 🚀 CollabSpace

### Modern AI-powered Team Collaboration Platform

Build projects • Manage tasks • Collaborate • AI-assisted productivity

</div>

---

# 📖 About

CollabSpace is a full-stack SaaS collaboration platform designed for modern teams to manage work, projects, tasks, and team collaboration from a single workspace.

The platform is inspired by products such as **Jira, Linear, Notion, ClickUp, and Slack**, while focusing on a clean architecture and a scalable foundation.

The project is being built with a production-oriented architecture using **React, TypeScript, Node.js, Express, PostgreSQL, and Prisma**, with AI-powered features planned for later stages.

---

# ✨ Features

## Frontend

- 📊 Analytics Dashboard
- 📁 Workspace Management
- 📂 Project Management
- ✅ Task Management
- 📋 Interactive Kanban Board
- 🔍 Search & Filtering
- 🖱️ Drag & Drop Tasks
- 📝 Task Details
- 🎨 Responsive UI
- ⚡ Type-safe Components
- 🔄 State Management

## Backend

- ⚡ Express + TypeScript
- 🛣️ REST API
- 📂 Nested Resource Routing
- 🎮 Controller Layer
- 🔧 Service Layer
- 📦 Repository Pattern
- 📝 Zod Request Validation
- 📋 Typed Middleware
- 📡 Request Logging
- 🌐 CORS Configuration
- 🚨 Centralized Error Handling

## Database

- 🐘 PostgreSQL
- 🔷 Prisma ORM
- 🔗 Relational Data Modeling
- 🔐 Foreign Keys
- 🧩 Many-to-Many Relationships
- 📊 Database Constraints

## Planned Platform Features

- 🔐 Authentication
- 👥 Team Members
- 🛡️ Role-Based Access Control
- 🤖 AI Assistant
- 📎 File Uploads
- 💬 Team Chat
- 🔔 Notifications
- ⚡ Real-time Collaboration
- 📈 Activity Feed

---

# 🏗️ Architecture

## Backend

The backend follows a layered architecture:

```text
Client
   │
   ▼
Routes
   │
   ▼
Controllers
   │
   ▼
Services
   │
   ▼
Repositories
   │
   ▼
PostgreSQL
```

### Routes

Responsible for mapping HTTP endpoints to controllers.

### Controllers

Responsible for handling HTTP requests and responses.

### Services

Contain application and business logic.

### Repositories

Responsible for data access and provide an abstraction between the application and database.

### Database

PostgreSQL provides persistent relational data storage.

---

# 🛠️ Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Redux Toolkit
- TanStack Query

## Backend

- Node.js
- Express
- TypeScript
- Zod

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- JWT
- Refresh Tokens
- RBAC

## AI

- Gemini
- OpenAI
- RAG
- pgvector

## DevOps

- Docker
- GitHub Actions
- CI/CD

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
└── README.md
```

---

# 🗺️ Roadmap

## ✅ Phase 1 — Frontend Foundation

- Dashboard
- Project Management
- Task Management
- Kanban Board
- Drag & Drop
- Generic Types
- API Integration Foundation

---

## ✅ Phase 2 — Backend Foundation

- Express + TypeScript
- REST API
- Nested Routing
- Controllers
- Services
- Repository Pattern
- Typed Middleware
- Request Logging
- CORS
- Zod Validation
- Centralized Error Handling
- Typed Request Lifecycle

---

## 🚧 Phase 3 — PostgreSQL + Prisma

- PostgreSQL Database
- Relational Schema
- Users
- Workspaces
- Workspace Members
- Foreign Keys
- Database Constraints
- Repository Migration
- Prisma ORM
- SQL Queries

---

## 🔜 Phase 4 — Authentication

- User Registration
- Login
- Password Hashing
- JWT Authentication
- Access Tokens
- Refresh Tokens
- Protected Routes

---

## 🔜 Phase 5 — Authorization

- Workspace Roles
- Role-Based Access Control
- Permissions
- Protected Resources
- Authorization Middleware

---

## 🔜 Future

- 🤖 AI Assistant
- 📎 File Uploads
- 💬 Team Chat
- 🔔 Notifications
- ⚡ Real-time Collaboration
- 📊 Activity Feed
- 🔎 Advanced Search
- 🧠 AI-powered Productivity Features
- 🐳 Docker
- ⚙️ CI/CD
- ☁️ Production Deployment

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL
- Git

---

## Clone the Repository

```bash
git clone https://github.com/piyusshhjangid/collabspace.git
cd collabspace
```

---

## Frontend

```bash
cd client
npm install
npm run dev
```

---

## Backend

```bash
cd server
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file inside the server directory.

```env
DATABASE_URL=your_postgresql_connection_string
PORT=5000
```

Never commit your `.env` file.

Use `.env.example` to document required environment variables.

---

# 🗄️ Database

CollabSpace uses PostgreSQL as its relational database.

The core relational model includes:

```text
users
   │
   │
   ▼
workspace_members
   ▲
   │
   │
workspaces
```

A user can belong to multiple workspaces, while each workspace can contain multiple users.

The `workspace_members` table represents this many-to-many relationship and stores membership-specific information such as the user's role.

---

# 🔌 API

The backend exposes RESTful endpoints for managing workspaces, projects, and tasks.

Example:

```text
GET    /api/workspaces
GET    /api/workspaces/:workspaceId/projects
POST   /api/workspaces/:workspaceId/projects
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
```

The API follows the layered architecture:

```text
Request
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
Database
```

---

# 📊 Current Status

| Module | Status |
|---|---|
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
| Prisma | ⏳ |
| Authentication | ⏳ |
| RBAC | ⏳ |
| AI Assistant | ⏳ |
| Real-time Collaboration | ⏳ |
| Docker | ⏳ |
| CI/CD | ⏳ |
| Deployment | ⏳ |

---

# 🔐 Engineering Principles

CollabSpace is built around a few core principles:

- **Separation of concerns**
- **Type safety**
- **Reusable architecture**
- **Runtime validation**
- **Centralized error handling**
- **Database integrity**
- **Maintainable code**
- **Scalable application structure**
- **Clear API boundaries**

The goal is to keep each layer responsible for one specific concern and make the system easier to extend as new features are introduced.

---

# 🤝 Contributing

Contributions, feedback, and ideas are welcome.

If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Open a Pull Request

For bugs or feature requests, open an Issue.

---

# ⭐ Support

If you find CollabSpace interesting, consider giving the repository a ⭐ on GitHub.

---

<div align="center">

Made with ❤️ using React, TypeScript, Node.js, Express and PostgreSQL

</div>
