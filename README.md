# Turashoboye Feeds — Cloud Feed Mill & Depot Operations Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/vzirimwabagabo/Turashoboye)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-emerald.svg)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38b2ac.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **Production Deployment:** [https://turashoboye.vercel.app](https://turashoboye.vercel.app)  
> **Operational Base:** Mahama Primary Feed Depot, Sector Mahama, Kirehe District, Eastern Province, Rwanda  
> **Database:** PostgreSQL on Supabase (`snmxdfsijmgukhwtuict.supabase.co`)

---

## 1. Project Overview & Mission

**Turashoboye Feeds** is a specialized, production-grade cloud enterprise resource planning (ERP) and operations platform tailored for animal feed milling, inventory tracking, quality assurance, multi-tier sales, and farmer distribution in Eastern Rwanda.

Operating in the vicinity of the **Mahama Refugee Settlement** and broader **Kirehe agricultural sector**, Turashoboye produces and distributes high-performance, cost-effective feeds for poultry (broilers and layers), swine (piglets and growers), and dairy cattle. The platform bridges smallholder farmers, refugee-led agricultural cooperatives, depot supervisors, and executive management through:

1. **Guaranteed Nutritional Standards:** Formulations compliant with Rwanda Standards Board (RSB) standards (`RS EAS 287`, `RS EAS 90`, `RS EAS 75`).
2. **Transparent Grain Traceability:** End-to-end chain of custody linking raw grain supplier deliveries, grain silo storage, milling batch inputs, quality inspections, and bagged customer sales.
3. **Multi-Tenant & Role-Gated Workspaces:** Distinct, secure operational portals tailored for Super Administrators, Business Owners, Depot Managers, Inventory Officers, Counter Sales Staff, and Farmers.
4. **Anti-Tamper Financial & Stock Ledgers:** Append-only database movement and payment ledgers guarded by PostgreSQL Row-Level Security (RLS) and immutable triggers.
5. **Offline Resilience:** Client-side IndexedDB caching and sync operation queues designed for intermittent cellular connectivity in rural Rwanda.

---

## 2. System Architecture

The application implements a decoupled, server-authoritative architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Client Presentation Layer                          │
│                   React 19 + TypeScript + Vite + Tailwind CSS               │
│                   Offline Storage: IndexedDB + Service Worker               │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
              (Direct REST / Realtime)         (Signed Uploads)
                        │                             │
                        ▼                             ▼
┌───────────────────────────────────────────┐ ┌───────────────────────────────┐
│              Supabase Platform            │ │       Cloudinary Media        │
│  - Supabase Auth (TOTP MFA, JWT Tokens)   │ │  - Public Product Photos      │
│  - PostgreSQL 15 Engine (Row-Level Sec)   │ │  - Authenticated Private QA   │
│  - Stored Procedures (Atomic Transactions)│ │    Certificates & Documents   │
│  - Database Triggers (Ledger Immutability)│ └───────────────────────────────┘
└───────────────────────────────────────────┘
```

### Architectural Principles:
* **Server-Authoritative State:** While client devices cache reference data in IndexedDB, the remote PostgreSQL engine remains the single source of truth for stock quantities, pricing, order states, and financial reconciliation.
* **Fail-Closed Security Boundary:** Client-side role checks serve strictly as UI conveniences. Every privileged operation is verified by database Row-Level Security (RLS) policies and security-definer procedures.
* **Atomic Business Workflows:** Multi-step operations (`complete_production_batch`, `record_sale_transaction`, `record_inventory_adjustment`) execute atomically inside PostgreSQL transactions with explicit row-level locks (`FOR UPDATE`), eliminating race conditions and overselling.
* **Signed Media Uploads:** Product imagery and regulatory certificates are stored in Cloudinary via server-generated one-time signed upload signatures. Privileged API secrets are never exposed in browser bundles.

---

## 3. Dedicated User Personas & Workspaces

The application strictly segregates user workspaces through deterministic role-based routing:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TURASHOBOYE PLATFORM                                     │
├─────────────────────────┬──────────────────────┬───────────────────────┬───────────────────────┤
│ 🛡️ SUPER ADMIN          │ 🏢 BUSINESS OWNER    │ 📦 DEPOT MANAGER      │ 🌾 FARMER / CUSTOMER   │
│ Route: /admin           │ Route: /dashboard    │ Route: /dashboard     │ Route: /portal        │
├─────────────────────────┼──────────────────────┼───────────────────────┼───────────────────────┤
│ • Master Console        │ • Executive Navy     │ • Factory Amber       │ • Farm Green          │
│ • Real-time Audit Logs  │ • P&L Margins        │ • Silo Gauges         │ • Feed Catalogue      │
│ • User Status & Roles   │ • PO Approval Queue  │ • Milling Queue       │ • Direct Orders       │
│ • Owner Guardrails      │ • Working Capital    │ • Bagged Stocks       │ • Payment Receipts    │
│ • Password Recovery     │ • Entity Compliance  │ • QA Dispatch         │ • Ration Estimator    │
└─────────────────────────┴──────────────────────┴───────────────────────┴───────────────────────┘
```

