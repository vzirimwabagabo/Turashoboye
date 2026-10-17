# Turashoboye Feeds — Offline-First & Synchronization Design

## 1. Operating Context & Design Challenge
In the Mahama region of Kirehe District, cellular connectivity can be intermittent or degraded. Staff must be able to conduct vital daily tasks—receiving raw grain, logging grinding runs, issuing customer sales slips, and collecting cash—without being blocked by connectivity outages.

---

## 2. Technical Synchronization Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Mobile Browser (Client)              │
│                                                        │
│  [IndexedDB Cache]             [IndexedDB Queue]       │
│  - Categories, Products        - sync_operations:      │
│  - Active Units & Locations      * client_id (UUID)    │
│  - Customers & Formulas          * op_type (string)    │
│  - Best-Effort Local Stock       * payload (JSON)      │
│                                  * status (enum)       │
└───────────────────────────┬────────────────────────────┘
                            │
               Online / Focus / Manual Event
                            ▼
┌────────────────────────────────────────────────────────┐
│             Server Synchronization Engine              │
│               (Supabase Edge Functions / RPC)          │
│                                                        │
│  1. Idempotency Check (Filter existing op IDs)         │
│  2. Dependency Sort (Customers -> Orders -> Payments)   │
│  3. Atomic Transaction per item (FOR UPDATE lock)      │
│  4. Revalidate Stock & Reject / Flag Oversell          │
│  5. Return Detailed Status: { success, error, conflict} │
└────────────────────────────────────────────────────────┘
```

---

## 3. Approved Offline Workflows

| Workflow | Offline Allowed? | Immediate Effect Offline | Server Confirmation Action |
|---|:---:|---|---|
| **Ingredient Receipt** | ✅ | Generates local lot code, updates local stock preview | Allocates official server lot record, posts receipt movement |
| **Production Run** | ✅ | Records ingredient consumption & finished yield | Executes `complete_production_batch()`, posts atomic movements |
| **Stock Count** | ✅ | Stores physical count snapshot | Computes variance against ledger, drafts adjustments |
| **Draft / Sales Order** | ✅ | Generates receipt slip with local order number | Re-validates live stock, deducts inventory, locks batch trace |
| **Cash Payment Entry** | ✅ | Flags as `offline_cash_reported` | Idempotently settles order balance, links to staff profile |
| **Customer Registration**| ✅ | Saves customer profile locally | Inserts record, checks for duplicate phone number |

---

## 4. Conflict Resolution & Invariants

1. **Server Authority:** The server is the sole arbiter of consolidated stock. An offline device displays a *best-effort stock estimate* based on locally cached events.
2. **Preventing Silent Oversell:** If two disconnected devices sell the same stock resulting in negative physical inventory, the server rejects the conflicting transaction, sets status to `conflict`, and alerts the Manager to perform an emergency stock reconciliation.
3. **Idempotency Guarantee:** Every action receives a client UUID before leaving the device. Retried requests never duplicate payments or ledger movements.
4. **Queue Resilience:** The queue is durable across tab reloads, browser crashes, and mobile sleep states.
