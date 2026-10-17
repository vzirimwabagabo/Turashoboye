import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { syncManager } from '../../lib/offline/syncManager';

export default function SyncStatusBar() {
  const [syncState, setSyncState] = useState(syncManager.getState());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    await syncManager.syncPendingOperations();
  };

  return (
    <div>
      {/* 1. Full-width banner when device is offline */}
      {!syncState.isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
            <span>
              <strong>Offline Mode (Mahama field depot):</strong> Changes are saved locally in
              secure IndexedDB storage and will queue for synchronization when internet returns.
            </span>
          </div>
          {syncState.pendingCount > 0 && (
            <span className="rounded bg-amber-700/60 px-2 py-0.5 text-[11px] font-semibold">
              {syncState.pendingCount} pending upload
            </span>
          )}
        </div>
      )}

      {/* 2. Top notification when online but has pending sync items or errors */}
      {syncState.isOnline && syncState.pendingCount > 0 && (
        <div className="bg-blue-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <RefreshCw
              className={`h-4 w-4 shrink-0 ${syncState.isSyncing ? 'animate-spin' : ''}`}
            />
            <span>
              {syncState.isSyncing
                ? `Synchronizing ${syncState.pendingCount} record(s) to cloud database...`
                : `${syncState.pendingCount} offline transaction(s) ready to sync.`}
            </span>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncState.isSyncing}
            className="rounded bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-bold transition disabled:opacity-50"
          >
            {syncState.isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* 3. Sync Error alert if any */}
      {syncState.lastError && (
        <div className="bg-red-600 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Sync warning: {syncState.lastError}</span>
          </div>
          <button
            onClick={handleManualSync}
            className="underline font-bold text-[11px] hover:text-red-100"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact pill component for desktop & mobile headers
 */
export function SyncHeaderPill() {
  const [syncState, setSyncState] = useState(syncManager.getState());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="flex items-center gap-2">
      {syncState.isOnline ? (
        <div
          className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700 border border-green-200"
          title={
            syncState.lastSyncedAt
              ? `Connected. Last sync: ${syncState.lastSyncedAt.toLocaleTimeString()}`
              : 'Online and connected'
          }
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <Wifi className="h-3 w-3" />
          <span>Online</span>
          {syncState.pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-green-200 px-1.5 py-0.2 text-[10px] font-bold text-green-800">
              {syncState.pendingCount}
            </span>
          )}
        </div>
      ) : (
        <div
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200"
          title="Offline mode. Operations queued in local storage."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
          {syncState.pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-200 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
              {syncState.pendingCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