### 1. 🛡️ Super Administrator (`/admin`)
* **Access Boundary:** Restricted exclusively to `[UserRole.SUPER_ADMIN]`.
* **Master User Directory:** Displays all verified platform accounts from `public.profiles`. Enables role assignments across `super_admin`, `owner`, `manager`, `sales_staff`, `inventory`, and `public`.
* **Last-Superadmin Guard:** Prevents demoting or deleting the last active Super Administrator.
* **Account Suspension & Reactivation:** Suspend rogue accounts or reactivate them via `admin_set_user_status()`. Blocks self-suspension and requires a documented audit reason.
* **Real-Time Security & Governance Audit Stream:** Live stream querying `public.audit_logs`, tracking authorization events, role promotions, status changes, and ledger violations.
* **Business Owner Guardrails:** Configurable operational limits that Business Owners cannot exceed (Max Owner Discount Cap, Single Stock Adjustment Cap, Dual-Signoff Requirement).

### 2. 🏢 Business Owner (`/dashboard`)
* **Access Boundary:** Restricted to `[UserRole.SUPER_ADMIN, UserRole.OWNER]`.
* **Executive Financial KPIs:** Live visibility into Monthly Gross Turnover, Gross Profit Margins, Liquid Working Capital (MTN Mobile Money + Bank accounts).
* **Interactive Approval Queue:** Authorize or decline high-value purchase orders (raw grain bulk procurement) and depot equipment capital expenses.
* **Product Line Turnover Breakdown:** Category sales share (Poultry Feeds, Pig Feeds, Dairy Concentrates).
* **Owner Restrictions:** Blocked by database triggers from elevating to `super_admin`, modifying confirmed payments, or truncating audit logs.

### 3. 📦 Depot / Operations Manager (`/dashboard`)
* **Access Boundary:** Accessible to `[SUPER_ADMIN, OWNER, MANAGER]`.
* **Visual Silo Fill Gauges:** Real-time capacity monitoring for Maize Grain (25 MT), Soya Bean Meal (10 MT), Wheat Bran (12 MT), and Mineral Premix (2 MT).
* **Production Milling Queue:** Tracking milling batches through grinding, mixing, and bagging stages.
* **Warehouse Floor Bagged Stock:** Live count of packaged 50kg/25kg bags ready for dispatch.
* **Scope Limits:** Cannot alter system settings, financial payments, or elevate roles.

### 4. 💼 Operations Staff (Sales & Inventory)
* **Sales Staff (`/sales`):** Counter order creation, walk-in sales recording, customer management, instant receipt generation.
* **Inventory Officers (`/inventory`, `/inventory/lots`):** Goods receipts, supplier deliveries, lot creation, aflatoxin testing logs, periodic stock reconciliations.

### 5. 🌾 Farmer / Customer (`/portal`, `/my-orders`)
* **Self-Service Order Portal:** Browse feed formulations, place direct orders, select payment method (Cash / MTN MoMo), and track order fulfillment.
* **Printable Official Receipts:** Download and print official receipts with batch traceability codes.
* **Flock Feed Estimator:** Interactive calculator estimating feed requirements based on bird count and rearing cycle.
* **Data Isolation:** Farmers can only access their own orders and payments. RLS blocks access to internal inventory movements, other customers' records, and audit logs.

---

## 4. Security & Authorization Architecture

### 4.1 Server-Controlled Role Authority
Role assignment is strictly determined server-side from PostgreSQL `public.profiles`. The application rejects any role elevation based on:
- Email strings (e.g. having `admin@` in the address grants zero privileges)
- Client-side fallback roles
- User-editable metadata
- Local storage or session storage tokens

