# Turashoboye Feeds — Security & Threat Model

## 1. Threat Modeling & Risk Mitigation

| Threat Vector | Potential Impact | Layer | Architectural Mitigation |
|---|---|:---:|---|
| **Privilege Escalation** | Unauthorized price discounts, viewing ingredient costs, tampering with recipes | DB / RLS | RLS checks on PostgreSQL `auth.uid()`, querying `profiles.role`. Sensitive columns (`cost_rwf`) restricted to Manager/Owner. |
| **Silent Stock Deletion / Manipulation** | Inventory shrinkage, unrecorded theft | DB | Direct `UPDATE` and `DELETE` on `inventory_movements` are strictly denied by RLS policy. Adjustments require auditable reasons. |
| **Double Spending / Duplicate Payments** | Erroneous customer credit, cash discrepancy | DB / App | Unique `idempotency_key` constraint on `payments` table. Repeated requests return original transaction. |
| **Concurrent Oversell** | Selling nonexistent bags of feed | DB | Atomic PostgreSQL function `record_sale_transaction()` with explicit row locks and inventory validation. |
| **Cloudinary Credential Leakage** | Asset deletion, unauthorized file upload | Backend | Client receives one-time signed upload parameters from trusted server function. Cloudinary API secret never leaves server. |
| **Credential Hijacking on Shared Phones** | Account takeover on shop floor | Auth | TOTP MFA required for Manager and Owner roles. Short session timeouts on shared devices. |
| **Data Loss via DB Failure** | Operational disruption, loss of 10-year records | Infra | Daily encrypted off-site logical backups (`pg_dump`) to separate object storage. |

---

## 2. Row Level Security Architecture
Every single table in PostgreSQL has RLS enabled. Three primary security definer helper functions govern access:
1. `current_user_role()`: Fetches the authenticated user's assigned `app_role`.
2. `is_manager_or_owner()`: Returns true if user has elevated operational authority.
3. `is_staff()`: Returns true for any authenticated staff member (`sales_staff`, `inventory`, `manager`, `owner`).

---

## 3. Cloudinary Integration Security
- **Product Images:** Uploaded to a public product folder with WebP optimization.
- **Regulatory Documents & Invoices:** Uploaded to an authenticated private asset folder. URLs are generated server-side with short-lived expiration tokens to prevent unauthorized public access.
