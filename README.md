# YouTube Streaming Clone

A mini YouTube: Next.js frontend + Express API + BullMQ worker that transcodes uploads to HLS with ffmpeg and serves them via Cloudinary.

```
app/      → Next.js 16 frontend (browse, upload, watch with video.js)
backend/  → Express API (Cloudinary sign-upload, BullMQ queue, MongoDB)
worker/   → BullMQ worker (download → ffmpeg thumbnail + HLS → Cloudinary → MongoDB)
```

## How it works

1. `app/app/upload/page.tsx` calls `GET /api/upload/sign-upload` for a Cloudinary signature
2. File uploads directly to Cloudinary (`folder: raw`) from the browser
3. Frontend calls `POST /api/upload/transcode` with `secure_url, title, description, public_id, extension`
4. Backend pushes a `hls` job to Redis via BullMQ (`backend/src/libs/bullmq.ts`)
5. Worker (`worker/src/hls/transcode.ts`) downloads the file, generates a thumbnail + HLS playlist with `fluent-ffmpeg`, uploads `transformed/<filename>/` to Cloudinary, creates a `Video` doc, deletes the raw file
6. Frontend lists videos via `GET /api/watch` and plays them via `GET /api/watch/:videoId` with video.js (`application/x-mpegURL`)

## Prerequisites

- Node.js 20+
- `ffmpeg` installed and on `PATH` (required by `worker/`)
- MongoDB database
- Upstash Redis (REST URL + token)
- Cloudinary account (cloud name + API key + secret)

## Quick start

```bash
# 1. Install deps (run in each folder)
npm install --prefix app
npm install --prefix backend
npm install --prefix worker

# 2. Fill in env files (see below)
# backend/.env, worker/.env, app/.env.local already exist with empty keys

# 3. Run each service in its own terminal
npm run dev --prefix backend  # Express API
npm run dev --prefix worker   # BullMQ HLS worker
npm run dev --prefix app      # Next.js on http://localhost:3000
```

> Frontend defaults to `http://localhost:3000`. Backend port is whatever you set as `PORT`.

## Environment variables

Copy the examples below into the existing `.env` files and fill in your values. Files are gitignored.

### `backend/.env`

Used by `backend/src/index.ts`, `backend/src/libs/bullmq.ts`, `backend/src/libs/cloudinary.ts`, `backend/src/routes/upload.ts`.

```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/youtube-streaming
PORT=8000
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

| Variable | Required | Where it's used |
|---|---|---|
| `MONGODB_URI` | Yes | `src/index.ts` – mongoose.connect |
| `PORT` | Yes | `src/index.ts` – app.listen |
| `UPSTASH_REDIS_REST_URL` | Yes | `src/libs/bullmq.ts` – Queue connection host |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | `src/libs/bullmq.ts` – Queue connection password |
| `CLOUDINARY_CLOUD_NAME` | Yes | `src/libs/cloudinary.ts`, `src/routes/upload.ts` – returned to frontend for direct upload |
| `CLOUDINARY_API_KEY` | Yes | `src/libs/cloudinary.ts`, `src/routes/upload.ts` |
| `CLOUDINARY_API_SECRET` | Yes | `src/libs/cloudinary.ts`, `src/routes/upload.ts` – `api_sign_request` |

### `worker/.env`

Used by `worker/src/index.ts`, `worker/src/libs/cloudinary.ts`.

```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/youtube-streaming
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

| Variable | Required | Where it's used |
|---|---|---|
| `MONGODB_URI` | Yes | `src/index.ts` – mongoose.connect on worker ready |
| `UPSTASH_REDIS_REST_URL` | Yes | `src/index.ts` – Worker connection host |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | `src/index.ts` – Worker connection password |
| `CLOUDINARY_CLOUD_NAME` | Yes | `src/libs/cloudinary.ts` – HLS/thumbnail uploads |
| `CLOUDINARY_API_KEY` | Yes | `src/libs/cloudinary.ts` |
| `CLOUDINARY_API_SECRET` | Yes | `src/libs/cloudinary.ts` |

> `backend/.env` and `worker/.env` share the same MongoDB, Redis, and Cloudinary values – keep them in sync.

### `app/.env.local`

Used by `app/app/page.tsx`, `app/app/watch/page.tsx`, `app/app/upload/page.tsx`. Must be prefixed with `NEXT_PUBLIC_` to be exposed to the browser.

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

| Variable | Required | Where it's used |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Base URL for `/api/watch`, `/api/upload/sign-upload`, `/api/upload/transcode` – no trailing slash |

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/upload/sign-upload` | Returns `{ signature, timestamp, cloud_name, api_key }` for direct Cloudinary upload to `raw/` |
| `POST` | `/api/upload/transcode` | Body: `{ secure_url, title, description, public_id, extension }` → enqueues `hls` job |
| `GET` | `/api/watch` | Lists all `Video` docs |
| `GET` | `/api/watch/:videoId` | Returns single `Video` (`{ hlsUrl, thumbnailUrl, name, ... }`) |

`Video` schema (`backend/src/models/video.ts`, `worker/src/models/video.ts`): `name*`, `hlsUrl`, `thumbnailUrl`, `status: PENDING | PROCESSING | READY | FAILED`, timestamps.

## Notes

- Worker writes temp files to `worker/downloaded/` and `worker/transformed/<filename>/`, then deletes them – both folders are gitignored.
- Backend `BullMQ` connection uses `port: 6379` + `tls: {}` hardcoded in `bullmq.ts` / `worker/src/index.ts`; only host/password come from env.
- If uploads fail, check Cloudinary `raw` folder, Upstash Redis queue (`hls`), and that `ffmpeg` is installed for the worker.
