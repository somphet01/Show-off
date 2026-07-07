import { AppProvider, useApp } from "./context";
import { Layout } from "./components/layout/Layout";
import { LoginPage } from "./components/pages/LoginPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { OrdersListPage } from "./components/pages/OrdersListPage";
import { OrderDetailPage } from "./components/pages/OrderDetailPage";
import { CreateOrderPage } from "./components/pages/CreateOrderPage";
import { ProductsListPage } from "./components/pages/ProductsListPage";
import { CreateEditProductPage } from "./components/pages/CreateEditProductPage";
import { WebsiteEditorPage } from "./components/pages/WebsiteEditorPage";
import { InventoryPage } from "./components/pages/InventoryPage";
import { StockMovementPage } from "./components/pages/StockMovementPage";
import { StockAdjustmentPage } from "./components/pages/StockAdjustmentPage";
import { CustomersListPage } from "./components/pages/CustomersListPage";
import { CustomerDetailPage } from "./components/pages/CustomerDetailPage";
import { FinancialOverviewPage } from "./components/pages/FinancialOverviewPage";
import {
  PurchaseOrdersListPage,
  CreatePurchaseOrderPage,
  PurchaseOrderDetailPage
} from "./components/pages/PurchaseOrdersPage";
import { CouponsListPage, CreateEditCouponPage } from "./components/pages/CouponsPage";
import { NotificationsPage } from "./components/pages/NotificationsPage";
import { ActivityLogsPage } from "./components/pages/ActivityLogsPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { AdminFeedbackProvider } from "./components/ui/AdminFeedback";

function AppContent() {
  const { currentPage, isLoggedIn, selectedId } = useApp();

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <DashboardPage />;
      case "orders": return <OrdersListPage />;
      case "order-detail": return <OrderDetailPage />;
      case "create-order": return <CreateOrderPage />;
      case "products": return <ProductsListPage />;
      case "create-product":
      case "edit-product": return <CreateEditProductPage key={`${currentPage}-${selectedId ?? "new"}`} />;
      case "website-editor": return <WebsiteEditorPage />;
      case "inventory": return <InventoryPage />;
      case "stock-movement": return <StockMovementPage />;
      case "stock-adjustment": return <StockAdjustmentPage />;
      case "customers": return <CustomersListPage />;
      case "customer-detail": return <CustomerDetailPage />;
      case "financials":
      case "expenses": return <FinancialOverviewPage />;
      case "purchase-orders": return <PurchaseOrdersListPage />;
      case "create-purchase-order": return <CreatePurchaseOrderPage />;
      case "purchase-order-detail": return <PurchaseOrderDetailPage />;
      case "coupons": return <CouponsListPage />;
      case "create-coupon": return <CreateEditCouponPage />;
      case "notifications": return <NotificationsPage />;
      case "activity-logs": return <ActivityLogsPage />;
      case "settings": return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AdminFeedbackProvider>
        <AppContent />
      </AdminFeedbackProvider>
    </AppProvider>
  );
}
