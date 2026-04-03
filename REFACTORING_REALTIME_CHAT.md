# Refactoring: Realtime & Chat Security

## Übersicht

Zwei High-Impact-Refactorings sind implementiert:

### 1. Realtime: EventEmitter → Redis Pub/Sub

**Was geändert:**
- `src/server/api/realtime.get.ts`: Nutzt nun `broadcastService` statt lokalem `EventEmitter`
- Neu: `src/server/realtime/broadcast.service.ts` – Redis-backed Abstraction mit Upstash-Support
- Fallback auf LocalBroadcastService für Entwicklung ohne Redis

**Voraussetzungen:**
```bash
npm install redis@^4.6.12
```

**Umgebungsvariablen:**
```env
# Nutze Upstash Redis oder lokale Redis
UPSTASH_REDIS_URL=redis://...   # Upstash (Vercel-freundlich)
# oder
REDIS_URL=redis://localhost:6379  # Lokale Redis (Entwicklung)
```

**Benefit:**
- ✅ Multi-Instance-konsistent auf Vercel
- ✅ Horizontale Skalierbarkeit
- ✅ Fallback für local dev (kein Redis nötig)

---

### 2. Chat-API: GET Query → POST + Input-Limits + Security

**Was geändert:**

#### Server
- Neu: `src/server/routes/api/ai/chat/stream.post.ts` – POST-based endpoint
  - Validiert message (max 2000 chars) + history (max 20 items, 1500 chars/item)
  - Request-ID basiertes Logging
  - Redaction (emails, phones) vor Logs
  - Besseres error handling
  - Input validation

- Neu: `src/server/ai/chat-security.ts` – Sicherheitsfunktionen
  - `validateChatInput()` – Strenge Limits
  - `redactSensitiveData()` – Datenschutz in Logs
  - `logChatInteraction()` – Audit-Trail
  - `generateRequestId()` – Tracing

- Neu: `src/server/routes/api/ai/chat/stream.get.ts` – GET-Fallback
  - Gibt 400 zurück mit Hinweis auf POST-Migration

#### Client
- `src/app/services/realtime.service.ts`: `sendChatMessage()` nutzt nun `fetch` + POST + ReadableStream

**Vorher (GET Query):**
```
GET /api/ai/chat/stream?message=...&history=...&sessionId=...
```

**Nachher (POST Body):**
```json
POST /api/ai/chat/stream
Content-Type: application/json

{
  "message": "Tell me about your experience",
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "..." }]
    },
    {
      "role": "model", 
      "parts": [{ "text": "..." }]
    }
  ],
  "sessionId": "..."
}
```

**Benefit:**
- ✅ Größere History unterstützt (Body statt URL)
- ✅ Datenschutz: kein Plaintext in Logs/Cache
- ✅ Security: strenge Input-Limits gegen DoS
- ✅ Observability: Request-ID + redacted logging
- ✅ Cleaner API design

---

## Implementierungsdetails

### Request-ID Tracing

Alle Chat-Anfragen erhalten eine eindeutige ID:
```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

Logging (redacted):
```
[chat-stream] requestId=550e... sessionId=xyz... status=started message="Tell me about your experience"
[chat-stream] requestId=550e... sessionId=xyz... status=completed message="Tell me about your experience"
```

### Input Limits

- Message: max 2.000 Zeichen
- History: max 20 messages
- Jede History-Item: max 1.500 Zeichen

Überschreitung → 400 Error mit klarer Meldung.

### Redaction Pattern

Folgende Muster werden vor Logs entfernt:
- Emails: `user@domain.com` → `[EMAIL]`
- Phone: `+49 123 456` → `[PHONE]`
- SSN-like: `123-45-6789` → `[SSN]`
- Kreditkarte: `4111 1111 1111 1111` → `[CARD]`

---

## Deployment Notes

### Vercel + Upstash

1. Vercel Project konfigurieren:
   ```bash
   vercel env add UPSTASH_REDIS_URL
   ```

2. Upstash Redis (https://upstash.com/) erstellen
   - Kostenlos bis zu 10k req/Tag
   - Vercel-integriert

3. Deploy:
   ```bash
   npm run build && vercel deploy --prod
   ```

### Lokal (ohne Redis)

Einfach starten – localStorage Fallback nutzt LocalBroadcastService:
```bash
npm run dev
```

---

## Testing

### Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about your experience",
    "history": [],
    "sessionId": "test-session-123"
  }'
```

### Realtime Endpoint

```bash
# SSE abonnieren (neuer Endpoint, funktioniert mit Redis)
curl http://localhost:3000/api/realtime?sessionId=test-session-123
```

---

## Migration Checklist

- [x] Redis Service implementiert
- [x] Chat POST Endpoint implementiert
- [x] Client fetch-based aktualisiert
- [x] Input Validation + Limits
- [x] Request-ID + Logging
- [x] Redaction in Logs
- [x] GET Fallback (deprecated)
- [ ] Update `.env.example` (im Projekt)
- [ ] Dokumentation für Team

---

## Next Steps

1. `npm install` – Redis Dependency hinzufügen
2. Upstash Redis Setup (oder lokal `redis-server` starten)
3. `.env` mit `UPSTASH_REDIS_URL` aktualisieren
4. `npm run build` – Tests, keine Fehler?
5. Lokal testen: Chat + Realtime
6. Deploy zu Vercel

