# Amautai WhatsApp gateway

Single-number Baileys gateway for the Amautai Worker. The public API requires a dedicated bearer token. QR administration runs on a separate port mapped only to VPS loopback.

## Runtime

Node.js 22, TypeScript, pinned Baileys, SQLite and Docker. Authentication credentials and Signal keys are encrypted with AES-256-GCM using AUTH_ENCRYPTION_KEY. Keep the key outside the repository and back it up with the database.

Environment:
- GATEWAY_TOKEN: at least 32 random characters; also configure WHATSAPP_GATEWAY_TOKEN as a Worker secret.
- AUTH_ENCRYPTION_KEY: 64 hexadecimal characters.
- DATA_DIR: defaults to /data.

The deployment reads /opt/amautai-whatsapp-secrets/gateway.env. Docker uses the persistent whatsapp-data volume.

## Deploy from WSL

Review the root README before each deployment. Package only the root manifests/lockfile, this directory and its source; exclude secrets, node_modules and generated artifacts. On the VPS:

~~~bash
cd /opt/amautai-whatsapp
sudo docker compose -f apps/whatsapp-gateway/compose.yaml up -d --build
~~~

The file-provider configuration in traefik.yaml routes only /amautai-whatsapp/ on the existing notify.urday.dev host. Other notification service paths retain their existing routes. The Worker base URL is https://notify.urday.dev/amautai-whatsapp.

## Link the sender

Run from WSL and keep the tunnel running:

~~~bash
ssh -N -L 127.0.0.1:8790:127.0.0.1:8791 vps
~~~

Open http://localhost:8790 and scan the QR through WhatsApp > Linked devices. Refresh the admin page manually after pairing. If the session is revoked, the page offers a new link. Never publish port 3001 or its QR. The bearer API exposes neither the QR nor session keys.

## API

- GET /connection
- POST /notifications: id, phone in E.164, text, expiresAt in epoch milliseconds.
- GET /notifications/:id

An offline gateway rejects new IDs with 503; the Worker retains and retries its outbox. Accepted requests use durable IDs. Duplicate IDs return the stored result, while changed recipients/content return 409. Jobs are serialized, checked for expiry, and sent every three seconds. Interruptions during submission become uncertain and are not automatically resent. Receipts can advance uncertain/sent messages to delivered/read.

Job IDs remain as deduplication tombstones. Text is cleared after expiry plus 24 hours; phone and metadata currently remain and require an operational retention policy as usage grows. Authentication data is encrypted; ordinary notification rows are not.

Health checks prove HTTP availability, not WhatsApp connectivity. Use the authenticated connection endpoint for readiness. No real delivery is verified until the sender is linked and a verified recipient receives a message.

## Verification

~~~bash
pnpm --filter @amautai/whatsapp-gateway run typecheck
pnpm --filter @amautai/whatsapp-gateway run test
~~~

Tests use a real SQLite database and an injected connection state; they do not send real WhatsApp messages.

Sender pairing also supports an eight-character code from the SSH-only admin page. Enter the sender number with country code, digits only, and type the generated code in WhatsApp > Linked devices > Link with phone number. Codes and numbers are never printed to gateway logs. Refresh the admin page manually after linking.

The admin form uses Referrer-Policy same-origin; no-referrer would make browser form POST origins opaque and cause a 403. Cross-origin requests remain forbidden.

Pairing uses the recognized Chrome client identity. Cached pairing codes are reused briefly for the same number and cleared on socket replacement/disconnection, avoiding stale codes. Required initial LID mapping synchronization remains enabled.
