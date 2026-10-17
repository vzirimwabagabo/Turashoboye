import { useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import SyncStatusBar, { SyncHeaderPill } from './SyncStatusBar';

interface AppLayoutProps {
  children?: ReactNode;
}

/**
 * Main application layout.
 * - Mobile: top header bar with hamburger + brand name + offline status pill
 * - Desktop: fixed sidebar on left, top status bar with sync indicator, content fills remaining space
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:ml-64 overflow-hidden">
        {/* Mobile top header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2E7D32] text-xs font-bold text-white">
                TF
              </div>
              <span className="text-lg font-bold text-gray-900">Turashoboye</span>
            </div>
          </div>

          <SyncHeaderPill />
        </header>

        {/* Desktop top header bar */}
        <header className="hidden lg:flex h-14 items-center justify-between border-b border-gray-200 bg-white px-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span>Operational Depot:</span>
            <span className="font-semibold text-gray-800">Mahama Primary Depot (DEPOT-01)</span>
          </div>
          <div className="flex items-center gap-4">
            <SyncHeaderPill />
          </div>
        </header>

        {/* Offline sync banner */}
        <SyncStatusBar />

        {/* Page content rendered by children or nested routes */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
}
