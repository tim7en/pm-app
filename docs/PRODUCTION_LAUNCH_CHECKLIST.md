# ✅ PM-App Production Launch Checklist

Comprehensive, actionable list to ensure the application is production ready.

## 1. Source Control & Branching
- [ ] All work merged to `master` (or protected `main`) branch
- [ ] Pending PRs reviewed & approved
- [ ] Git tags planned (e.g., `v1.0.0`)
- [ ] CI pipeline green (build, lint, tests)

## 2. Environment & Secrets
- [ ] `.env.production` created from `.env.production.example`
- [ ] All secrets rotated & stored in secure manager (Vault / AWS Secrets / Docker Swarm / Kubernetes)
- [ ] Distinct values for: `NEXTAUTH_SECRET`, `JWT_SECRET`
- [ ] OAuth credentials (Google) configured & redirect URIs whitelisted
- [ ] OpenAI / External API keys validated (if features enabled)
- [ ] Email SMTP credentials tested (if email enabled)

## 3. Database
- [ ] Production database selected (PostgreSQL recommended; SQLite only acceptable for single-user test)
- [ ] Prisma migrations generated & applied (`prisma migrate deploy` for production)
- [ ] Connection string hardened (TLS where supported)
- [ ] Backup + retention policy documented
- [ ] Prisma client generated in build pipeline

## 4. Build & Runtime
- [ ] `npm ci --only=production` (or `--omit=dev`) reproducible
- [ ] `npm run build` succeeds with zero errors
- [ ] Type errors addressed (consider re-enabling `ignoreBuildErrors: false` in `next.config.ts` before GA)
- [ ] `server.ts` starts successfully under `NODE_ENV=production`
- [ ] Health endpoint `/api/health` returns status=healthy

## 5. Performance & Capacity
- [ ] Baseline load test (locust/k6/JMeter) documented
- [ ] Memory profile within container limits (< 70% steady state)
- [ ] WebSocket concurrency test executed
- [ ] Static asset size audited (Lighthouse / WebPageTest)

## 6. Security
- [ ] All dependencies scanned (e.g., `npm audit --production`)
- [ ] High/Critical vulnerabilities triaged
- [ ] Headers verified (CSP pending – add in future)
- [ ] Rate limiting (API / auth) strategy defined or deferred
- [ ] JWT expiry & refresh policy documented
- [ ] Admin & default test accounts removed or secured
- [ ] HTTPS enforced at proxy layer (Nginx / Cloud provider)

## 7. Logging & Monitoring
- [ ] Log directory writable (`./logs` for PM2 or stdout for containers)
- [ ] Structured logs (JSON) decision (current: plain text)
- [ ] Log rotation strategy (PM2 / external)
- [ ] Metrics exporter plan (future: /metrics or OpenTelemetry)
- [ ] Uptime monitoring configured (health checks every 30–60s)

## 8. Observability (Optional Phase 2)
- [ ] Error tracking (Sentry / Logtail) – deferred?
- [ ] Tracing (OpenTelemetry) – deferred?
- [ ] Frontend performance tracking (e.g., Vercel Analytics) – decision made

## 9. File Storage
- [ ] Local uploads path mounted (`public/uploads` volume)
- [ ] Migration plan to S3 / Object storage (future)
- [ ] Max file size aligned with Nginx `client_max_body_size`

## 10. WebSocket / Realtime
- [ ] Socket path `/api/socketio` proxied correctly through Nginx
- [ ] CORS rules validated in production context
- [ ] Idle disconnect policy defined (optional)

## 11. Deployment Artifacts
- [ ] Docker image built & tagged (`tim7en/pm-app:<version>`)
- [ ] SBOM (optional) generated
- [ ] Image scanned (Trivy / Grype) – results archived
- [ ] `docker-compose.yml` validated locally & in staging

## 12. Nginx / Edge Configuration
- [ ] Redirect HTTP→HTTPS working
- [ ] SSL certificate (Let’s Encrypt) valid & auto-renew configured
- [ ] WebSocket upgrade headers tested
- [ ] Security headers not duplicated (avoid double send via proxy + app)

## 13. QA Sign-off
- [ ] Functional tests executed (core workflows pass)
- [ ] Manual regression completed (login, CRUD, notifications)
- [ ] Accessibility smoke test (basic tab order & ARIA landmarks)
- [ ] Localization fallback verified (if i18n enabled)

## 14. Documentation
- [ ] `README.md` updated & consolidated (remove redundant `README_NEW.md`)
- [ ] Launch & rollback procedure documented
- [ ] Admin operational runbook started
- [ ] Known limitations section added

## 15. Rollback Plan
- [ ] Previous stable image tag retained
- [ ] DB schema backward compatibility evaluated
- [ ] Emergency disable flags (feature toggles) listed

## 16. Post-Launch Tasks
- [ ] Capture first-24h metrics baseline
- [ ] Review logs for unexpected errors
- [ ] Schedule security patch review (30-day cadence)
- [ ] Plan roadmap for: CSP, rate limiting, tracing, S3 migration

---

## Quick Command Reference

Install production dependencies:
```
npm ci --omit=dev
```

Build & start (bare metal):
```
npm run build
npm run start
```

PM2 (server):
```
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Docker (local test):
```
docker build -t pm-app:test .
docker run --rm -p 3000:3000 --env-file .env.production pm-app:test
```

Health check:
```
curl -f http://localhost:3000/api/health
```

---
Status: Living document – update each release.
