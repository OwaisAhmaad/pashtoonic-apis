# PASHTOONIC API

A production-ready NestJS backend for **PASHTOONIC** — a digital literary ecosystem for ~50-60M Pashto speakers globally.

## Tech Stack

- **Framework:** NestJS (modular monolith)
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (RS256, 15min access + 7-day refresh with rotation)
- **File Uploads:** Multer (disk storage, S3-ready)
- **Docs:** Swagger/OpenAPI at `/api/docs`
- **Logging:** nestjs-pino (JSON in production, pretty in dev)
- **Security:** Helmet, CORS, Throttler rate limiting

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# 3. Start MongoDB (local)
mongod

# 4. Run in development
npm run start:dev

# 5. View API docs
open http://localhost:3000/api/docs
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/pashtoonic` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | — |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `MAX_AVATAR_SIZE_MB` | Max avatar upload size | `5` |
| `MAX_AUDIO_SIZE_MB` | Max audio upload size | `50` |
| `UPLOAD_PATH` | Local upload directory | `./uploads` |
| `STATIC_URL` | Static file URL prefix | `/static` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `*` |

## API Modules

| Module | Base Path | Description |
|---|---|---|
| Auth | `/v1/auth` | Register, login, refresh, logout |
| Users | `/v1/users` | Profiles, follows, poetry |
| Poetry | `/v1/poetry` | CRUD, search, featured, trending |
| Poets | `/v1/poets` | Verified poet profiles |
| Social | `/v1/poetry/:id/...` | Likes, comments, reviews, follows |
| Admin | `/v1/admin` | Moderation queue, analytics |
| Uploads | `/v1/uploads` | Avatar, poetry images, audio |
| Gamification | `/v1/users/me/level` | XP, levels, badges |
| Search | `/v1/search` | Full-text + faceted search |
| Feed | `/v1/feed` | Personalized & explore feeds |

## Roles

- `USER` — Default role for all registered users
- `MODERATOR` — Can moderate poems and poets
- `ADMIN` — Full access including role assignment

## XP System

| Action | XP |
|---|---|
| Poem approved | +50 |
| Like received | +2 |
| Comment posted | +5 |
| Review submitted | +10 |
| Follower gained | +3 |

## Level Thresholds

| Level | Min XP |
|---|---|
| Newcomer | 0 |
| Emerging Voice | 100 |
| Rising Poet | 500 |
| Established Poet | 2,000 |
| Master Poet | 10,000 |

## File Uploads

Files are stored in `./uploads/{avatars,poetry-images,audio}/` with UUID filenames.
Served statically at `/static/{folder}/{filename}`.

## Development

```bash
npm run start:dev    # Watch mode
npm run build        # Production build
npm run start:prod   # Run production build
npm run test         # Unit tests
npm run test:e2e     # E2E tests
```

## API Documentation

Full interactive Swagger docs available at: **http://localhost:3000/api/docs**

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