### 4.2 Decommissioned Impersonation & Backdoor Elimination
Universal client-side impersonation has been permanently removed from the codebase:
- Stripped `sessionStorage.turashoboye_act_as_user` state.
- Removed identity substitution logic in `AuthContext.tsx`.
- Removed `ImpersonationBanner` UI shortcuts.
- Verified in automated browser tests that no backdoor key exists in storage.

### 4.3 Database Immutability Triggers
To ensure historical data integrity for statutory audit:
* **Payment Immutability (`trg_enforce_payment_immutability`):** Rejects any `UPDATE` touching `amount_rwf`, `order_id`, `method`, or `idempotency_key` on confirmed payments, and blocks all hard deletes.
* **Stock Movement Immutability (`trg_immutable_inventory_movements`):** Rejects all `UPDATE` and `DELETE` queries on `public.inventory_movements`.
* **Audit Log Immutability (`trg_immutable_audit_logs`):** Protects `public.audit_logs` against modification or truncation.
* **Profile Role Integrity (`enforce_profile_role_integrity`):** Prevents non-superadmins from granting or modifying the `super_admin` role.

### 4.4 Fail-Closed Account Lifecycle
All database security helper functions check `AND is_active = TRUE`:
```sql
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
          AND role::text IN ('sales_staff', 'inventory', 'manager', 'owner', 'super_admin')
          AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```
When an account is suspended via `admin_set_user_status()`, `is_active` becomes `FALSE`, immediately locking the user out of all database RLS operations.

---

## 5. Core Business Domains & Operations

### 5.1 Raw Ingredient Procurement & Lot Tracking
* **Supplier Management:** Certified grain cooperatives (e.g. Kirehe Grain Farmers Cooperative) and soya processors.
* **Ingredient Lots (`ingredient_lots`):** Tracks incoming deliveries with unique lot numbers (e.g. `LOT-MAIZE-20261017-01`), moisture levels, manufacturing/expiry dates, and aflatoxin test certificates.
* **Quality Holds (`lot_status = 'held'`):** Lots under quarantine are automatically excluded from the sellable inventory calculation in `view_stock_on_hand`.

### 5.2 Production Formulations & Milling Runs
* **Versioned Formulations:** Feed recipes (e.g. Broiler Starter Mash) are version-controlled with exact ingredient percentage ratios.
* **Atomic Batch Completion (`complete_production_batch`):**
  1. Atomically deducts raw material inputs from ingredient lots in `inventory_movements` (type `'consumption'`).
  2. Adds finished feed yield to `inventory_movements` (type `'production_output'`).
  3. Records yield in `production_batch_outputs`.
  4. Automatically computes milling loss percentage (`loss_percentage`) and flags an audit alert if loss exceeds $5\%$.

### 5.3 End-to-End Traceability Chain
The platform enforces a continuous chain of custody:
```
[Supplier: KIFCO] ──► [Lot: LOT-MAIZE-01] ──► [Batch: B-20261019-01] ──► [Order: ORD-001] ──► [Farmer: Jean-Paul]
```
If a customer reports an issue, the depot manager can instantly trace from the order line item to the production batch, identifying all raw ingredient lots and suppliers involved.

### 5.4 Sales, Payments & Idempotency Safety
* **Order Processing (`record_sale_transaction`):** Validates live stock in `view_stock_on_hand` before confirming orders, preventing overselling.
* **Payment Settlement:** Supports Cash, MTN Mobile Money (`momo`), and Bank Transfer.
* **Duplicate Submission Prevention:** Payments require an `idempotency_key` (UUID v4). Duplicate requests with the same key are rejected by PostgreSQL unique constraints.

---

## 6. Database Architecture & Migrations

The database is powered by PostgreSQL 15 on Supabase. Migrations are managed chronologically under `supabase/migrations/`:

