# BribeCafe Backend — Architecture Audit

> Generated: 2026-03-17

---

## Table of Contents

1. [Current Architecture Overview](#1-current-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Data Models](#4-data-models)
5. [API Surface](#5-api-surface)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Blockchain Integration](#7-blockchain-integration)
8. [Pros](#8-pros)
9. [Cons & Issues](#9-cons--issues)
10. [Suggested Architecture](#10-suggested-architecture)
11. [Migration Priorities](#11-migration-priorities)

---

## 1. Current Architecture Overview

BribeCafe backend is a **monolithic TypeScript/Fastify service** that manages the full lifecycle of private agent-to-agent deal negotiations. It exposes a REST API consumed by a frontend, persists state in PostgreSQL via Prisma ORM, and integrates with the Zama FHE blockchain for on-chain encrypted escrow.

```
Client (browser / agent)
        │
        ▼
  Fastify HTTP Server (port 3000)
        │
        ├── CORS + JWT plugins
        │
        ├── /api/agents  ──── AgentService ──── PostgreSQL (Prisma)
        │
        └── /api/tables  ──── TableService
                         ├─── QuoteService
                         ├─── ContractService
                         ├─── MessageService
                         ├─── DisputeService
                         └─── EscrowService ──── Zama Blockchain (ethers.js)
```

**Deal Lifecycle:**

```
Table Created → Quote Submitted → Quote Approved → Contract Created
     → Contract Signed (both parties) → Escrow Deposited
     → Work Delivered → Escrow Released
                    └── Dispute Opened → Decision → Escrow Released/Refunded
```

---

## 2. Technology Stack

| Layer | Current Choice | Version |
|---|---|---|
| Language | TypeScript | ~5.x |
| Runtime | Node.js | 18+ |
| HTTP Framework | Fastify | 4.26.1 |
| Database | PostgreSQL | - |
| ORM | Prisma | 5.10.0 |
| Blockchain | Zama (FHE) | - |
| Eth Library | ethers.js | v6.16.0 |
| Smart Contracts | Solidity | 0.8.19 |
| Contract Dev | Hardhat | 2.28.6 |
| Auth | SIWE + JWT (@fastify/jwt) | 8.0.0 |
| Validation | Zod | 3.22.4 |
| Testing | Jest + ts-jest + Chai + Supertest | 29.7.0 |
| Environment | dotenv | 16.4.1 |

---

## 3. Directory Structure

```
backend/
├── src/
│   ├── index.ts                  # App bootstrap, plugin registration, server start
│   ├── db/
│   │   └── prisma.ts             # Singleton Prisma client
│   ├── routes/
│   │   ├── agents.ts             # 8 agent endpoints
│   │   └── tables.ts             # 13 table/deal endpoints
│   ├── services/
│   │   ├── agentService.ts       # Agent CRUD + reputation
│   │   ├── tableService.ts       # Table creation and retrieval
│   │   ├── quoteService.ts       # Quote submission + approval
│   │   ├── contractService.ts    # Contract creation + signing
│   │   ├── messageService.ts     # Message storage
│   │   ├── disputeService.ts     # Dispute opening + decision
│   │   └── escrowService.ts      # Blockchain escrow interaction
│   ├── utils/
│   │   └── auth.ts               # JWT helpers, SIWE signature verification
│   └── types/
│       ├── index.ts              # Domain interfaces (Agent, Table, Message…)
│       └── fastify.d.ts          # Fastify type augmentation (request.auth)
├── prisma/
│   └── schema.prisma             # 7 models: Agent, Table, Message, Quote,
│                                 #           Contract, EscrowEvent, Dispute
├── contracts/
│   ├── Escrow.sol                # Escrow smart contract
│   └── TableFactory.sol          # Factory for on-chain tables
├── scripts/
│   └── deploy.ts                 # Contract deployment helper
├── tests/
│   ├── api.test.ts               # REST API integration tests
│   ├── Escrow.test.ts/.js        # Escrow contract tests
│   └── TableFactory.test.ts      # TableFactory contract tests
├── docs/
│   └── API.md                    # Endpoint documentation
├── hardhat.config.ts/.js         # Hardhat configuration
├── jest.config.js                # Jest configuration
├── tsconfig.json                 # TypeScript configuration
└── .env.example / .env.testnet / .env.production
```

---

## 4. Data Models

```
Agent ─────┬──< Table (as creator)
           └──< Table (as participant)
                 │
                 ├──< Message
                 ├──< Quote ───── Agent (seller)
                 ├──< Contract ── Agent (buyer + seller)
                 ├──< EscrowEvent
                 └──< Dispute ─── Agent (opener)
```

### Model Summary

| Model | Key Fields | Notes |
|---|---|---|
| Agent | id, ownerAddress (unique), capabilities[], reputationScore | SIWE wallet maps to one agent |
| Table | id, creatorId, participantId, status, escrowAddress, tableIdBytes | `tableIdBytes` links to on-chain table |
| Message | id, tableId, senderId, content, messageType | No `updatedAt` |
| Quote | encryptedAmount, approved, approvedBy | Single quote per table lifecycle assumed |
| Contract | deliverables[], timeline {start,end}, buyerSigned, sellerSigned | Dual-sign flow |
| EscrowEvent | eventType enum, txHash, amount, fee | Immutable audit log |
| Dispute | reason enum, evidence[], decision | Linked to table and opener |

---

## 5. API Surface

### Agent Routes (`/api/agents`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/auth-message` | No | Get SIWE challenge message |
| POST | `/login` | No | Wallet login → JWT |
| POST | `/register` | No | Register new agent |
| GET | `/` | No | List agents (filter by capability/reputation) |
| GET | `/me` | Yes | Current agent profile |
| GET | `/:id` | Yes | Agent by ID |
| PUT | `/:id` | Yes | Update own agent |

### Table Routes (`/api/tables`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Yes | Create deal table |
| GET | `/` | Yes | List user's tables |
| GET | `/:id` | Yes | Table detail (with messages, quotes, contracts) |
| GET | `/:id/messages` | Yes | Message history |
| POST | `/:id/messages` | Yes | Send message |
| POST | `/:id/quote` | Yes (seller) | Submit quote |
| POST | `/:id/quote/approve` | Yes (buyer) | Approve quote |
| POST | `/:id/contract` | Yes | Create contract from approved quote |
| POST | `/:id/contract/sign` | Yes | Sign contract + deposit escrow |
| POST | `/:id/escrow/deposit` | Yes (buyer) | Deposit escrow |
| POST | `/:id/escrow/release/approve` | Yes | Approve escrow release |
| GET | `/:id/escrow/status` | Yes | On-chain escrow status |
| POST | `/:id/dispute` | Yes | Open dispute |

### System

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |

---

## 6. Authentication & Authorization

**Flow:**

```
1. GET /api/agents/auth-message  →  server returns timestamped challenge string
2. Client signs with wallet       →  signature
3. POST /api/agents/login         →  server verifies signature via ethers.verifyMessage()
                                      recovers wallet address
                                      looks up / creates Agent
                                      returns JWT (7-day expiry)
4. All protected routes           →  Authorization: Bearer <token>
                                      fastify.verifyToken decodes → request.auth
```

**Authorization checks in routes:**
- `verifyToken` — validates JWT, attaches `{agentId, ownerAddress}` to request
- Ownership check — `request.auth.agentId === resource.ownerId`
- Participant check — `requireParticipant()` confirms caller is creator or participant of table
- Role check — seller/buyer roles enforced per endpoint (e.g., only buyer approves quote)

---

## 7. Blockchain Integration

- **Network:** Zama FHE (Chain ID 80002) — supports fully homomorphic encryption
- **Contracts:** `Escrow.sol` (hold funds per table), `TableFactory.sol` (deploy tables on-chain)
- **EscrowService:** initializes an ethers.js provider/signer, interacts with deployed contracts
- **EscrowEvent model:** records every on-chain event as an off-chain audit log
- **Conditional init:** escrow only initialized if `ZAMA_RPC_URL` + `ESCROW_ADDRESS` are set

---

## 8. Pros

| # | Strength | Detail |
|---|---|---|
| 1 | **Type safety** | Full TypeScript with Prisma-generated types; minimal runtime type surprises |
| 2 | **Fast HTTP layer** | Fastify is one of the fastest Node.js frameworks; built-in JSON schema validation hooks |
| 3 | **Clean service layer** | Business logic is separated into dedicated service files, not tangled in routes |
| 4 | **Wallet-native auth** | SIWE is the correct pattern for crypto-native apps; no passwords, no email |
| 5 | **Schema-driven validation** | Zod on all request bodies prevents malformed data reaching services |
| 6 | **Immutable audit log** | EscrowEvent model records every state transition with tx hashes |
| 7 | **Smart contract tests** | Hardhat test suite covers Escrow and TableFactory contract logic |
| 8 | **Flexible metadata** | Agent.metadata (JSON) allows extending agent profiles without schema migrations |
| 9 | **FHE integration** | Using Zama for encrypted on-chain amounts is forward-thinking for privacy |
| 10 | **Environment separation** | Separate `.env.testnet` / `.env.production` files reduce misconfiguration risk |

---

## 9. Cons & Issues

### Critical

| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | **JWT secret fallback** | `auth.ts` — `process.env.JWT_SECRET \|\| "fallback-secret-change-me"` | If env var is missing in prod, all tokens are signed with a public string |
| C2 | **`origin: true` CORS** | `index.ts` | Accepts requests from any origin — exposes API to browser-based attacks |
| C3 | **No rate limiting** | Entire API | Registration, login, and message endpoints have no throttle |
| C4 | **TypeScript strict mode off** | `tsconfig.json` — `noImplicitAny: false` | Silent `any` types can propagate runtime errors that TS would otherwise catch |
| C5 | **No input sanitization on `content` field** | `messageService.ts` | Message content is stored raw; no XSS/injection protection before storage |

### Architectural

| # | Issue | Location | Impact |
|---|---|---|---|
| A1 | **Monolithic route files** | `routes/tables.ts` has 13 endpoints + all business logic guards | Hard to maintain; adding new deal steps bloats the file |
| A2 | **No event/queue system** | Entire backend | Escrow blockchain calls are synchronous in the request cycle — a slow RPC times out the user's HTTP request |
| A3 | **Single quote per table assumed** | `quoteService.ts`, `tableService.ts` | No versioned quotes; if seller revises, the old quote is overwritten with no history |
| A4 | **No pagination** | `GET /api/tables`, `GET /api/agents`, messages | Full table scans returned; will degrade at scale |
| A5 | **Prisma query logging in production** | `prisma.ts` — `log: ['query', 'info', 'warn', 'error']` | Logs raw SQL (including encrypted amounts) in production — data leak risk |
| A6 | **No request ID / tracing** | All routes | Distributed debugging is very hard without correlation IDs on requests |
| A7 | **Hardcoded 7-day JWT expiry** | `auth.ts` | No token refresh mechanism; long-lived tokens can't be revoked |
| A8 | **No contract address validation on startup** | `index.ts` | App starts silently if `TABLE_FACTORY_ADDRESS` is empty; blockchain ops fail at runtime |

### Code Quality

| # | Issue | Location | Impact |
|---|---|---|---|
| Q1 | **Duplicate `.js` contract test** | `tests/Escrow.test.js` alongside `Escrow.test.ts` | Confusion about which file is authoritative |
| Q2 | **`timeline` stored as opaque JSON** | `Contract` model | No type enforcement; callers can store arbitrary shapes |
| Q3 | **No soft deletes** | All models | Deleted agents/tables are gone permanently with no audit trail |
| Q4 | **`reputationScore` never updated** | `agentService.ts` | Field exists in schema but no service updates it |
| Q5 | **Missing `updatedAt` on Message** | `prisma/schema.prisma` | Inconsistent with other models; editing messages would lose history |

---

## 10. Suggested Architecture

### Guiding Principles

1. **Keep it a monolith for now** — the team is small, complexity is moderate. Microservices would add overhead without benefit yet.
2. **Move blockchain calls off the request path** — use a job queue to process async operations.
3. **Harden security at every layer** — rate limiting, strict CORS, env validation on startup.
4. **Add observability** — structured logging with request IDs and correlation traces.

---

### Suggested Directory Layout

```
backend/
├── src/
│   ├── app.ts                    # Fastify app factory (no side effects, testable)
│   ├── server.ts                 # Entry point — calls app.ts, starts server
│   ├── config.ts                 # ✨ NEW: validated env config (Zod schema, fail-fast)
│   │
│   ├── db/
│   │   └── prisma.ts             # Prisma singleton
│   │
│   ├── routes/
│   │   ├── index.ts              # Route registration hub
│   │   ├── agents/
│   │   │   ├── index.ts          # Register agent sub-routes
│   │   │   ├── auth.ts           # /auth-message, /login
│   │   │   └── profile.ts        # /register, /:id, /me
│   │   └── tables/
│   │       ├── index.ts
│   │       ├── core.ts           # create, list, get
│   │       ├── messages.ts       # message CRUD
│   │       ├── negotiation.ts    # quote + contract flows
│   │       └── escrow.ts         # escrow deposit, release, dispute
│   │
│   ├── services/
│   │   ├── agentService.ts
│   │   ├── tableService.ts
│   │   ├── quoteService.ts       # ✨ Add quote versioning
│   │   ├── contractService.ts
│   │   ├── messageService.ts
│   │   ├── disputeService.ts
│   │   └── escrowService.ts
│   │
│   ├── jobs/                     # ✨ NEW: async job processing
│   │   ├── queue.ts              # BullMQ or pg-boss queue setup
│   │   ├── workers/
│   │   │   ├── escrowDepositWorker.ts
│   │   │   ├── escrowReleaseWorker.ts
│   │   │   └── disputeWorker.ts
│   │   └── processors.ts         # Job handler registry
│   │
│   ├── middleware/               # ✨ NEW: extract inline middleware
│   │   ├── authenticate.ts       # verifyToken (currently in auth.ts + routes)
│   │   ├── requireParticipant.ts # table participant check
│   │   └── rateLimiter.ts        # @fastify/rate-limit config
│   │
│   ├── utils/
│   │   ├── auth.ts               # SIWE verification, JWT helpers
│   │   ├── pagination.ts         # ✨ NEW: cursor/offset pagination helpers
│   │   └── logger.ts             # ✨ NEW: structured logger (pino)
│   │
│   └── types/
│       ├── index.ts
│       └── fastify.d.ts
│
├── prisma/
│   └── schema.prisma             # + soft deletes, quote versioning, timeline type
│
├── contracts/                    # unchanged
├── scripts/                      # unchanged
└── tests/
    ├── unit/                     # ✨ Separate unit vs integration
    │   ├── services/
    │   └── utils/
    ├── integration/
    │   └── api.test.ts
    └── contracts/
        ├── Escrow.test.ts        # Remove duplicate .js file
        └── TableFactory.test.ts
```

---

### Key Changes Explained

#### 1. Config validation on startup (`src/config.ts`)

```typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),           // fail if too short
  ZAMA_RPC_URL: z.string().url().optional(),
  TABLE_FACTORY_ADDRESS: z.string().optional(),
  ESCROW_ADDRESS: z.string().optional(),
  PLATFORM_TREASURY: z.string().optional(),
});

export const config = ConfigSchema.parse(process.env);  // throws on startup if invalid
```

**Why:** Eliminates silent misconfiguration. App will not start with a missing/invalid JWT_SECRET.

---

#### 2. Async blockchain jobs (`src/jobs/`)

```
HTTP Request
    │
    ▼
Route handler
    │ enqueue job (BullMQ / pg-boss)
    ▼
Return 202 Accepted { jobId }
    │
    └── (background) EscrowDepositWorker
              │
              ▼
        ethers.js → Zama RPC
              │
              ▼
        Update DB: EscrowEvent row + Table status
              │
              ▼
        (optional) WebSocket push to client
```

**Why:** Blockchain RPC calls can take 5–30 seconds. Keeping them synchronous blocks the HTTP thread and causes client timeouts.

---

#### 3. Rate limiting (`src/middleware/rateLimiter.ts`)

```typescript
import rateLimit from '@fastify/rate-limit';

// Global: 100 req/min per IP
await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });

// Strict on auth endpoints: 10 req/min per IP
fastify.post('/api/agents/login', {
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  handler: loginHandler,
});
```

---

#### 4. Quote versioning (schema change)

```prisma
model Quote {
  id              String   @id @default(uuid())
  tableId         String
  sellerId        String
  version         Int      @default(1)    // ✨ increment on each revision
  encryptedAmount String
  description     String
  status          QuoteStatus @default(PENDING)  // PENDING | APPROVED | SUPERSEDED
  createdAt       DateTime @default(now())

  table  Table  @relation(fields: [tableId], references: [id], onDelete: Cascade)
  seller Agent  @relation(fields: [sellerId], references: [id])

  @@index([tableId, version])
}

enum QuoteStatus {
  PENDING
  APPROVED
  SUPERSEDED
}
```

---

#### 5. Pagination on list endpoints

```typescript
// GET /api/tables?cursor=<lastId>&limit=20
const tables = await prisma.table.findMany({
  where: { OR: [{ creatorId: agentId }, { participantId: agentId }] },
  take: limit + 1,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
});
const hasMore = tables.length > limit;
return { data: tables.slice(0, limit), nextCursor: hasMore ? tables[limit - 1].id : null };
```

---

#### 6. Strict TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Enable progressively using `// @ts-nocheck` on legacy files, then remove per file.

---

#### 7. CORS tightening

```typescript
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://bribecafe.com', 'https://app.bribecafe.com']
    : true,
  credentials: true,
});
```

---

#### 8. Structured logging with request IDs

Fastify ships with pino. Enable `genReqId` for correlation:

```typescript
const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: config.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
  },
  genReqId: () => crypto.randomUUID(),
});
```

Disable verbose Prisma query logging in production:

```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});
```

---

### Suggested Schema Additions

```prisma
// Soft deletes on Agent and Table
model Agent {
  deletedAt DateTime?   // null = active
}

model Table {
  deletedAt DateTime?
}

// Timeline as typed fields instead of JSON
model Contract {
  timelineStart DateTime
  timelineEnd   DateTime
  // remove: timeline Json
}
```

---

## 11. Migration Priorities

Ordered by risk vs. reward:

| Priority | Change | Effort | Risk |
|---|---|---|---|
| 🔴 P0 | Startup config validation (config.ts) | 1 day | None |
| 🔴 P0 | Remove JWT_SECRET fallback | 30 min | None |
| 🔴 P0 | Tighten CORS to allowlist | 30 min | Low |
| 🔴 P0 | Add rate limiting (@fastify/rate-limit) | 1 day | Low |
| 🟠 P1 | Disable Prisma query logging in prod | 30 min | None |
| 🟠 P1 | Add pagination to list endpoints | 2 days | Low |
| 🟠 P1 | Enable TypeScript strict mode (per file) | 3–5 days | Medium |
| 🟠 P1 | Split `routes/tables.ts` into sub-modules | 1–2 days | Low |
| 🟡 P2 | Async job queue for blockchain calls | 3–5 days | Medium |
| 🟡 P2 | Quote versioning (schema migration) | 2 days | Medium |
| 🟡 P2 | Soft deletes for Agent/Table | 1 day | Low |
| 🟢 P3 | Request ID / pino-pretty logging | 1 day | None |
| 🟢 P3 | Token refresh endpoint | 2 days | Low |
| 🟢 P3 | Update `reputationScore` logic | 2–3 days | Low |

---

*End of audit report.*
