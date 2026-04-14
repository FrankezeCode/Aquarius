# Changelog

All notable changes to this repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where applicable.

## [Unreleased]

### Added

- Phase 8 — Global Fastify handlers: `setErrorHandler` and `setNotFoundHandler` for stable JSON: `{ error, message, requestId? }` without stack traces ([`apps/api/src/http/register-public-error-handler.ts`](../../apps/api/src/http/register-public-error-handler.ts)); optional `PublicHttpError` for explicit safe messages ([`apps/api/src/http/public-http-error.ts`](../../apps/api/src/http/public-http-error.ts)).
- Documentation: [`docs/api/public-surface.md`](api/public-surface.md) (advisory vs execution route matrix).
- Runbooks: [`docs/runbooks/phase8-rate-limit-and-abuse-drills.md`](runbooks/phase8-rate-limit-and-abuse-drills.md), [`docs/runbooks/phase8-key-rotation.md`](runbooks/phase8-key-rotation.md).
- Security review checklist: [`docs/security/mutation-routes-review-checklist.md`](security/mutation-routes-review-checklist.md).

### Changed

- **Security / API behavior:** Unhandled errors on the Aquarius API no longer rely solely on Fastify’s default error serialization for the response body. Clients that depended on Fastify’s default `{ statusCode, code, message }` **error object shape** for unhandled exceptions should migrate to the Phase 8 shape above. Routes that already send their own structured bodies are unchanged.

### Security

- Reduced risk of internal error detail leakage in JSON responses for unhandled failures.
