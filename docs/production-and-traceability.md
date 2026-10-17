# Turashoboye Feeds — Production & Traceability Engine

## 1. Traceability Standard & Industry Guidance
Turashoboye Feeds adheres to the principles of the **FAO Good Practices for the Feed Industry** and the **GS1 Global Traceability Standard**, adapted for an agile agro-processing enterprise in Rwanda.

The core objective is complete bidirectional traceability:
- **Backward Traceability:** From a bag of feed in a customer's hands back to the exact production batch, down to the specific ingredient lots, suppliers, and delivery dates.
- **Forward Traceability:** From a compromised supplier raw material lot forward to every production batch that consumed it, down to the customer orders dispatched and remaining warehouse inventory.

---

## 2. Production Lifecycle & Batch State Machine

```
   [ Planned ]
        │  (Operator starts grinding / mixing)
        ▼
 [ In Progress ]
        │  (Input quantities weighed and logged)
        │  (Finished yield bagged and weighed)
        ▼
 [ Quality Check ] ──────(Quality Concern)──────► [ Held ]
        │                                            │ (Investigation & Hold Release)
        │ (Passed QA)                                ▼
        ▼                                      [ Released ]
 [ Completed ]
        │
        ├─► Deduct Ingredient Lots (Negative Inventory Movements)
        └─► Add Finished Feed (Positive Inventory Movement)
```

---

## 3. Reconciling Inputs, Outputs & Losses

For every production run:
$$\text{Loss Qty} = \max(\text{Planned Output} - \text{Actual Output}, 0)$$
$$\text{Loss \%} = \left(\frac{\text{Loss Qty}}{\text{Planned Output}}\right) \times 100$$

- **Configurable Warning Threshold:** A threshold of $5.0\%$ is pre-set in `settings`. If the loss exceeds $5.0\%$, the system flags a visual variance warning to the supervisor to check for mill spillage, moisture loss, or machine calibration issues.
- **Atomic Execution:** Handled via PostgreSQL function `complete_production_batch(batch_id, actual_output, location_id)`.

---

## 4. Traceability Queries

### 4.1 Upstream: Batch to Ingredients
```sql
SELECT 
    b.batch_number,
    b.planned_output_qty,
    b.actual_output_qty,
    l.lot_number,
    s.name AS supplier_name,
    bi.quantity_used,
    u.name AS unit_name
FROM public.production_batches b
JOIN public.production_batch_inputs bi ON bi.batch_id = b.id
JOIN public.ingredient_lots l ON l.id = bi.lot_id
JOIN public.suppliers s ON s.id = l.supplier_id
JOIN public.product_variants pv ON pv.id = l.variant_id
JOIN public.units_of_measure u ON u.id = pv.unit_id
WHERE b.batch_number = 'BATCH-20261017-001';
```

### 4.2 Downstream: Lot to Dispatched Customers
```sql
SELECT 
    l.lot_number,
    b.batch_number,
    so.order_number,
    c.name AS customer_name,
    c.phone AS customer_phone,
    soi.quantity AS quantity_sold,
    so.order_date
FROM public.ingredient_lots l
JOIN public.production_batch_inputs bi ON bi.lot_id = l.id
JOIN public.production_batches b ON b.id = bi.batch_id
JOIN public.sales_order_items soi ON soi.batch_id = b.id
JOIN public.sales_orders so ON so.id = soi.order_id
JOIN public.customers c ON c.id = so.customer_id
WHERE l.lot_number = 'LOT-SOYA-20261017-01';
```
