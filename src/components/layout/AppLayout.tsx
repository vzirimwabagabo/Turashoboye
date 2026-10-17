import { useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children?: ReactNode;
}

/**
 * Main application layout.
 * - Mobile: top header bar with hamburger + brand name, content below
 * - Desktop: fixed sidebar on left, content fills remaining space
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Mobile top header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
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
        </header>

        {/* Page content rendered by children or nested routes */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
}
