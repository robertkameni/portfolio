# Security Operations

## JWT Secret Rotation

Rotating JWT signing secrets invalidates all existing sessions. Plan for a brief maintenance window or accept that admins must sign in again.

### Access and refresh token lifecycle

## Cookie Names

| Cookie | Purpose | httpOnly | Defined in |
| --- | --- | --- | --- |
| `auth_token` | Short-lived access token (20 min) | yes | `src/server/utils/auth-cookies.ts` |
| `refreshToken` | Long-lived refresh token (7 days) | yes | `src/server/utils/auth-cookies.ts` |
| `auth_hint` | Non-sensitive hint for client bootstrap skip | no | `src/server/utils/auth-cookies.ts` |

### JWT Secrets

| Token | Env var | Default lifetime |
| --- | --- | --- |
| Access token | `ACCESS_TOKEN_SECRET` | **20 minutes** |
| Refresh token | `REFRESH_TOKEN_SECRET` | **7 days** |

Keep cookie `maxAge` and JWT `expiresIn` in sync when changing timeouts. Constants live in `src/server/auth/access-token-expiry.ts` and `src/server/auth/auth.service.ts`.

### Manual rotation (recommended)

1. **Generate new secrets** (32+ random bytes each):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **Update Vercel env vars** (Project → Settings → Environment Variables):
   - `ACCESS_TOKEN_SECRET`
   - `REFRESH_TOKEN_SECRET`
3. **Redeploy** the project (Deployments → Redeploy, or push to `main`).
4. **Verify** admin login and `/api/auth/refresh` after deploy.
5. **Communicate** that all active sessions are invalidated — users must log in again.

### Graceful dual-secret rotation (optional, not implemented)

A transition window accepting both old and new secrets requires code changes in `auth.service.ts` and `authGuard.ts` (verify with an array of secrets). This repo uses the simpler single-secret model; use manual rotation unless downtime is unacceptable.

### Related secrets

- `REALTIME_SESSION_TOKEN_SECRET` / `SESSION_SECRET` / `JWT_SECRET` — used for SSE realtime tokens (`src/server/realtime/realtime-signing.ts`). Rotate separately if realtime sessions must be invalidated.

---

## Content Security Policy

### Enforced (production)

The enforced CSP is set in `vercel.json`. After review, the permissive `https:` wildcards in `connect-src`, `img-src`, and `font-src` were replaced with explicit origin allowlists.

### Final allowlist

| Directive | Origins |
| --- | --- |
| `default-src` | `'self'` |
| `connect-src` | `'self'` `wss:` |
| `img-src` | `'self'` `https://images.unsplash.com` `data:` `blob:` |
| `font-src` | `'self'` |
| `style-src` | `'self'` `'unsafe-inline'` (required by Angular runtime) |
| `script-src` | `'self'` plus per-build inline script hashes |
| `trusted-types` | `angular` `angular#bundler` `angular#unsafe-bypass` |
| `object-src` | `'none'` |
| `frame-ancestors` | `'none'` |
| `form-action` | `'self'` |
| `base-uri` | `'self'` |

*No external API origins (DeepSeek, Cal.com, Resend) need client-side connect-src access — all calls are proxied through Analog Nitro server routes.*

### Report-Only

A parallel **Report-Only** header logs violations to `/api/csp-report` without blocking users. The directive list mirrors the enforced policy plus `report-uri /api/csp-report`.

### Workflow

1. Deploy with `Content-Security-Policy-Report-Only` active (see `vercel.json`).
2. Monitor server logs for `[CSP Report-Only]` entries (or wire to your log drain).
3. Fix violations (inline scripts, unexpected connect-src hosts, etc.).
4. Tighten the **enforced** `Content-Security-Policy` in `vercel.json`.
5. Keep Report-Only ahead of enforcement when testing the next policy revision.

Build-time inline script hashes are injected into `.vercel/output/config.json` by `scripts/ensure-vercel-build-output.mjs` for both enforced and report-only policies.
