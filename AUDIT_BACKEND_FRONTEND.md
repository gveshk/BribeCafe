# BribeCafe Backend + Frontend Audit

## Scope and approach
This audit covers the `backend/` and `frontend/` folders with emphasis on architecture, API/client contract quality, security posture, reliability, and delivery readiness.

Method used:
- Reviewed API composition, route handlers, services, auth flow, and DB schema.
- Reviewed frontend app state architecture, networking layer, WebSocket integration, and type models.
- Ran existing backend and frontend test commands to assess execution health.

---

## Executive summary
BribeCafe has a clear product direction (wallet-authenticated negotiation + contract + escrow lifecycle), and a practical initial decomposition into backend routes/services and frontend context/pages. However, the current implementation is best described as **prototype-quality with several production blockers**.

### Overall maturity snapshot
- **Architecture foundation:** Good (layering exists, Prisma + Fastify + React separation is present).
- **Contract consistency between frontend/backend:** Weak (multiple type and endpoint mismatches).
- **Security and auth hardening:** Weak-to-moderate (core auth exists but replay/session hardening gaps remain).
- **Runtime reliability:** Moderate (business flow exists, but incomplete integrations and optimistic assumptions).
- **Test/developer confidence:** Weak (test suites fail in both backend and frontend).

### Top priority blockers to fix first
1. **Stabilize the API contract** with shared typed DTOs and endpoint parity checks.
2. **Fix authentication handshake** (nonce challenge persistence, stricter JWT secret policy).
3. **Repair test suites and CI quality gates** so regressions are detectable.
4. **Complete/align escrow and quote endpoints** between server and client.
5. **Reduce frontend data-shape drift** (Agent/Quote/Contract/Escrow models diverge from backend).

---

## Backend audit

## 1) Architecture review
### What is working
- Backend is layered in a maintainable direction: Fastify entrypoint + route modules + service modules + Prisma data access.
- Domain partitioning is sensible: agents, tables, messages, quotes, contracts, disputes, escrow.
- Validation via Zod at route boundaries gives basic input hygiene.

### Risks and gaps
- Several routes embed orchestration logic that should be moved into domain service workflows (e.g., quote approval + table state updates + system messages in route handlers).
- Some service layers use `any` to bypass type safety, weakening compile-time guarantees.
- Escrow integration is half-integrated: service exists, but table escrow routes still return placeholders in critical paths.

## 2) Security and auth review
### Strengths
- JWT-based auth and wallet signature verification are implemented.
- Role checks for buyer/seller actions exist for many operations.

### Critical concerns
- **Replay risk in auth challenge:** auth message includes timestamp/nonce text but there is no server-side nonce persistence/expiration validation.
- **Weak secret fallback:** default JWT secret fallback can silently run in insecure mode if env not set.
- **Token verification decorator uses broad `any`:** difficult to reason about edge cases and safe typing.
- **Potentially over-trusting front-end headers:** custom headers (`X-Agent-ID`, `X-Wallet-Address`) are sent by client but server trust model should rely only on JWT claims.

## 3) Data model and domain integrity
### Positive
- Prisma schema models the core lifecycle entities and relations clearly.

### Issues
- Table status transitions are simplistic (e.g., set to `completed` when both contract signatures are present) and may not reflect real escrow lifecycle.
- Missing explicit state machine constraints can allow illegal transitions.
- Some endpoint payloads imply encrypted/FHE values, but current implementation appears to treat them as plain strings without cryptographic guarantees.

## 4) API contract quality
### High-impact mismatches
- Frontend calls routes that backend does not expose (e.g., single quote/contract fetch, escrow cancel).
- Backend query contract uses `capabilities`, while frontend sends `capability`.
- Backend pagination shape differs from frontend expectations (`offset` vs `page/hasMore` style usage in type definitions).

## 5) Reliability and observability
- Logging exists via Fastify logger, but there is no structured domain telemetry/trace IDs across route-service-db lifecycle.
- No centralized error mapping strategy; route handlers return mixed error formats.
- Escrow event logging is present conceptually but incomplete in request paths actually used by UI.

---

## Frontend audit

## 1) Architecture review
### What is working
- App has clear route/page split (`Dashboard`, `TableDetail`).
- Shared AppContext centralizes session + domain state.
- Design system components and tokenized theme support consistency.

### Risks and gaps
- AppContext has become a large “god object” with many responsibilities (auth, table state, messages, quote, contract, escrow, websocket wiring).
- API service is tightly coupled to current auth state shape and throws globally on missing auth fields.
- Real-time layer exists but backend WebSocket support/integration appears incomplete from app-level behavior.

## 2) Type and model consistency
This is the largest frontend risk area.

