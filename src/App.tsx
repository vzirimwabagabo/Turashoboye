import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import PublicLayout from './components/public/PublicLayout';

// Public customer-facing pages
import HomePage from './pages/public/HomePage';
import CataloguePage from './pages/public/CataloguePage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';
import CustomerPortalPage from './pages/customer/CustomerPortalPage';

// Authenticated staff & management pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/products/ProductsPage';
import InventoryPage from './pages/inventory/InventoryPage';
import LotsPage from './pages/inventory/LotsPage';
import SuppliersPage from './pages/procurement/SuppliersPage';
import PurchaseOrdersPage from './pages/procurement/PurchaseOrdersPage';
import BatchesPage from './pages/production/BatchesPage';
import FormulasPage from './pages/production/FormulasPage';
import TraceabilityPage from './pages/production/TraceabilityPage';
import OrdersPage from './pages/sales/OrdersPage';
import CustomersPage from './pages/sales/CustomersPage';
import CompliancePage from './pages/compliance/CompliancePage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import TrendsPage from './pages/admin/TrendsPage';
import UsersPage from './pages/admin/UsersPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserRole } from './types/database';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public customer-facing website */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/catalogue/:slug" element={<ProductDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/portal" element={<CustomerPortalPage />} />
            <Route path="/my-orders" element={<CustomerPortalPage />} />
          </Route>

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Staff Management Operations */}
          <Route
            element={
              <ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.MANAGER, UserRole.SALES_STAFF, UserRole.INVENTORY]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/lots" element={<LotsPage />} />
            <Route path="/procurement/orders" element={<PurchaseOrdersPage />} />
            <Route path="/procurement/suppliers" element={<SuppliersPage />} />
            <Route path="/production" element={<BatchesPage />} />
            <Route path="/production/formulas" element={<FormulasPage />} />
            <Route path="/production/traceability" element={<TraceabilityPage />} />
            <Route path="/sales" element={<OrdersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
