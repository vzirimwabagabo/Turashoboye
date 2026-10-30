# Turashoboye Feeds — Security & Threat Model

This document specifies the security architecture, threat model, and cryptographic safeguards of the Turashoboye Animal Feeds management platform.

---

## 1. Threat Modeling & Risk Mitigation Matrix

| Threat Vector | Potential Impact | Layer | Architectural Mitigation |
|---|---|:---:|---|
| **Privilege Escalation** | Unauthorized role promotion (e.g. promoting self to Super Admin or Owner) | DB / RLS / Triggers | Protected trigger `enforce_profile_role_integrity()` and RPC `admin_set_user_role()`. Only existing active Super Administrators can assign or modify the `super_admin` privilege. |
| **Backdoor Impersonation** | Session hijacking via client-side state manipulation (`sessionStorage`) | Frontend / Auth | Universal client-side impersonation has been permanently decommissioned. The frontend fails closed on unverified identities, and authentication relies strictly on server-issued Supabase JWTs. |
| **Silent Payment Tampering** | Retroactively modifying confirmed payments or hiding cash theft | DB / Triggers | PostgreSQL trigger `trg_enforce_payment_immutability` blocks updates to `amount_rwf`, `order_id`, `method`, and `idempotency_key` on confirmed payments, and blocks all hard deletes. |
| **Inventory Shrinkage / Ledger Erasure** | Deleting stock movements to conceal theft or inventory spoilage | DB / RLS | `inventory_movements` is an append-only ledger. Triggers `trg_immutable_inventory_movements` block all `UPDATE` and `DELETE` queries across all roles. |
| **Duplicate Payments / Replay Attacks** | Processing double payments or duplicate refunds | DB / App | Unique constraint on `payments.idempotency_key`. Repeating a submission with the same idempotency key fails closed. |
| **IDOR / Customer Record Spoofing** | Farmers viewing or creating orders/customers for other farmers | DB / RLS | `customers` table RLS uses `WITH CHECK (auth_user_id = auth.uid())` and restricts delete privileges to owners. Customer queries strictly filter by `auth_user_id = auth.uid()`. |
| **Concurrent Oversell** | Selling nonexistent bags of feed under high concurrent demand | DB / Locks | Transactional stored procedure `record_sale_transaction()` with explicit row-level locking (`FOR UPDATE`) and available stock validation. |
| **Suspended Account Access** | Terminated or rogue employee retaining access via cached tokens | DB / RLS | PostgreSQL helper functions (`is_super_admin`, `is_owner`, `is_manager_or_owner`, `is_staff`) check `AND is_active = TRUE`. Suspended accounts are immediately locked out of all database RLS operations. |
| **Audit Log Tampering** | Deleting operational audit trails to erase evidence of malpractice | DB / Triggers | `audit_logs` has trigger `trg_immutable_audit_logs` blocking all updates and deletes. Inserts are written by security-definer procedures. |
| **Credential Hijacking on Shared Depot Devices** | Account takeover on warehouse floor tablets | Auth | TOTP MFA enforcement for privileged roles. Automatic session timeouts on shared devices. |

---

## 2. Row Level Security Architecture

Every table in PostgreSQL has Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Access is mediated by security-definer functions executing with database administrator privileges:

```sql
-- 1. Super Administrator Check (requires active account status)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
          AND role::text = 'super_admin'
          AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Business Owner or Super Admin Check
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
          AND role::text IN ('owner', 'super_admin')
          AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Operations Management Check
CREATE OR REPLACE FUNCTION public.is_manager_or_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
          AND role::text IN ('manager', 'owner', 'super_admin')
          AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. General Staff Check
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

---

## 3. Account Lifecycle & Administrative Governance

The platform provides verified administrative RPCs for user management:

### 3.1 Role Modification (`admin_set_user_role`)
- **Authority:** Only `super_admin` or `owner` can call.
- **Constraints:**
  - Non-superadmins cannot assign or revoke the `super_admin` role.
  - Cannot demote the last remaining active Super Administrator.
  - Generates an immutable entry in `public.audit_logs`.

### 3.2 Account Suspension & Reactivation (`admin_set_user_status`)
- **Authority:** Only `super_admin` or `owner` can call.
- **Constraints:**
  - Self-suspension is strictly blocked.
  - Owners cannot suspend other owners or superadmins.
  - Setting status to `'suspended'` sets `is_active = FALSE`, immediately locking the target out of all database RLS operations.
  - Requires a documented business justification, recorded in `public.audit_logs`.

---

## 4. Financial & Inventory Immutability

1. **Payment Ledger Immutability:** Once a payment record status transitions to `'confirmed'`, its financial amount (`amount_rwf`), associated `order_id`, `method`, and `idempotency_key` cannot be altered. Deletion is prohibited. Corrections must be handled through explicit credit notes, refunds, or balancing ledger entries.
2. **Stock Movement Ledger:** All movements (`receipt`, `consumption`, `production_output`, `sale`, `adjustment`, `quarantine_hold`, `quarantine_release`) are append-only. Stock levels are calculated by summing `inventory_movements.quantity` in `view_stock_on_hand`.
3. **Audit History:** System audit logs (`public.audit_logs`) cannot be truncated, edited, or deleted under any circumstance.