- Frontend and backend domain models have materially different field names/types:
  - `Agent.owner` (frontend) vs `ownerAddress` (backend).
  - `Quote.amount + approvedBy[]` (frontend) vs `encryptedAmount + approvedBy?` (backend).
  - `Contract.amount/deliverables object model` differs from backend contract structure.
  - Escrow object and status semantics differ between client and server.
- These differences create hidden runtime transformations and brittle assumptions in UI logic.

## 3) UX and workflow robustness
- Core flow exists (create table → quote → approve → contract → sign/dispute), but many actions assume happy path.
- Errors are often surfaced generically; no consistent per-action recoverability UX.
- Demo mode fallback is useful for development but can hide real integration failures if not clearly gated in deployment configs.

## 4) Test health
- Frontend tests currently fail due to import mismatches, stale API export expectation, and button loading-state assertion mismatch.
- This indicates tests are not aligned with actual component/service APIs and are not acting as a reliable safety net.

---

## Cross-cutting findings (architecture-level)

## Severity: High
1. **Backend/frontend contract drift** is substantial and impacts core deal lifecycle reliability.
2. **Auth challenge replay-hardening is incomplete**, exposing security risk in wallet login flow.
3. **Broken tests in both backend and frontend** reduce confidence in shipping changes.

## Severity: Medium
1. **State machine ambiguity** in table/contract/escrow lifecycle.
2. **Overloaded AppContext** limits scalability and maintainability.
3. **Placeholder escrow endpoints** can mislead users about on-chain finality.

## Severity: Low
1. Inconsistent error schemas and pagination conventions.
2. Mild developer-experience friction (mixed naming, route contract assumptions).
3. Lint/test conventions not consistently enforced across packages.

---

## Improvement roadmap (prioritized)

## Phase 1 (1-2 weeks): Stabilize and de-risk
1. **Create a shared contract package** (`/sdk` or `/shared-types`) containing zod schemas + TS types for API requests/responses.
2. **Implement contract tests** to verify frontend API client against backend routes.
3. **Harden auth flow**:
   - server-stored nonce with TTL
   - one-time nonce consumption
   - reject stale timestamp windows
   - fail startup if JWT secret missing in non-dev env
4. **Fix current test suites** until CI is green by default.

## Phase 2 (2-4 weeks): Architecture quality uplift
1. **Extract backend application services/use-cases** from route handlers (quote approval workflow, contract signing workflow, dispute workflow).
2. **Introduce explicit domain state machine** for table lifecycle (draft/negotiation/contracting/funded/in_delivery/review/disputed/released/cancelled).
3. **Refactor frontend state management**:
   - split AppContext into auth + table session + messaging modules
   - use query cache (TanStack Query) for server state and optimistic updates
4. **Normalize error handling** (typed error envelopes and UI error boundaries).

## Phase 3 (4+ weeks): Product resilience and seamless UX
1. **Real escrow integration completion** (deposit/release/cancel/dispute paths consistent end-to-end).
2. **Realtime reliability improvements** (server WS events for all lifecycle transitions + reconnect strategy with auth refresh).
3. **Operational readiness**:
   - audit logs for financial actions
   - metrics dashboards (auth failures, deal conversion funnel, dispute rate)
   - SLOs and alerting
4. **Security posture pass**:
   - wallet auth threat model
   - dependency scanning + secret policy enforcement
   - role/permission penetration tests on sensitive endpoints

---

## Specific recommendation checklist

### Backend
- [ ] Enforce strict env validation at startup (JWT secret, DB URL, chain config by environment).
- [ ] Replace `any` in services with strict Prisma inferred types.
- [ ] Consolidate route-level orchestration into use-case layer.
- [ ] Align escrow endpoints with implemented smart-contract operations.
- [ ] Add idempotency keys for write-heavy/financial endpoints.

### Frontend
- [ ] Generate API client from shared schema or OpenAPI to remove manual drift.
- [ ] Split AppContext and move remote data fetching to query layer.
- [ ] Add per-workflow loading/error states with retry UX.
- [ ] Remove stale tests and rewrite against current behavior.
- [ ] Ensure production mode never silently falls back to demo data.

### Shared
- [ ] Define and version API contract.
- [ ] Add end-to-end tests covering complete buyer/seller flow.
- [ ] Add release checklist requiring green tests + migration checks + contract compatibility checks.

---

## Test execution status during audit
- Backend test command fails due to TypeScript test environment/type setup mismatch.
- Frontend test command fails due to stale test expectations and import path mismatch.

(See terminal output from executed commands in this audit run.)

---

## Final verdict
BribeCafe has a promising foundation and coherent domain intent, but it currently needs **contract alignment + security hardening + test reliability** work before it can be considered seamless or production-ready. Addressing the Phase 1 items will deliver the biggest quality and confidence uplift with the fastest impact.