| Migration File | Description |
|---|---|
| `20261017000001_initial_schema.sql` | Core domain schema: profiles, products, variants, lots, formulas, batches, orders, payments, movements. |
| `20261017000002_rls_and_security.sql` | Enables RLS across all tables and establishes security-definer helper functions. |
| `20261017000003_inventory_and_production_functions.sql` | Atomic stored procedures: `complete_production_batch`, `record_sale_transaction`, `record_inventory_adjustment`. |
| `20261017000004_seed_data.sql` | Baseline reference units of measure, categories, and Mahama depot location. |
| `20261018000001_security_hardening.sql` | Grants customer self-access to personal sales orders and line items. |
| `20261018000002_user_management_and_triggers.sql` | User provisioning triggers and profile synchronisation with Supabase Auth. |
| `20261018000003_super_admin_role.sql` | Defines the `super_admin` app role and root governance privileges. |
| `20261019000001_security_audit_and_authorization_hardening.sql` | Hardens ledger triggers against deletion and enforces strict audit logging. |
| `20261019000002_fix_authorization_vulnerabilities_and_payment_immutability.sql` | Drops insecure role RPC, fixes customer IDOR, attaches payment immutability trigger `trg_enforce_payment_immutability`. |
| `20261019000003_superadmin_user_management_and_audit.sql` | Adds account status (`is_active`, `status`), provides `admin_set_user_status` and `admin_set_user_role`. |
| `20261019000004_customer_orders_and_payments_rls.sql` | Adds customer payment view RLS and provides `submit_customer_order` RPC. |
| `20261019000005_seed_reference_products_and_variants.sql` | Seeds authentic published products (Broiler, Layer, Pig, Dairy), variants, images, and certified suppliers. |

---

## 7. Installation, Setup & Local Development

### 7.1 Prerequisites
- **Node.js:** v18.0.0 or higher (v24.x tested)
- **npm:** v9.0.0 or higher
- **Supabase CLI:** v2.0+ (optional for remote db push: `npm install -g supabase`)
- **Git**

### 7.2 Clone & Install Dependencies
```bash
git clone https://github.com/vzirimwabagabo/Turashoboye.git
cd Turashoboye
npm install
```

### 7.3 Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://snmxdfsijmgukhwtuict.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Cloudinary Media Configuration
VITE_CLOUDINARY_CLOUD_NAME=turashoboye
VITE_CLOUDINARY_API_KEY=your_api_key

# Application Settings
VITE_APP_NAME="Turashoboye Feeds"
VITE_APP_VERSION="1.0.0-rc1"
VITE_DEPOT_CODE="DEPOT-MAHAMA-01"
```

### 7.4 Running the Development Server
```bash
npm run dev
```
The local server will start on `http://localhost:5173/`.

### 7.5 Production Build
```bash
npm run build
```
Executes TypeScript type checking (`tsc -b`) and bundles production assets via Vite.

---

## 8. Automated Testing & Verification

The project includes unit tests, end-to-end browser tests, and direct backend penetration tests.

### 8.1 Vitest Unit Tests
Tests schema validations and security context definitions:
```bash
npm test
```
* **Result:** 7 tests passed across 2 suites (`tests/auth_security.test.ts`, `tests/database_integrity.test.ts`).

### 8.2 Direct Backend Negative Authorization Test Matrix
Executes 22 direct database privilege attacks against live PostgreSQL across 5 distinct auth states (Anonymous, Farmer, Manager, Owner, Super Admin):
```bash
node --env-file=.env scripts/test-negative-authorization.mjs
```
* **Results (22 / 22 Passed):**
  * Anonymous access blocked on sensitive tables (`profiles`, `customers`, `payments`, `movements`).
  * Farmer role elevation to `super_admin` rejected by triggers.
  * Farmer IDOR customer record spoofing rejected by `WITH CHECK`.
  * Manager self-promotion and system settings tampering rejected.
  * Owner promotion to `super_admin` rejected via both RPC and direct `UPDATE`.
  * Confirmed payment tampering rejected by `trg_enforce_payment_immutability`.
  * Movement ledger and audit logs confirmed immutable (0 rows deleted/updated).

### 8.3 Playwright End-to-End Browser QA Suite
Tests in a real headless Chromium browser across all user personas:
```bash
$env:TEST_URL="http://localhost:5173"; node scripts/browser-qa-test.mjs
```
* **Results (20 / 20 Passed):**
  * Marketing landing page loads authentic photography with no dashboard data leaks.
  * Unauthenticated access to `/admin` or `/dashboard` redirects to `/login`.
  * Farmer logs in and lands on `/portal` (no backdoor key in `sessionStorage`).
  * Depot Manager logs in and lands on `/dashboard` (Silo gauges, milling queue, `AuthenticatedFooter`).
  * Business Owner logs in and lands on `/dashboard` (Executive PO approvals, working capital).
  * Super Admin logs in and lands on `/admin` (Sovereign Command Console, User Privileges, Audit Stream).

---

