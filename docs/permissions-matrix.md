# Turashoboye Feeds — Role & Permissions Matrix

All access rules are enforced directly at the PostgreSQL layer via Row Level Security (RLS) policies and security-definer helper functions. Frontend route guards provide UX guidance, but the database guarantees absolute security.

---

## 1. Role Definitions

1. **`public`**: Anonymous website visitor browsing the product catalogue.
2. **`sales_staff`**: Counter staff recording walk-in, phone, or messaging sales and logging cash receipts.
3. **`inventory`**: Warehouse/depot staff receiving supplier deliveries and conducting stock counts.
4. **`manager`**: Operations supervisor managing formulas, overseeing batches, approving adjustments, and releasing holds.
5. **`owner`**: Business executive managing users, privileged settings, and financial audits.

---

## 2. Permissions Matrix

| Resource / Action | Public | Sales Staff | Inventory Staff | Manager | Owner |
|---|:---:|:---:|:---:|:---:|:---:|
| **Browse Published Catalogue** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Internal Cost Prices (`cost_rwf`)** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage Products & Variants (CRUD)** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Create & Update Customers** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Create Sales Order (Draft/Confirmed)** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Record Cash / MoMo Payment** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **View Live Stock on Hand** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Manage Suppliers & Purchase Orders** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Record Goods Receipts & Ingredient Lots** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Execute Production Run (Complete Batch)** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Approve Formulation Versions** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Conduct Stock Adjustment ($< 100\text{ kg}$)** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Approve Material Stock Adjustment ($\ge 100\text{ kg}$)** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Release / Impose Quality Hold** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage Regulatory Records & Docs** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **View System Audit Logs** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage System Settings & User Roles** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Direct Hard Delete on Movements/Orders** | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Note:** Hard deletions on `inventory_movements`, `sales_orders`, and `payments` are blocked by RLS for all users including the owner. Corrections require auditable reversal transactions.
