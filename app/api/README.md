# @webeverlabs/api

Node API for Auxobus + published sites. **MySQL 8+**.

## Stack

- Hono + `@hono/node-server`
- **mysql2** connection pool
- argon2id passwords, hashed sessions & API keys
- Zod validation, CORS allowlist, origin secret, rate limits

## File security

| Check | Where |
|--------|--------|
| Filename sanitize (no path traversal) | `utils/files.js` → `sanitizeFilename` |
| Block dangerous extensions | same |
| MIME allowlist | `ALLOWED_MIME_PREFIXES` env |
| Size cap | `MAX_UPLOAD_BYTES` (default 25MB) |
| Magic-byte sniff helpers | `sniffMime` / `assertClientMimeMatchesSniff` |
| User-scoped keys only | `storage.keyFor(userId, fileId, safeName)` |
| Webhook SSRF host block | `assertSafeWebhookUrl` |
| Collection / id allowlists | `routes/data.js` |

Bytes should go to **R2 via presigned URL**, not through the Node process, when storage is configured.

## Setup

1. Create MySQL database, run `migrations/001_init.sql`
2. Copy `.env.example` → `.env`:
   ```
   DATABASE_URL=mysql://user:pass@127.0.0.1:3306/webever
   SESSION_SECRET=<32+ random chars>
   ```
3. `npm install` from repo root → `npm run dev:api`

## Routes

Same contract as before: `/v1/auth/*`, `/v1/{collection}`, `/v1/files/*`, `/v1/tools/:id/run`, `/v1/health`, `/v1/s/:id`.
