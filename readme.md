# Microservices Social Media Backend

A production-style backend for a social media platform built with Node.js, Express, MongoDB, Redis, RabbitMQ, and Cloudinary. The system is split into focused services behind an API gateway, with asynchronous events used to keep search and media workflows decoupled from core post operations.

## Overview

This repository currently includes five backend services:

- `api-gateway` handles routing, JWT validation, and gateway-level rate limiting.
- `identity-service` manages registration, login, logout, refresh tokens, and password hashing.
- `post-service` manages post creation, listing, lookup, deletion, Redis caching, and event publishing.
- `media-service` uploads media to Cloudinary, stores media metadata, and reacts to post deletion events.
- `search-service` indexes searchable post content and reacts to post lifecycle events through RabbitMQ.

## Architecture

```text
Client
  |
  v
API Gateway
  |-- /v1/auth   -> Identity Service
  |-- /v1/posts  -> Post Service
  |-- /v1/media  -> Media Service
  `-- /v1/search -> Search Service

Shared Infrastructure
  |- MongoDB
  |- Redis
  |- RabbitMQ
  `- Cloudinary
```

### Request Flow

1. The client sends requests to the API gateway.
2. The gateway proxies auth requests directly to `identity-service`.
3. Protected routes are validated at the gateway with JWT.
4. The gateway forwards the authenticated user as `x-user-id` to downstream services.
5. `post-service` publishes domain events that `search-service` and `media-service` consume.

### Event Flow

- `post.created`
  - Published by `post-service`
  - Consumed by `search-service` to create or update searchable content

- `post.deleted`
  - Published by `post-service`
  - Consumed by `search-service` to remove indexed content
  - Consumed by `media-service` to remove linked assets from MongoDB and Cloudinary

## Tech Stack

- Node.js
- Express 5
- MongoDB with Mongoose
- Redis with `ioredis`
- RabbitMQ with `amqplib`
- Cloudinary
- JWT authentication
- Argon2 password hashing
- Joi validation
- Winston logging
- Docker and Docker Compose

## Project Structure

