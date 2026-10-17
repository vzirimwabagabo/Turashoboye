# Turashoboye Feeds — Testing Strategy & Acceptance Criteria

The platform is verified against strict end-to-end operational and security scenarios. A feature is not complete until its corresponding criteria pass.

---

## 1. Acceptance Verification Checklist

1. **Product Creation & Publication:**
   - Manager can create a product with multiple package variants (e.g. 50kg bag, 25kg bag) and upload a Cloudinary image.
   - Public visitor can see the published product in the catalogue, but cannot see `cost_rwf` or edit data.
2. **Goods Receipt & Lot Tracking:**
   - Inventory staff can log a supplier PO receipt, creating an `ingredient_lot` and generating an `inventory_movements` entry of type `receipt`.
3. **Atomic Production Run:**
   - Manager executes a production batch consuming 2 ingredient lots and producing finished poultry feed.
   - Database atomically logs consumption and output movements.
   - 5% loss threshold warning triggers if loss exceeds $5\%$.
4. **Sales Order & Oversell Prevention:**
   - Sales staff creates an order for 10 bags of feed.
   - Inventory decreases by exactly 10 bags.
   - If a concurrent transaction requests more bags than available in `view_stock_on_hand`, the transaction fails with an explicit error.
5. **Idempotent Payment Recording:**
   - Recording a cash or MoMo payment with a duplicated `idempotency_key` is safely rejected without creating duplicate credit.
6. **Immutable Ledger & Reversal:**
   - Any attempt to run direct `DELETE` or `UPDATE` on `inventory_movements` or `audit_logs` is rejected by PostgreSQL RLS with a permission error.
   - An inventory adjustment can only be posted by providing a mandatory reason.
7. **Quality Hold & Quarantine:**
   - Marking a production batch as `held` removes its output from `available_to_sell_qty` in `view_stock_on_hand` while preserving physical count.
8. **Bidirectional Traceability Query:**
   - Given a batch number, system returns all consumed ingredient lots.
   - Given an ingredient lot number, system lists all customer orders that received feed containing that ingredient.
9. **Offline Synchronization:**
   - Disconnecting network, recording an offline cash sale, and reconnecting triggers automatic synchronization, posting the sale idempotently to the server.
10. **Database Backup & Restoration Test:**
    - Taking a `pg_dump` backup, restoring it into a test schema, and verifying row counts and balances match $100\%$.
