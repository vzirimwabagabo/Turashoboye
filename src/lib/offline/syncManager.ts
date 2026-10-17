// src/lib/offline/syncManager.ts
/**
 * Offline Sync Manager for Turashoboye Feeds.
 * Manages background queue synchronization to Supabase, connectivity listening,
 * and conflict mitigation for field operations in Mahama.
 */
import { supabase } from '../supabase';
import {
  getSyncQueue,
  updateSyncOperation,
  removeSyncOperation,
} from './db';
import type { SyncOperation } from '../../types/database';

export type SyncStatusListener = (status: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastError: string | null;
}) => void;

class SyncManager {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing = false;
  private pendingCount = 0;
  private lastSyncedAt: Date | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncStatusListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.syncPendingOperations();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Update count on start
      this.refreshPendingCount();
    }
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  public async refreshPendingCount(): Promise<number> {
    try {
      const queue = await getSyncQueue();
      const pending = queue.filter((op) => op.status === 'pending' || op.status === 'failed');
      this.pendingCount = pending.length;
      this.notify();
      return this.pendingCount;
    } catch {
      return 0;
    }
  }

  /**
   * Process all pending synchronization operations sequentially.
   */
  public async syncPendingOperations(): Promise<{ succeeded: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { succeeded: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    let succeeded = 0;
    let failed = 0;

    try {
      const queue = await getSyncQueue('pending');

      for (const op of queue) {
        try {
          await updateSyncOperation(op.id, { status: 'syncing' });
          await this.dispatchOperation(op);
          await removeSyncOperation(op.id);
          succeeded++;
        } catch (err: unknown) {
          failed++;
          const message = err instanceof Error ? err.message : 'Sync execution failed';
          this.lastError = message;
          await updateSyncOperation(op.id, {
            status: 'failed',
            errorMessage: message,
          });
          console.warn(`Sync failed for operation ${op.id} (${op.operationType}):`, err);
        }
      }

      this.lastSyncedAt = new Date();
    } catch (err: unknown) {
      this.lastError = err instanceof Error ? err.message : 'Sync process failed';
    } finally {
      this.isSyncing = false;
      await this.refreshPendingCount();
    }

    return { succeeded, failed };
  }

  /**
   * Dispatch a specific offline operation to the remote Supabase PostgreSQL database.
   */
  private async dispatchOperation(op: SyncOperation): Promise<void> {
    const { operationType, payload } = op;

    switch (operationType) {
      case 'create_customer': {
        const { error } = await supabase.from('customers').insert({
          id: op.id, // client generated UUID
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          preferred_contact: payload.preferredContact,
        });
        if (error) throw new Error(error.message);
        break;
      }

      case 'create_order': {
        const { error } = await supabase.rpc('record_sale_transaction', {
          p_customer_id: payload.customerId,
          p_location_id: payload.locationId,
          p_order_items: payload.items,
          p_payment: payload.payment || null,
          p_notes: payload.notes || null,
        });
        if (error) throw new Error(error.message);
        break;
      }

      case 'record_payment': {
        const { error } = await supabase.from('payments').insert({
          order_id: payload.orderId,
          method: payload.method,
          amount_rwf: payload.amountRwf,
          payment_date: payload.paymentDate || new Date().toISOString().slice(0, 10),
          reference: payload.reference,
          status: 'confirmed',
          is_offline_recorded: true,
          idempotency_key: op.id,
        });
        if (error) throw new Error(error.message);
        break;
      }

      case 'create_batch': {
        if (payload.action === 'complete') {
          const { error } = await supabase.rpc('complete_production_batch', {
            p_batch_id: payload.batchId,
            p_actual_output_qty: payload.actualOutputQty,
            p_location_id: payload.locationId,
            p_notes: payload.notes,
          });
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase.from('production_batches').insert(payload);
          if (error) throw new Error(error.message);
        }
        break;
      }

      default:
        console.warn(`Unrecognized sync operation type: ${operationType}`);
    }
  }
}

export const syncManager = new SyncManager();
