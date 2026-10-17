# Turashoboye Feeds — Requirements Specification

## 1. Executive Summary & Business Mission
Turashoboye Feeds operates in the Mahama refugee camp area of Kirehe District, Eastern Province, Rwanda. The business purchases raw feed ingredients (grains, soya, minerals, bran), grinds and mixes them, and sells finished animal feeds (poultry, pig, cattle) directly to local farmers, co-operatives, and community households.

The platform is an **operational management system** built mobile-first, designed for low-connectivity environments with staff-assisted sales, full batch traceability, immutable inventory ledgers, and regulatory compliance with Rwandan authorities (RSB, RICA, RRA).

---

## 2. Core Functional Requirements

### 2.1 Public Catalogue & Business Profile
- Responsive public website detailing feed types, packaging options, and verified company information.
- Product search, filtering by target animal (poultry, pig, cattle), packaging units, and live retail pricing (in whole RWF).
- Contact and ordering channels for telephone, walk-in, and messaging.
- Public visitors cannot see internal cost prices, formulation margins, private customer records, or internal inventory ledgers.

### 2.2 Inventory Management
- **Source of truth:** Append-only `inventory_movements` ledger with movement types:
  - `opening_balance`, `receipt`, `consumption`, `production_output`, `sale`, `adjustment`, `return`, `damage`, `transfer`.
- Computed views for live physical stock and available-to-sell stock (excluding held or rejected lots/batches).
- Strict disallowance of negative inventory.
- Reason required for any stock adjustment; adjustments $\ge 100\text{ kg}$ (configurable) require explicit Manager approval.

### 2.3 Ingredient Procurement & Goods Receiving
- Supplier records with Rwanda TIN, contact info, and optional GS1 GLN.
- Purchase orders (PO) separate from physical receipts.
- Goods receipts generate unique human-readable lot numbers (e.g. `LOT-SOYA-20261017-01`) and record supplier batch details, expiry dates, and QA acceptance.
- Receiving goods increases inventory atomically via movement ledger.

### 2.4 Production, Formulations & Traceability
- Version-controlled feed recipes with immutable historical versions once used in production.
- Unique internal batch ID and human-readable batch code (e.g. `BATCH-20261017-001`) for every production run.
- Recording of planned output, actual output, process loss, and loss percentage.
- Configurable $5.0\%$ production loss variance warning.
- Backward traceability: finished feed $\rightarrow$ production batch $\rightarrow$ ingredient lot $\rightarrow$ supplier PO.
- Forward traceability: ingredient lot $\rightarrow$ production batch $\rightarrow$ sales order $\rightarrow$ customer.
- Quality holds that immediately exclude affected stock from available sales.

### 2.5 Sales, Orders & Payments
- Staff-assisted customer registration (name, phone, address, sector).
- Sales order creation with batch allocation and stock validation.
- Atomically deducts stock from movement ledger upon confirmation.
- Payment recording: cash (immediately confirmed), Mobile Money / MTN MoMo (reference recorded), bank transfer.
- Offline cash entries tracked as staff-reported cash; idempotent payments with UUID keys prevent duplicate charges.
- Financial figures kept distinct: Order Total, Amount Received, Outstanding Balance.

### 2.6 Offline Synchronization
- IndexedDB local storage and persistent operations queue for offline operation.
- Unique client-generated UUID for each operation before saving.
- Synchronization upon reconnect, window focus, and manual trigger.
- Idempotent server-side validation; conflicts surfaced for explicit staff resolution.

### 2.7 Rwanda Regulatory & Compliance Module
- Configurable compliance records supporting RICA (licences), RSB (product registration/standards), RDB (incorporation), and RRA (tax compliance).
- Document attachment via Cloudinary with authenticated, restricted delivery for private certificates.
- Expiry date tracking and proactive reminders.

---

## 3. Non-Functional Requirements
- **Mobile-first:** Optimized for touchscreens, 3G/4G bandwidth, and affordable smartphones.
- **Security:** PostgreSQL Row Level Security (RLS) on 100% of tables. TOTP MFA for managers/owners.
- **Financial precision:** Rwandan Franc (RWF) stored as integer whole units.
- **Auditability:** Immutable audit log table recording user actions, timestamps, and resource identifiers.
- **Data retention:** 10-year retention baseline for financial, accounting, and linked batch-traceability records.
