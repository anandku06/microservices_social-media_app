# Microservices Social Media Backend

Backend for a social media platform built with Node.js, Express, MongoDB, and Redis using a microservices architecture.

## Architecture

This repository is organized into independent services:

- `api-gateway`: Single entry point, auth guard, rate limiting, and request proxying
- `identity-service`: User registration, login, logout, and token refresh
- `post-service`: Create/list/get/delete posts with Redis-backed caching
- `media-service`: Media model/utilities present; server wiring is currently incomplete
- `search-service`: Service scaffold exists; server implementation is currently incomplete

Current request flow:

1. Client calls `api-gateway`
2. Gateway forwards `/v1/auth/*` to `identity-service`
3. Gateway validates JWT for `/v1/posts/*`, injects `x-user-id`, and forwards to `post-service`

## Tech Stack

- Node.js (CommonJS)
- Express 5
- MongoDB + Mongoose
- Redis + ioredis
- JWT authentication
- Argon2 password hashing
- Joi validation
- Winston logging

## Repository Structure

```text
Microservices_SocialMediaApp/
|- api-gateway/
|- identity-service/
|- post-service/
|- media-service/
|- search-service/
`- readme.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance
- Redis instance

## Setup

1. Install dependencies in each service:

```powershell
cd api-gateway; npm install
cd ..\identity-service; npm install
cd ..\post-service; npm install
cd ..\media-service; npm install
cd ..\search-service; npm install
```

2. Create `.env` files for each service (templates below).

3. Start services in separate terminals.

## Environment Variables

### `api-gateway/.env`

```env
PORT=3000
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=replace_with_strong_secret
IDENTITY_SERVICE_URL=http://localhost:3001
POST_SERVICE_URL=http://localhost:3002
```

### `identity-service/.env`

```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/social_media_identity
REDIS_CLIENT=redis://127.0.0.1:6379
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=replace_with_strong_secret
```

### `post-service/.env`

```env
PORT=3002
MONGODB_URI=mongodb://127.0.0.1:27017/social_media_posts
REDIS_CLIENT=redis://127.0.0.1:6379
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=replace_with_strong_secret
```

### `media-service/.env` (when service is completed)

```env
PORT=3003
MONGODB_URI=mongodb://127.0.0.1:27017/social_media_media
REDIS_CLIENT=redis://127.0.0.1:6379
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=replace_with_strong_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Run Services

Run each service in its own terminal:

```powershell
cd api-gateway; npm run dev
cd identity-service; npm run dev
cd post-service; npm run dev
```

`media-service` has scripts configured but no active `src/server.js` implementation yet.
`search-service` currently does not include `start` or `dev` scripts.

## API Endpoints (via Gateway)

Base URL: `http://localhost:3000`

### Auth

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `POST /v1/auth/token`

Payload rules:

- Register: `username` (3-50), `email` (valid), `password` (min 8)
- Login: `email`, `password` (min 8)

### Posts (Protected)

Requires header:

```http
Authorization: Bearer <access_token>
```

Endpoints:

- `POST /v1/posts/create-post`
- `GET /v1/posts/get-posts?page=1&limit=10`
- `GET /v1/posts/:id`
- `DELETE /v1/posts/:id`

Create payload:

```json
{
  "content": "Post text (3-5000 chars)",
  "mediaIds": ["optional_media_id"]
}
```

## Service Ports (recommended)

- Gateway: `3000`
- Identity: `3001`
- Post: `3002`
- Media: `3003`
- Search: `3004`

## Security and Reliability

- Helmet and CORS enabled
- Redis-backed rate limiting at gateway and service level
- JWT access tokens and refresh token lifecycle
- Password hashing with Argon2
- Centralized error handlers and structured logging

## Current Status

Implemented:

- API gateway proxying for auth and post flows
- Identity auth lifecycle with refresh token persistence
- Post CRUD routes with pagination and Redis caching

In progress:

- Media service HTTP server and routes
- Search service runtime server and scripts

## Development Notes

- Keep `JWT_SECRET` consistent across gateway and downstream services.
- Use separate MongoDB databases per service to preserve boundaries.
- Run Redis locally or provide a shared remote Redis URL.