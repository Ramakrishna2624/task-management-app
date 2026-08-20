# TaskFlow - Full-Stack Task Management Application

> A production-quality Task Management system built for a technical assessment, demonstrating full-stack development with NestJS (REST API) and Next.js (App Router).

---

## Overview

TaskFlow is a full-featured task management application that enables users to:
- Register and authenticate with JWT-secured sessions
- Create, read, update, and delete tasks with rich metadata
- Attach files (images, PDFs, DOCX) via Cloudinary
- Filter and paginate tasks server-side
- View real-time weather for task locations via OpenWeatherMap
- Receive email notifications on task creation and completion

---

## Key Features

| Feature | Details |
|---|---|
| **Authentication** | JWT registration/login, bcrypt password hashing, token-based protected routes |
| **Task CRUD** | Create, read, update, delete with full ownership isolation |
| **Task Fields** | Title, Description, Status, Priority, Due Date, Location, Attachment URL |
| **Filtering** | Filter by Status, Priority, Date Range, and full-text Search |
| **Pagination** | Configurable page/limit with server-side metadata |
| **File Upload** | Cloudinary integration (images, PDF, DOCX) |
| **Weather** | OpenWeatherMap integration with 10-minute caching |
| **Email** | Resend integration for task created / task completed notifications |
| **Validation** | DTO-level class-validator guards on all inputs |
| **Error Handling** | Centralized HTTP exception filter with consistent response envelope |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  App Router │ AuthContext │ taskService │ Dashboard UI   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST (NEXT_PUBLIC_API_BASE_URL)
┌──────────────────────▼──────────────────────────────────┐
│                   NestJS Backend                         │
│  AuthModule │ TasksModule │ UsersModule                 │
│  FileUploadModule │ EmailModule │ WeatherModule          │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    MongoDB        Cloudinary    OpenWeatherMap
   (Mongoose)       (Files)        (Weather)
                                    Resend
                                    (Email)
```

---

## Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js + JWT + bcryptjs
- **Validation**: class-validator + class-transformer
- **File Upload**: Cloudinary SDK
- **Email**: Resend API (logs to console if unconfigured)
- **Weather**: OpenWeatherMap REST API (mock if unconfigured)
- **Language**: TypeScript

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with request/response interceptors
- **State**: React Context API (AuthContext)
- **Icons**: Lucide React

---

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── auth/                  # JWT auth, register, login
│   │   ├── tasks/                 # Task CRUD, filtering, pagination
│   │   ├── users/                 # User model and service
│   │   ├── common/
│   │   │   ├── decorators/        # @CurrentUser, @Public
│   │   │   ├── filters/           # HttpExceptionFilter
│   │   │   ├── guards/            # JwtAuthGuard
│   │   │   └── interceptors/      # TransformInterceptor (response envelope)
│   │   ├── integrations/
│   │   │   ├── email/             # EmailService (Resend)
│   │   │   ├── file-upload/       # FileUploadService (Cloudinary)
│   │   │   └── weather/           # WeatherService (OpenWeatherMap)
│   │   ├── database/              # MongooseModule configuration
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                      # E2E tests (auth, tasks)
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── login/                 # Login page
    │   ├── register/              # Register page
    │   └── dashboard/             # Protected main dashboard
    ├── components/                # TaskCard, TaskModal, DeleteConfirmModal, Navbar, etc.
    ├── context/                   # AuthContext (global auth state)
    ├── hooks/                     # useAuth, useTasks
    ├── services/                  # api.ts (Axios), authService, taskService, weatherService
    ├── types/                     # Shared TypeScript types
    └── .env.example
```

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI
- Optional: Cloudinary account, Resend account, OpenWeatherMap API key

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd mobile-task-management
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run start:dev
```

Backend runs at: `http://localhost:5000/api`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/task-management

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Cloudinary (optional - uses fallback URL if not set)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email via Resend (optional - logs to console if not set)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=TaskFlow <no-reply@yourdomain.com>

# OpenWeatherMap (optional - returns mock data if not set)
OPENWEATHER_API_KEY=your_openweathermap_api_key
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

---

## Third-Party Service Setup

### Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Set in `backend/.env`

> Without Cloudinary credentials, the upload endpoint returns a demo Cloudinary URL (fallback mode). This is clearly logged.

