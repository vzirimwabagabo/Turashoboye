# Turashoboye Feeds — System Implementation & Security Architecture Report
**Project:** Turashoboye Animal Feeds Platform (Mahama / Kirehe, Rwanda)  
**Date:** October 2026  
**Repository Branch:** `main`  
**Deployment URL:** [https://turashoboye.vercel.app](https://turashoboye.vercel.app)  
**Database:** PostgreSQL on Supabase (`snmxdfsijmgukhwtuict.supabase.co`)

---

## 1. Executive Summary & Root Cause Analysis

### Background & Problem Statement:
1. **Misleading Landing Page & Role Confusions:** Previously, unauthenticated visitors or improperly routed users were exposed to administrative panels or received misleading greetings (e.g. `superadmin@turashoboye.rw` routed to `/portal` greeted as a farmer).
2. **Client-Side Impersonation Risks:** Earlier iterations relied on client-side state (`sessionStorage.turashoboye_act_as_user`) which introduced serious audit and privilege bypass vulnerabilities.
3. **Database Authorization Gaps:**
   - A legacy RPC `public.set_user_role(UUID, app_role)` allowed Business Owners to elevate their own role to `super_admin`.
   - The `customers` table RLS policy used `FOR ALL` without `WITH CHECK`, permitting customer record spoofing.
   - Financial payment records (`public.payments`) lacked database-level immutability triggers, allowing updates to confirmed transaction amounts.
   - User accounts lacked an `is_active` or suspension mechanism, preventing administrators from revoking access immediately in PostgreSQL RLS.

### Solutions Delivered:
- **Universal Impersonation Decommissioned:** All client-side identity substitutions, `sessionStorage` backdoor keys, and impersonation banners were eliminated from frontend and state management.
- **Server-Controlled Authorization & RLS Enforcement:** All roles and permissions are enforced at the PostgreSQL level via Row-Level Security policies, triggers, and security-definer RPCs. Frontend role checks serve strictly as UI conveniences.
- **Sovereign Superadmin Model:** Legitimate Super Admin operational powers have been preserved and hardened: user lifecycle management, role assignment with last-superadmin protection, account suspension/reactivation, password recovery dispatch, business owner guardrails, and real-time security audit log inspection.
- **Financial & Inventory Ledger Immutability:** Dedicated database triggers block updates and deletions to confirmed payments, stock movement ledgers, and audit logs.
- **Fail-Closed Security Model:** Suspended accounts or unauthenticated sessions fail closed and cannot assume privileged roles or access sensitive depot records.

---

## 2. Dedicated Role-Based Personas & Workspaces

The platform strictly segregates user workspaces based on server-verified roles:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TURASHOBOYE PLATFORM                                  │
├────────────────────────┬──────────────────────┬────────────────────┬────────────────────┤
│ 🛡️ SUPER ADMIN         │ 🏢 BUSINESS OWNER    │ 📦 DEPOT MANAGER   │ 🌾 FARMER          │
│ Route: /admin          │ Route: /dashboard    │ Route: /dashboard  │ Route: /portal     │
├────────────────────────┼──────────────────────┼────────────────────┼────────────────────┤
│ • Master Console       │ • Executive Navy     │ • Factory Amber    │ • Farm Green       │
│ • Real-time Audit Logs │ • P&L Margins        │ • Silo Gauges      │ • Feed Catalogue   │
│ • User Status & Roles  │ • PO Approval Queue  │ • Milling Queue    │ • Direct Orders    │
│ • Owner Guardrails     │ • Working Capital    │ • Bagged Stocks    │ • Payment Receipts │
│ • Password Recovery    │ • Entity Compliance  │ • QA Dispatch      │ • Ration Estimator │
└────────────────────────┴──────────────────────┴────────────────────┴────────────────────┘
```

### 1. 🛡️ Super Administrator (`/admin`)
- **Route Access:** Exclusively restricted to `[UserRole.SUPER_ADMIN]`.
- **Master User Privileges Directory:** Displays all verified registered accounts from `public.profiles`. Enables role assignments across `super_admin`, `owner`, `manager`, `sales_staff`, `inventory`, and `public`.
- **Account Suspension & Reactivation:** Ability to suspend rogue accounts or reactivate them via `public.admin_set_user_status()`. Includes self-lockout prevention (superadmin cannot suspend themselves) and audit reason tracking.
- **Password Recovery Dispatch:** Direct password reset trigger using Supabase Auth recovery workflow.
- **Real-Time Security & Governance Audit Stream:** Live query stream of `public.audit_logs` displaying event action, actor profile, target resource, timestamp, and formatted JSON payload.
- **Business Owner Guardrails:** Configurable ceilings that Business Owners cannot exceed (Max Owner Discount Cap, Single Stock Adjustment Cap, Dual-Signoff Requirement).

### 2. 🏢 Business Owner (`/dashboard`)
- **Executive Financial KPIs:** Real-time visibility into Monthly Gross Turnover, Gross Profit Margin, Liquid Working Capital across bank and Mobile Money accounts.
- **High-Value PO & Expense Queue:** Interactive approval workflows for raw grain procurement and equipment maintenance.
- **Turnover Breakdown:** Feed category performance (Broiler, Layer, Pig Starter, Dairy Concentrates).
- **Owner Scope:** Authorized to manage depot staff and operational settings, but strictly blocked by database triggers from elevating to `super_admin`, altering confirmed payments, or clearing audit logs.

### 3. 📦 Depot / Operations Manager (`/dashboard`)
- **Visual Silo Fill Gauges:** Real-time capacity monitoring for Maize Grain (25 MT), Soya Bean Meal (10 MT), Wheat Bran (12 MT), and Mineral Premix (2 MT).
- **Production Milling Queue:** Tracking milling batches through grinding, mixing, and bagging stages.
- **Warehouse Floor Bagged Stock:** Live count of packaged 50kg/25kg bags ready for dispatch.
- **Scope Limits:** Cannot alter system settings, financial payments, or elevate roles.

### 4. 🌾 Farmer / Customer (`/portal`)
- **Simplified Self-Service Portal:** Browse feed formulations, place bulk feed orders, request delivery to Mahama refugee camp and Kirehe farms, track order fulfillment, and review payment receipts.
- **Strict Data Isolation:** Customers can only view their own orders and payments. RLS policies block farmers from viewing internal inventory movements, audit logs, or other customer records.

---

## 3. Database Security Migrations Applied

### Migration 1: `20261019000002_fix_authorization_vulnerabilities_and_payment_immutability.sql`
1. **Dropped Insecure Role Elevation RPC:** Removed legacy `public.set_user_role(UUID, public.app_role)` which lacked superadmin authorization checks.
2. **Trigger Hardening:** Updated `enforce_profile_role_integrity()` to disallow any modification of `super_admin` role unless caller has an active `super_admin` profile.
3. **Account Integrity Reset:** Reverted `owner@turashoboye.rw` back to `owner`.
4. **Customer Record Isolation:** Replaced insecure `FOR ALL` policy with granular `SELECT`, `INSERT`, `UPDATE` policies enforcing `auth_user_id = auth.uid()`, with `DELETE` restricted to `public.is_owner()`.
5. **Payment Ledger Immutability:** Attached `trg_enforce_payment_immutability` trigger to `public.payments` blocking changes to `amount_rwf`, `order_id`, `method`, `idempotency_key`, and hard deletes on confirmed transactions.

### Migration 2: `20261019000003_superadmin_user_management_and_audit.sql`
1. **Account Status Columns:** Added `status VARCHAR(20) DEFAULT 'active'`, `is_active BOOLEAN DEFAULT TRUE`, `suspended_at`, `suspended_by`, and `suspension_reason` to `public.profiles`.
2. **Instant RLS Deactivation:** Hardened helper functions (`is_super_admin`, `is_owner`, `is_manager_or_owner`, `is_staff`) to check `AND is_active = TRUE`, immediately locking suspended accounts out of database RLS operations.
3. **Administrative Status RPC (`admin_set_user_status`):**
   - Validates caller is `super_admin` or `owner`.
   - Blocks self-suspension.
   - Prevents owners from suspending executive accounts (`owner` or `super_admin`).
   - Writes `USER_ACCOUNT_SUSPENDED` or `USER_ACCOUNT_REACTIVATED` to `public.audit_logs`.
4. **Administrative Role RPC (`admin_set_user_role`):**
   - Validates caller is `super_admin` or `owner`.
   - Protects `super_admin` role from unauthorized elevation.
   - Guards against demoting the last remaining active Super Administrator.
   - Writes `USER_ROLE_CHANGE` or `UNAUTHORIZED_ROLE_CHANGE_ATTEMPT` to `public.audit_logs`.
5. **Updated `get_my_profile()` RPC:** Returns profile metadata including `status`, `is_active`, `suspended_at`, and `suspension_reason`.

### Migration 3: `20261019000004_customer_orders_and_payments_rls.sql`
1. **Payments RLS:** Added policy enabling customers to view payments belonging to their own sales orders.
2. **Customer Order Placement RPC (`submit_customer_order`):** Allows authenticated farmers to submit self-service feed orders with atomic payment and customer record association.

### Migration 4: `20261019000005_seed_reference_products_and_variants.sql`
1. **Reference Products & Variants:** Seeds authentic formulations (Broiler Starter, Layer Complete, Pig Starter, Dairy Meal) and raw ingredients (Maize, Soya, Premix).
2. **Verified Suppliers:** Registers Kirehe Grain Farmers Cooperative (KIFCO) and Eastern Province Soya Processors Ltd.

---

## 4. Verification & Negative Authorization Test Results

### Suite A: PostgreSQL Negative Authorization Matrix (`scripts/test-negative-authorization.mjs`)
Executed directly against the remote Supabase PostgreSQL database across 5 distinct auth states (22/22 Tests Passed):

| Test ID | Persona / Actor | Attack Scenario / Target Operation | Expected Result | Actual Result | Status |
|---|---|---|---|---|:---:|
| `SEC-ANON-01` | Anonymous | Read `public.profiles` | 0 rows / RLS error | Returned 0 rows | ✅ PASS |
| `SEC-ANON-02` | Anonymous | Read `public.customers` | 0 rows / RLS error | Returned 0 rows | ✅ PASS |
| `SEC-ANON-03` | Anonymous | Read `public.payments` | 0 rows / RLS error | Returned 0 rows | ✅ PASS |
| `SEC-ANON-04` | Anonymous | Insert into `inventory_movements` | Rejected by RLS | Rejected: 42501 (RLS violation) | ✅ PASS |
| `SEC-FARMER-01`| Farmer (`public`) | Read other user profiles | 0 rows returned | Returned 0 rows | ✅ PASS |
| `SEC-FARMER-02`| Farmer (`public`) | Elevate role to `super_admin` via direct UPDATE | Rejected by trigger | Rejected: Privilege escalation rejected | ✅ PASS |
| `SEC-FARMER-03`| Farmer (`public`) | Call `admin_set_user_role` RPC | Exception: Unauthorized | Rejected: Unauthorized | ✅ PASS |
| `SEC-FARMER-04`| Farmer (`public`) | Insert into `inventory_movements` | Rejected by RLS | Rejected: 42501 (RLS violation) | ✅ PASS |
| `SEC-FARMER-05`| Farmer (`public`) | Call `record_inventory_adjustment` RPC | Exception: Only staff | Rejected: Only staff can submit adjustments | ✅ PASS |
| `SEC-FARMER-06`| Farmer (`public`) | Read `public.audit_logs` | 0 rows returned | Returned 0 rows | ✅ PASS |
| `SEC-FARMER-07`| Farmer (`public`) | Insert customer claiming another `auth_user_id` | Rejected by WITH CHECK | Rejected: 42501 (RLS WITH CHECK violation)| ✅ PASS |
| `SEC-FARMER-08`| Farmer (`public`) | Delete customer records | 0 rows deleted | Deleted 0 rows | ✅ PASS |
| `SEC-MGR-01`   | Depot Manager | Elevate self to `owner` via UPDATE | Rejected by trigger | Rejected: Privilege escalation rejected | ✅ PASS |
| `SEC-MGR-02`   | Depot Manager | Promote roles via `admin_set_user_role` | Exception: Unauthorized | Rejected: Unauthorized | ✅ PASS |
| `SEC-MGR-03`   | Depot Manager | Modify `settings` table | 0 rows updated / RLS error | Updated 0 rows (Owner only) | ✅ PASS |
| `SEC-OWNER-01` | Business Owner | Promote self to `super_admin` via RPC | Exception: Super Admin only | Rejected: Unauthorized | ✅ PASS |
| `SEC-OWNER-02` | Business Owner | Call legacy `public.set_user_role` | Function not found | Function does not exist in schema cache | ✅ PASS |
| `SEC-OWNER-03` | Business Owner | Elevate self to `super_admin` via UPDATE | Rejected by trigger | Rejected: Privilege escalation rejected | ✅ PASS |
| `SEC-LEDGER-01`| Business Owner | Delete from `inventory_movements` | 0 rows deleted / rejected | Deleted 0 rows (Ledger immutable) | ✅ PASS |
| `SEC-LEDGER-02`| Business Owner | Alter quantity in `inventory_movements` | 0 rows updated / rejected | Updated 0 rows (Ledger immutable) | ✅ PASS |
| `SEC-LEDGER-03`| Business Owner | Delete from `audit_logs` | 0 rows deleted / rejected | Deleted 0 rows (Audit log immutable) | ✅ PASS |
| `SEC-FIN-01`   | Business Owner | Alter confirmed payment amount in `payments` | Rejected by trigger | Rejected: Security Violation: Cannot alter amount | ✅ PASS |

### Suite B: End-to-End Browser QA Suite (`scripts/browser-qa-test.mjs`)
Executed in a real Chromium browser against the live application (20/20 Tests Passed):

1. **Public Marketing Landing Page:** Title rendered, authentic photography displayed, verified links present, no administrative data exposed.
2. **Access Control Gate:** Unauthenticated requests to `/admin` and `/dashboard` redirected to `/login`.
3. **Farmer Persona:** Authenticated as `farmer@turashoboye.rw` → Routed to `/portal` → Verified no impersonation key in `sessionStorage`.
4. **Manager Persona:** Authenticated as `manager@turashoboye.rw` → Routed to `/dashboard` → Rendered Silo gauges and milling queue → Verified `AuthenticatedFooter`.
5. **Owner Persona:** Authenticated as `owner@turashoboye.rw` → Routed to `/dashboard` → Rendered Executive PO approvals and P&L metrics → Verified `AuthenticatedFooter`.
6. **Super Admin Persona:** Authenticated as `superadmin@turashoboye.rw` → Routed to `/admin` → Rendered Super Admin Command Console, User Privilege Management, and Real-Time Security Audit Stream → Verified `AuthenticatedFooter`.

### Suite C: Unit & Build Tests
- **Vitest Unit Tests:** 2 test suites passed, 7 unit tests passed (`tests/auth_security.test.ts`, `tests/database_integrity.test.ts`).
- **TypeScript Production Build:** `tsc -b && vite build` built cleanly with 0 type errors.

---

## 5. Security & Governance Summary

All objectives have been fulfilled:
- **No Backdoors:** Impersonation mechanisms have been completely removed.
- **Hardened Superadmin:** Legitimate superadmin powers are active and backed by PostgreSQL Row-Level Security, audit triggers, and cryptographic authentication.
- **Immutability Guaranteed:** Payments, stock movements, and audit records cannot be silently rewritten or erased.
- **Continuous Auditing:** All role and status changes are permanently recorded in `public.audit_logs` and viewable in real time.