```text
Microservices_SocialMediaApp/
|- api-gateway/
|- identity-service/
|- post-service/
|- media-service/
|- search-service/
|- docker-compose.yml
`- readme.md
```

## Core Features

- API gateway as the single backend entry point
- Authentication with access tokens and refresh tokens
- Password hashing with Argon2
- Post CRUD with Redis-backed caching
- Media upload to Cloudinary
- Search indexing powered by RabbitMQ events
- Rate limiting at gateway and service level
- Dockerized services for local orchestration

## Services

### API Gateway

Responsibilities:

- Proxies requests to internal services
- Validates JWT for protected routes
- Applies Redis-backed gateway rate limiting
- Forwards authenticated user context to downstream services

Proxied routes:

- `/v1/auth/*` -> `identity-service`
- `/v1/posts/*` -> `post-service`
- `/v1/media/*` -> `media-service`
- `/v1/search/*` -> `search-service`

### Identity Service

Responsibilities:

- Register users
- Login users
- Generate refresh/access token pairs
- Logout by removing refresh tokens

Persistence:

- Users collection
- Refresh token collection with TTL expiry

### Post Service

Responsibilities:

- Create posts
- Fetch paginated posts
- Fetch a single post
- Delete a post
- Cache reads in Redis
- Publish post lifecycle events to RabbitMQ

### Media Service

Responsibilities:

- Upload files using `multer`
- Store uploaded assets in Cloudinary
- Persist media metadata in MongoDB
- Fetch user-owned media
- Clean up orphaned media when posts are deleted

### Search Service

Responsibilities:

- Maintain searchable post records
- Consume `post.created` and `post.deleted` events
- Expose text search over indexed post content
- Cache search results in Redis

## API Reference

Base URL through the gateway:

```text
http://localhost:3000
```

### Auth Endpoints

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `POST /v1/auth/token`

Example register payload:

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

Validation rules:

- `username`: 3 to 50 characters
- `email`: valid email format
- `password`: minimum 8 characters

### Post Endpoints

Protected:

```http
Authorization: Bearer <access_token>
```

Routes:

- `POST /v1/posts/create-post`
- `GET /v1/posts/get-posts?page=1&limit=10`
- `GET /v1/posts/:id`
- `DELETE /v1/posts/:id`

Example create-post payload:

```json
{
  "content": "Building a microservices app today.",
  "mediaIds": ["optional_media_id_1", "optional_media_id_2"]
}
```

Validation rules:

- `content`: 3 to 5000 characters

### Media Endpoints

Protected:

```http
Authorization: Bearer <access_token>
```

Routes:

- `POST /v1/media/upload`
- `GET /v1/media/all-medias`

Upload notes:

- Form field name must be `file`
- Max file size is `5MB`
- User identity is derived from the gateway-provided `x-user-id`

### Search Endpoints

Protected:

```http
Authorization: Bearer <access_token>
```

Routes:

- `GET /v1/search/posts?query=keyword`

## Environment Variables

Each service expects its own `.env` file.

### `api-gateway/.env`

```env
PORT=3000
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=replace_with_strong_secret
IDENTITY_SERVICE_URL=http://localhost:3001
POST_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
SEARCH_SERVICE_URL=http://localhost:3004
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
REDIS_URL=redis://127.0.0.1:6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=replace_with_strong_secret
```

### `media-service/.env`

```env
PORT=3003
MONGODB_URI=mongodb://127.0.0.1:27017/social_media_media
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=replace_with_strong_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### `search-service/.env`

```env
PORT=3004
MONGODB_URI=mongodb://127.0.0.1:27017/social_media_search
REDIS_URL=redis://127.0.0.1:6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=replace_with_strong_secret
```

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB
- Redis
- RabbitMQ
- Cloudinary account for media uploads

### Install Dependencies

Run this once in each service:

```powershell
cd api-gateway; npm install
cd ..\identity-service; npm install
cd ..\post-service; npm install
cd ..\media-service; npm install
cd ..\search-service; npm install
```

### Run Services

Use separate terminals:

```powershell
cd api-gateway; npm run dev
cd ..\identity-service; npm run dev
cd ..\post-service; npm run dev
cd ..\media-service; npm run dev
cd ..\search-service; npm run dev
```

Recommended local ports:

- Gateway: `3000`
- Identity: `3001`
- Post: `3002`
- Media: `3003`
- Search: `3004`
- Redis: `6379`
- RabbitMQ: `5672`
- RabbitMQ dashboard: `15672`

## Docker Compose

This project includes `docker-compose.yml` for local orchestration of:

- `api-gateway`
- `identity-service`
- `post-service`
- `media-service`
- `search-service`
- `redis`
- `rabbitmq`

Start the stack:

```powershell
docker compose up --build
```

Notes:

- Redis is exposed on `6379`
- RabbitMQ is exposed on `5672`
- RabbitMQ management UI is exposed on `15672`
- The compose file injects container-friendly Redis and RabbitMQ URLs into services

## Data Models

Main persisted entities:

- `User`
  - `username`
  - `email`
  - `password`

- `RefreshToken`
  - `token`
  - `user`
  - `expiresAt`

- `Post`
  - `user`
  - `content`
  - `mediaIds`

- `Media`
  - `publicId`
  - `originalName`
  - `mimeType`
  - `url`
  - `userId`

- `SearchPost`
  - `postId`
  - `userId`
  - `content`
  - `createdAt`

## Security and Reliability

- JWT-based protected routing
- Refresh token persistence with database expiry
- Redis-backed rate limiting
- Redis-backed caching for posts and search
- Helmet and CORS enabled across services
- Structured logging with Winston
- Event-driven decoupling with RabbitMQ

## Current Status

Implemented:

- Gateway routing for auth, posts, media, and search
- Identity flows with refresh token rotation support
- Post CRUD with event publishing
- Media upload and cleanup workflow
- Search indexing and query endpoints
- Docker setup for local orchestration

Current gaps:

- No automated test suite is configured yet
- No root workspace script orchestrates installs or service startup
- Production-hardening items like retries, health checks inside services, and robust RabbitMQ reconnection are still minimal