## 9. Rwanda Regulatory Alignment & Standards

Turashoboye formulations and operations align with national standards and statutory guidelines:

| Standard / Body | Scope & Mandate | Platform Implementation |
|---|---|---|
| **RS EAS 287** | Broiler Feeds Specification | Crude protein $\ge 20\%$, balanced calcium/phosphorus ratios enforced in formulation versions. |
| **RS EAS 90** | Swine Feeds Specification | Amino acid and digestible energy density minimums configured for Pig Starter and Grower feeds. |
| **RS EAS 75** | Cattle Feeds Specification | Balanced protein concentrates for dairy cattle milk yields. |
| **RSB Aflatoxin Limits** | Aflatoxin $B_1 \le 10\text{ ppb}$ (Total $\le 20\text{ ppb}$) | Ingredient lots require moisture and aflatoxin test results prior to quality release. |
| **RICA** | Feed Mill Licensing & Safety | 10-year statutory retention of raw ingredient origins, batch records, and customer dispatches. |

---

## 10. Codebase Structure & Navigation

```
Turashoboye/
├── docs/                                  # Technical specifications and architecture
│   ├── architecture.md                    # System architecture & decoupled layers
│   ├── database-schema.md                 # Complete database tables, views & RPCs
│   ├── permissions-matrix.md              # 6-tier role access specification
│   ├── security-model.md                  # Threat model, RLS & immutability triggers
│   ├── production-and-traceability.md     # Milling workflows & chain of custody
│   └── rwanda-regulatory-research.md      # RSB & RICA standards alignment
├── public/                                # Public static assets & favicons
├── scripts/                               # Automated verification & test suites
│   ├── browser-qa-test.mjs                # Playwright end-to-end browser QA suite
│   └── test-negative-authorization.mjs    # Direct database negative authorization suite
├── src/                                   # Frontend source code
│   ├── components/                        # Reusable React components
│   │   ├── auth/                          # ProtectedRoute & RoleGate
│   │   ├── layout/                        # AppLayout, Navbar, AuthenticatedFooter
│   │   ├── public/                        # PublicLayout, PublicNavbar, PublicFooter
│   │   └── dashboard/                     # DepotManager & Owner dashboard views
│   ├── contexts/                          # AuthContext (server-authoritative auth)
│   ├── hooks/                             # Custom React hooks (useAuth, useOfflineSync)
│   ├── lib/                               # Third-party integrations (supabase.ts, cloudinary.ts)
│   ├── pages/                             # Route page components
│   │   ├── admin/                         # SuperAdminDashboardPage, UsersPage
│   │   ├── customer/                      # CustomerPortalPage
│   │   ├── inventory/                     # InventoryPage, LotsPage
│   │   ├── procurement/                   # SuppliersPage, PurchaseOrdersPage
│   │   ├── production/                    # BatchesPage, FormulasPage, TraceabilityPage
│   │   ├── public/                        # HomePage, CataloguePage, ProductDetailPage
│   │   └── sales/                         # OrdersPage, CustomersPage
│   ├── types/                             # TypeScript type definitions (database.ts, auth.ts)
│   ├── App.tsx                            # 3-tier routing & application root
│   └── main.tsx                           # Application entrypoint
├── supabase/                              # Database configurations & migrations
│   └── migrations/                        # Chronological SQL migrations (01 to 05)
├── tests/                                 # Vitest unit test files
├── .env.example                           # Template environment configuration
├── package.json                           # NPM dependencies and scripts
└── vite.config.ts                         # Vite build configuration
```

---

## 11. Core Personas & Test Credentials (Staging)

For QA, security review, and demonstration:

| Persona Role | Staging Email | Password | Primary Workspace Route |
|---|---|---|---|
| **Super Administrator** | `superadmin@turashoboye.rw` | `turashoboye2026` | `/admin` |
| **Business Owner** | `owner@turashoboye.rw` | `turashoboye2026` | `/dashboard` |
| **Depot Manager** | `manager@turashoboye.rw` | `turashoboye2026` | `/dashboard` |
| **Farmer / Customer** | `farmer@turashoboye.rw` | `turashoboye2026` | `/portal` |

---

## 12. License & Ownership

Copyright © 2026 **Turashoboye Feeds Ltd.** All rights reserved.  
Confidential & Proprietary. Developed for animal feed manufacturing, distribution, and smallholder empowerment in the Republic of Rwanda.
