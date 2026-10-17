# Turashoboye Feeds — System Architecture & Design

## 1. Architectural Overview
The platform follows a clean, decoupled architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Presentation Layer                   │
│          React 19 + TypeScript + Vite + Tailwind CSS        │
│          Offline Storage: IndexedDB + Service Worker        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     (Direct REST / Realtime)          (Signed Uploads)
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Supabase Platform       │ │     Cloudinary Media       │
│  - Supabase Auth (TOTP MFA)  │ │  - Public Product Photos   │
│  - PostgreSQL Engine (RLS)   │ │  - Authenticated Private   │
│  - Atomic Stored Procedures  │ │    Regulatory Documents    │
│  - Edge Functions (/sync)    │ └────────────────────────────┘
└──────────────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 Server-Authoritative State
- While client devices cache reference data and queue offline actions, the PostgreSQL database is the single source of truth for inventory balances, pricing, order states, and financial reconciliation.
- Multi-step business operations (e.g. `complete_production_batch`, `record_sale_transaction`) execute atomically inside PostgreSQL stored procedures with explicit row-level locking (`FOR UPDATE`).

### 2.2 Offline-First with Persistent Sync Queue
- Offline operations are persisted in IndexedDB under `sync_operations` with client-generated UUIDs.
- When network is detected, operations are processed sequentially by the sync engine.
- Re-validation occurs server-side to guarantee that no offline transaction can silently corrupt balances or oversell inventory.

### 2.3 Strict Separation of Sensitive Data
- Cost prices (`cost_rwf`), internal profit margins, formula proprietary ratios, and customer contact information are strictly gated by RLS.
- Public catalogue visitors can only query published products, categories, active units, and public image assets.

---

## 3. Technology Stack Justification
- **React 19 + Vite:** Instant dev server, compact compiled bundle ($\sim 83\text{ KB}$ gzipped), modern rendering optimizations.
- **Tailwind CSS v4:** Zero-runtime utility CSS, minimal stylesheet size ($\sim 5\text{ KB}$ gzipped), rapid mobile-first responsiveness.
- **Supabase PostgreSQL:** ACID guarantees, native Row Level Security, built-in TOTP MFA, automatic JSON endpoints, and versioned migration support.
- **Cloudinary:** Global CDN delivery, automatic WebP/AVIF compression targeting $< 500\text{ KB}$ per image, and secure signed uploads keeping API secrets off client browsers.
