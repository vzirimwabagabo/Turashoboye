# Turashoboye Feeds — Role & Permissions Matrix

All access rules are enforced directly at the PostgreSQL layer via Row Level Security (RLS) policies, security triggers, and security-definer helper functions. Frontend route guards provide user experience conveniences, but the database guarantees absolute security boundaries.

---

## 1. Role Definitions & Hierarchy

The platform implements a strict 6-tier role model:

1. **`super_admin`**: Sovereign platform governance above individual business entities. Manages all platform user accounts, assigns and revokes roles (including `owner`), configures platform-wide security limits (discounts, adjustment caps, formulation approval policies), reviews real-time immutable security audit streams, and triggers account recovery.
2. **`owner`**: Business executive operating within the registered business entity. Manages business finances, views P&L margins and cost prices, approves high-value purchase orders and expenses, manages staff accounts and operational settings, and conducts financial audits.
3. **`manager`**: Depot operations manager. Manages feed formulations, oversees daily milling batches, releases/imposes quality holds, reviews silo capacities, approves standard inventory adjustments, and supervises depot staff.
4. **`inventory`**: Warehouse and depot inventory officer. Receives supplier deliveries, creates raw ingredient lots, logs quality inspection results, and performs periodic stock physical counts.
5. **`sales_staff`**: Counter and depot sales staff. Records customer sales orders, issues official receipts, logs verified cash or Mobile Money payments, and tracks order fulfillment.
6. **`public`**: Authenticated farmers and public customers. Browses published product catalogues, places self-service orders via the customer portal, tracks order fulfillment, reviews personal payment history, and downloads printable order receipts. Anonymous visitors can only browse published products and company information.

---

## 2. Server-Enforced Permissions Matrix

| Resource / Action | Public / Farmer | Sales Staff | Inventory Staff | Depot Manager | Business Owner | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Browse Published Catalogue** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Place Customer Self-Order (`submit_customer_order`)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Personal Orders & Payments** | ✅ (Self only) | ✅ (All) | ✅ (All) | ✅ (All) | ✅ (All) | ✅ (All) |
| **View Internal Cost Prices (`cost_rwf`)** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Manage Products & Variants (CRUD)** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Create & Update Customer Profiles** | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Record Sale Order & Counter Payments** | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **View Live Stock on Hand (`view_stock_on_hand`)** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manage Suppliers & Purchase Orders** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Record Goods Receipts & Ingredient Lots** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Execute Production Run (`complete_production_batch`)** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Approve Formulation Versions** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Conduct Minor Stock Adjustment ($< 100\text{ kg}$)** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Approve Material Stock Adjustment ($\ge 100\text{ kg}$)** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Impose / Release Quality Holds** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Manage Operational System Settings** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage Staff Roles (`sales_staff`, `inventory`, `manager`)** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Assign / Revoke `owner` Role** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Assign / Revoke `super_admin` Role** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (Protected) |
| **Suspend / Reactivate User Accounts** | ❌ | ❌ | ❌ | ❌ | ✅ (Staff only) | ✅ (All) |
| **Inspect System Security Audit Stream** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Configure Owner Discretionary Guardrails** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Direct Hard Delete on Movements / Payments / Audit Logs** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Immutability & Security Invariants

1. **No Hard Deletes:** Database triggers strictly block `DELETE` operations on `public.inventory_movements`, `public.payments` (confirmed), `public.sales_orders`, and `public.audit_logs`.
2. **Payment Tamper Resistance:** The trigger `trg_enforce_payment_immutability` rejects any `UPDATE` touching `amount_rwf`, `order_id`, `method`, or `idempotency_key` on confirmed payment records.
3. **Last Super Administrator Protection:** The RPC `public.admin_set_user_role` checks that at least one active `super_admin` exists and will abort any transaction that attempts to demote or remove the last remaining superadmin.
4. **Self-Lockout Prevention:** Administrative RPCs block users from suspending or deactivating their own active profile.
5. **Fail-Closed Account Status:** Helper functions `public.is_super_admin()`, `public.is_owner()`, `public.is_manager_or_owner()`, and `public.is_staff()` verify `AND is_active = TRUE`. Suspended accounts are immediately locked out of all database RLS operations.
