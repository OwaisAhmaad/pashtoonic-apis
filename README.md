# پښتونیک API — PASHTOONIC

> **زموږ خپل غږ** — *Our Own Voice*

Production-ready NestJS backend for **PASHTOONIC** — a digital literary ecosystem serving ~50–60 million Pashto speakers across Pakistan, Afghanistan, and the global diaspora.

Live API: **https://pashtoonic-apis.vercel.app**
Swagger docs: **https://pashtoonic-apis.vercel.app/api/docs**

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | NestJS 10 (modular monolith) |
| **Language** | TypeScript (strict) |
| **Database** | MongoDB via Mongoose |
| **Auth** | JWT RS256 — 15 min access + 7-day refresh with rotation |
| **File Uploads** | Multer disk storage (S3-ready) |
| **API Docs** | Swagger/OpenAPI at `/api/docs` |
| **Logging** | nestjs-pino — JSON in prod, pretty in dev |
| **Security** | Helmet, CORS, Throttler rate limiting |
| **Deployment** | Vercel Serverless (Express adapter + handler caching) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- MongoDB (local or Atlas)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/OwaisAhmaad/pashtoonic-apis
cd pashtoonic-apis
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT secrets at minimum

# 3. Start in development
npm run start:dev

# 4. Open Swagger docs
open http://localhost:3000/api/docs
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/pashtoonic` |
| `JWT_SECRET` | Access token signing secret (min 32 chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (min 32 chars) | — |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `MAX_AVATAR_SIZE_MB` | Max avatar upload size | `5` |
| `MAX_AUDIO_SIZE_MB` | Max audio upload size | `50` |
| `UPLOAD_PATH` | Local upload directory | `./uploads` |
| `STATIC_URL` | Static file URL prefix | `/static` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `*` |

---

## 📡 API Modules

| Module | Base Path | Description |
|---|---|---|
| **Auth** | `POST /v1/auth/register` | Register a new user |
| | `POST /v1/auth/login` | Login, returns token pair |
| | `POST /v1/auth/refresh` | Rotate refresh token |
| | `POST /v1/auth/logout` | Invalidate refresh token |
| **Users** | `GET /v1/users/me` | Get own profile |
| | `PATCH /v1/users/me` | Update own profile |
| | `GET /v1/users/:id` | Get public profile |
| | `POST /v1/users/:id/follow` | Follow a user |
| **Poetry** | `GET /v1/poetry` | Paginated feed (cursor-based) |
| | `POST /v1/poetry` | Submit a poem (JWT required) |
| | `GET /v1/poetry/:id` | Get single poem |
| | `POST /v1/poetry/:id/likes` | Toggle like |
| | `GET /v1/poetry/:id/comments` | Get comments |
| | `POST /v1/poetry/:id/comments` | Post a comment |
| | `GET /v1/poetry/:id/reviews` | Get review summary |
| | `POST /v1/poetry/:id/reviews` | Submit a review (1–5 stars) |
| | `GET /v1/poetry/trending` | Trending poems |
| | `GET /v1/poetry/featured` | Featured poems |
| **Search** | `GET /v1/search?q=` | Full-text search (title + content) |
| **Feed** | `GET /v1/feed` | Personalised feed |
| | `GET /v1/feed/explore` | Explore / discovery feed |
| **Admin** | `GET /v1/admin/analytics` | Platform analytics |
| | `PATCH /v1/poetry/:id/approve` | Approve pending poem |
| | `PATCH /v1/poetry/:id/reject` | Reject pending poem |
| **Uploads** | `POST /v1/uploads/avatar` | Upload avatar image |
| | `POST /v1/uploads/audio` | Upload audio file |
| **Gamification** | `GET /v1/users/me/level` | XP, level, next threshold |
| **Health** | `GET /v1/health` | Liveness check |

---

## 👥 Roles

| Role | Permissions |
|---|---|
| `USER` | Read, submit poems, like, comment, review |
| `MODERATOR` | + Approve/reject poems, manage poet profiles |
| `ADMIN` | + Full access, role assignment, analytics |

---

## 🏆 Gamification

**XP earned per action:**

| Action | XP |
|---|---|
| Poem approved | +50 |
| Like received | +2 |
| Comment posted | +5 |
| Review submitted | +10 |
| Follower gained | +3 |

**Level thresholds:**

| Level | Title | Min XP |
|---|---|---|
| 1 | Newcomer | 0 |
| 2 | Emerging Voice | 100 |
| 3 | Rising Poet | 500 |
| 4 | Established Poet | 2,000 |
| 5 | Master Poet | 10,000 |

---

## 📁 File Uploads

Files are stored in `./uploads/{avatars,poetry-images,audio}/` with UUID filenames.
Served statically at `/static/{folder}/{filename}`.

To switch to S3, replace `diskStorage` in `uploads.service.ts` with `multer-s3`.

---

## 🧪 Testing

```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests (requires running MongoDB)
npm run test:cov      # Coverage report
```

---

## 📦 Scripts

```bash
npm run start:dev     # Development (watch mode)
npm run build         # Production build → dist/
npm run start:prod    # Run compiled build
npm run lint          # ESLint
```

---

## ☁️ Deployment (Vercel)

The API is deployed as a **serverless function** on Vercel using the `ExpressAdapter` pattern with handler caching to avoid cold-start reconnections.

```bash
# Deploy via Vercel CLI
vercel --prod
```

Key Vercel config (`vercel.json`):
- All routes rewrite to `/api/index`
- Handler is cached on module scope (not per invocation)
- MongoDB connection reused across warm invocations

---

## 📄 License

MIT © PASHTOONIC