---

## Production recreation ticket plan (implementation-ready)

The following ticket plan translates the audit into an executable backlog for rebuilding BribeCafe to production readiness.

### Ticket BRIBE-001 — Canonical API contract package (blocker)
- Goal: remove frontend/backend contract drift using one shared source of truth.
- Deliverables:
  - Shared schemas + types package for all API DTOs.
  - Generated backend route typings and frontend client typings.
  - CI contract compatibility check.
- Acceptance criteria:
  - No duplicated domain DTO definitions in frontend/backend.
  - Contract drift fails CI.

### Ticket BRIBE-002 — Wallet auth replay protection + secret hardening (blocker)
- Goal: make authentication production-safe.
- Deliverables:
  - Nonce challenge persistence with TTL and one-time consumption.
  - Strict JWT secret validation (fail-fast in non-dev).
  - Auth flow update in frontend.
- Acceptance criteria:
  - Reused auth challenge is rejected.
  - Expired challenges are rejected.

### Ticket BRIBE-003 — Lifecycle state machine rewrite (blocker)
- Goal: formalize legal transitions for table/contract/escrow lifecycle.
- Deliverables:
  - Explicit state machine module and transition guards.
  - DB migration and transition audit logging.
- Acceptance criteria:
  - Illegal transitions return deterministic error codes.
  - All workflow handlers consume state machine rules.

### Ticket BRIBE-004 — Backend orchestration layer extraction
- Goal: move multi-step workflow logic out of route handlers.
- Deliverables:
  - Use-case services (`ApproveQuote`, `CreateContract`, `SignContract`, etc.).
  - Transaction boundaries for multi-write operations.
- Acceptance criteria:
  - Routes become thin request/response adapters.
  - Use-cases unit tested with role/state coverage.

### Ticket BRIBE-005 — Escrow end-to-end completion
- Goal: connect UI and API to real escrow behavior.
- Deliverables:
  - Implement missing escrow endpoints and align frontend calls.
  - Persist tx hash/status/finality metadata.
  - Add async confirmation update path.
- Acceptance criteria:
  - Escrow actions match on-chain status reliably.
  - UI no longer depends on placeholder escrow responses.

### Ticket BRIBE-006 — Frontend state architecture rebuild
- Goal: replace oversized context with production-ready state boundaries.
- Deliverables:
  - Split AppContext by domain.
  - Add query cache for server state.
  - Standardized mutation/error handling.
- Acceptance criteria:
  - No single context responsible for full app state.
  - Optimistic updates and retries implemented for critical actions.

### Ticket BRIBE-007 — Realtime pipeline hardening
- Goal: reliable websocket events for lifecycle updates.
- Deliverables:
  - Authenticated websocket/event gateway.
  - Reconnect + resync mechanism with sequencing.
- Acceptance criteria:
  - Reconnect does not lose domain events.
  - Event authorization enforced per table membership.

### Ticket BRIBE-008 — Error model + observability standardization
- Goal: consistent error semantics and actionable telemetry.
- Deliverables:
  - Unified error envelope with request ID.
  - Structured logs, metrics, and tracing instrumentation.
- Acceptance criteria:
  - All API errors conform to shared schema.
  - Key business metrics visible in dashboards.

### Ticket BRIBE-009 — Security and abuse protections
- Goal: strengthen production security baseline.
- Deliverables:
  - Rate limiting for auth and write endpoints.
  - Authorization policy audit for all role-sensitive operations.
  - Security headers/CORS environment policies.
- Acceptance criteria:
  - Security checklist passes in CI.
  - Pen-test-style authz tests pass.

### Ticket BRIBE-010 — Test stack rebuild + CI gates (blocker)
- Goal: restore confidence and regression prevention.
- Deliverables:
  - Fix failing backend/frontend test harnesses.
  - Add contract, integration, and E2E workflow tests.
  - Enforce required checks in CI.
- Acceptance criteria:
  - Green default branch.
  - Merge blocked on failing test/lint/typecheck.

### Ticket BRIBE-011 — Release engineering + migration safety
- Goal: safe production deployment and rollback behavior.
- Deliverables:
  - Deployment pipeline with migration prechecks.
  - Backward-compatibility checks for API versioning.
  - Rollback runbooks.
- Acceptance criteria:
  - Release checklist automated and required.
  - DB migration rollback tested.

### Ticket BRIBE-012 — Production readiness signoff
- Goal: formal go-live gate with objective criteria.
- Deliverables:
  - SLOs, incident runbooks, and disaster scenarios.
  - Dry-run launch validation across auth/deals/escrow/dispute.
- Acceptance criteria:
  - All blocker tickets closed.
  - Launch review approved by engineering + product + security.