### Resend (Email)
1. Sign up at [resend.com](https://resend.com)
2. Create an API Key
3. Verify a sending domain or use the Resend sandbox
4. Set `RESEND_API_KEY` and `EMAIL_FROM` in `backend/.env`

> Without credentials, emails are logged to the console in development (safe fallback).

### OpenWeatherMap
1. Sign up at [openweathermap.org](https://openweathermap.org)
2. Get a free API key
3. Set `OPENWEATHER_API_KEY` in `backend/.env`

> Without credentials, the weather endpoint returns mock data (22°C, clear sky).

---

## API Endpoint Summary

All endpoints are prefixed with `/api`. All task endpoints require `Authorization: Bearer <token>`.

### Authentication

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| `POST` | `/auth/register` | No | Register new user |
| `POST` | `/auth/login` | No | Login and get JWT |
| `GET` | `/auth/profile` | Yes | Get current user profile |

#### POST /auth/register – Request
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

#### POST /auth/register – Response
```json
{
  "statusCode": 201,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com" }
  }
}
```

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks` | List tasks (paginated, filtered) |
| `GET` | `/tasks/:id` | Get single task |
| `PATCH` | `/tasks/:id` | Update task |
| `DELETE` | `/tasks/:id` | Delete task |
| `GET` | `/tasks/:id/weather` | Get weather for task location |

#### GET /tasks – Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 100) |
| `status` | string | `PENDING` \| `IN_PROGRESS` \| `DONE` |
| `priority` | string | `LOW` \| `MEDIUM` \| `HIGH` |
| `startDate` | ISO date | Due date range start |
| `endDate` | ISO date | Due date range end |
| `search` | string | Full-text search (title, description, location) |
| `sortBy` | string | `createdAt` \| `dueDate` \| `priority` \| `title` |
| `sortOrder` | string | `asc` \| `desc` |

#### File Upload

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| `POST` | `/file-upload/upload` | Yes | Upload file to Cloudinary |

Form data: `file` (multipart/form-data). Max 5MB. Allowed: JPEG, PNG, WEBP, GIF, PDF, TXT, DOCX.

---

## Authentication Flow

1. User calls `POST /auth/register` → receives JWT + user profile
2. Frontend stores JWT in `localStorage`
3. Axios interceptor injects `Authorization: Bearer <token>` on every subsequent request
4. Expired/invalid tokens return `401` → interceptor clears storage and redirects to `/login`
5. `JwtAuthGuard` is applied globally; routes marked `@Public()` bypass it

---

## Testing

### Backend Unit Tests (29 passing)

```bash
cd backend
npm test
```

Test suites: AuthService, TasksService, EmailService, WeatherService, FileUploadService

### Backend E2E Tests

> **Note**: E2E tests require a live MongoDB connection on `localhost:27017`.

```bash
cd backend
npm run test:e2e
```

### Frontend

```bash
cd frontend
npm run typecheck   # TypeScript check (0 errors)
npm run lint        # ESLint
npm run build       # Production build
```

---

## Build Commands

```bash
# Backend
cd backend && npm run build    # Outputs to dist/

# Frontend  
cd frontend && npm run build   # Outputs to .next/
```

---

## Deployment

### Frontend – Vercel

1. Push repository to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set root directory to `frontend/`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com/api
   ```
5. Deploy

### Backend – Render / Railway / Fly.io

1. Create a new Web Service pointing to the `backend/` directory
2. Set build command: `npm install && npm run build`
3. Set start command: `node dist/main`
4. Add all environment variables from `.env.example`
5. Ensure `PORT` is set (Render provides it automatically)
6. Set `FRONTEND_URL` to your deployed Vercel URL for CORS

### MongoDB – MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create database user and whitelist all IPs (`0.0.0.0/0`)
3. Copy connection string to `MONGODB_URI` env var

---

## Trade-offs & Design Decisions

| Decision | Rationale |
|---|---|
| **bcrypt rounds = 12** | Balanced security vs. registration speed |
| **In-memory weather cache** | 10-min TTL avoids API rate limits; resets on server restart |
| **Fire-and-forget email** | Email failures never block task creation/update responses |
| **Email log fallback** | Service works end-to-end without Resend credentials configured |
| **Cloudinary fallback URL** | Upload endpoint is testable without real credentials |
| **`select: false` on password** | Password field never returned by default queries |
| **Ownership enforced server-side** | `userId` always comes from JWT payload, never from request body |
| **`forbidNonWhitelisted: true`** | Strips and rejects unexpected request body fields |

---

## What Would Be Improved With More Time

- [ ] Refresh token rotation (longer sessions, more secure)
- [ ] Soft-delete tasks with recovery
- [ ] Task categories / tags
- [ ] Role-based access control (admin / viewer)
- [ ] Rate limiting on auth endpoints
- [ ] WebSockets for real-time task updates
- [ ] Redis for distributed weather/session caching
- [ ] Comprehensive E2E test suite with in-memory MongoDB
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker Compose for local development
- [ ] OpenAPI / Swagger documentation
- [ ] Unit test coverage > 80%

---

## Screenshots

> Run the app locally and visit `http://localhost:3000` to see the dashboard.

| Screen | Path |
|---|---|
| Login | `/login` |
| Register | `/register` |
| Dashboard | `/dashboard` |
