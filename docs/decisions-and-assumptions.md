# Turashoboye Feeds — Decisions & Assumptions Log

This document records architectural, business, and regulatory decisions confirmed by the founder and project leadership.

---

## 1. Confirmed Decisions Log

| Decision ID | Area | Decision Summary | Rationale / Source |
|---|---|---|---|
| **DEC-001** | Currency | Rwandan Franc (RWF) stored as integer whole francs, paired with `currency_code = 'RWF'`. | Avoid floating-point rounding errors and premature sub-unit complexity. |
| **DEC-002** | Locations | Launch with a single active location (`DEPOT-MAHAMA-01`), but include `location_id` in all schema records from Day 1. | Minimizes launch complexity while ensuring future multi-warehouse expansion requires zero schema changes. |
| **DEC-003** | Record Retention | 10-year baseline retention for financial, accounting, and linked batch-traceability records. | Aligns with Rwanda Revenue Authority (RRA) Tax Procedure Law. |
| **DEC-004** | Offline Scope | Receipts, production records, stock counts, draft orders, customer records, and recorded cash payments are offline-enabled. | Ensures continuity on shop/mill floor during network degradation in Mahama. |
| **DEC-005** | Production Loss | Configurable $5.0\%$ variance warning threshold for production batches. | Based on operational guidance for small-scale feed milling and grinding. |
| **DEC-006** | Identification | Local UUIDs for all primary keys; separate human-readable lot (`LOT-...`) and batch (`BATCH-...`) numbers; optional GS1 GTIN/GLN fields. | Guarantees offline uniqueness while maintaining readable warehouse labels and future GS1 readiness. |
| **DEC-007** | Inventory Adjustments | Every manual stock adjustment requires a documented reason; adjustments $\ge 100\text{ kg}$ require Manager authorization; negative inventory strictly blocked. | Prevents inventory shrinkage, theft concealment, and data corruption. |
| **DEC-008** | Authentication & MFA | Authenticator-app TOTP MFA for Manager and Owner roles. SMS is not default. | Strong cryptographic security without dependency on cellular SMS gateways. |
| **DEC-009** | Media Limits | WebP format targeting $< 500\text{ KB}$ with $2\text{ MB}$ hard ceiling for product images. Separate private allowlist for compliance PDFs. | Keeps mobile bandwidth consumption low while preserving document legibility. |
| **DEC-010** | Cash Payments | Offline cash recorded as staff-reported; idempotent UUID key prevents duplicate ledger entries. | Provides accounting clarity between cash held by staff vs verified bank/MoMo deposits. |

---

## 2. Open Assumptions Under Ongoing Review
1. **Feed Formulation Ownership:** Feed formulations are supplied and validated by Turashoboye agricultural experts; the software never fabricates nutritional claims or feed recipes.
2. **GS1 National Mandate:** GS1 barcodes are currently optional for domestic local sales in Rwanda, but standard fields are included for future export or supermarket supply chains.
3. **Specific RICA/RSB Fees:** Fee structures and periodic inspection renewal schedules for animal feed operators will be updated in `regulatory_records` upon verification with Kirehe District agricultural officers.
