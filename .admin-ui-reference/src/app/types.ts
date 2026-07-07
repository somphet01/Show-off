export type UserRole = "owner" | "staff";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  lastLogin: string;
  avatar?: string;
}

export type OrderStatus = "pending" | "awaiting_payment_slip" | "awaiting_confirmation" | "paid" | "cancelled";
export type PaymentStatus = "waiting_slip" | "pending_review" | "paid" | "rejected" | "cancelled";
export type ShippingStatus = "not_shipped" | "shipping" | "delivered";
export type OrderChannel = "web" | "chat" | "walk-in";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface ShippingDocument {
  url: string;
  path?: string;
  name?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: OrderChannel;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  paymentCurrency: "LAK" | "THB";
  exchangeRate?: number;
  paymentAmount?: number;
  paymentMethod: string;
  slipImage?: string;
  paymentSlipId?: string;
  slipAmount?: number;
  slipUploadTime?: string;
  rejectReason?: string;
  carrier?: string;
  trackingNumber?: string;
  shippingDocuments?: ShippingDocument[];
  shippedDate?: string;
  deliveredDate?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  event: string;
  detail?: string;
  createdAt: string;
  by: string;
}

export type ProductStatus = "active" | "hidden" | "archived";

export interface ProductVariant {
  id: string;
  sku: string;
  sizeLabel: string;
  colorName: string;
  colorHex: string;
  optionLabel: string;
  salePrice: number;
  costPrice: number;
  stock: number;
  minimumStock: number;
  status: "active" | "inactive";
}

export interface Product {
  id: string;
  nameTh: string;
  nameEn: string;
  nameLo?: string;
  sku: string;
  slug: string;
  category: string;
  status: ProductStatus;
  descriptionEn?: string;
  descriptionLo?: string;
  images: { id: string; url: string; isPrimary: boolean; altText: string }[];
  variants: ProductVariant[];
  salePrice: number;
  costPrice: number;
  stock: number;
  minimumStock: number;
  createdAt: string;
}

export type StockMovementType = "order_paid" | "po_received" | "manual_adjustment" | "order_cancelled";

export interface StockMovement {
  id: string;
  type: StockMovementType;
  productName: string;
  sku: string;
  variant: string;
  quantityDelta: number;
  stockAfter: number;
  referenceType: "order" | "purchase_order" | "manual";
  referenceId: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export type CustomerType = "retail" | "wholesale" | "vip";

export interface CustomerAddress {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  social?: string;
  type: CustomerType;
  isVip: boolean;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  addresses: CustomerAddress[];
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  refNo: string;
  category: "product_cost" | "shipping" | "ads" | "packaging" | "rent" | "salary" | "other";
  description: string;
  amount: number;
  relatedPOId?: string;
  createdAt: string;
}

export type PurchaseOrderStatus = "draft" | "ordered" | "in_transit" | "received" | "closed";

export interface PurchaseOrderItem {
  id: string;
  productName: string;
  sku: string;
  variant: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  supplierContact: string;
  status: PurchaseOrderStatus;
  currency: "LAK" | "THB" | "CNY" | "USD";
  exchangeRate: number;
  items: PurchaseOrderItem[];
  subtotal: number;
  shippingCost: number;
  otherCost: number;
  totalCost: number;
  notes?: string;
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
  createdAt: string;
  timeline: TimelineEvent[];
}

export type CouponStatus = "active" | "inactive" | "expired" | "usage_limit_reached";

export interface Coupon {
  id: string;
  code: string;
  status: CouponStatus;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  minimumOrderAmount: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  expiresAt: string;
  createdAt: string;
}

export type AlertPriority = "normal" | "warning" | "critical";
export type NotificationType =
  | "new_order"
  | "awaiting_slip"
  | "slip_rejected"
  | "payment_approved"
  | "low_stock"
  | "out_of_stock"
  | "po_received"
  | "shipping_update"
  | "system_warning"
  | "announcement";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: AlertPriority;
  isRead: boolean;
  relatedLink?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  role: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt: string;
}

export type PageKey =
  | "login"
  | "dashboard"
  | "orders"
  | "order-detail"
  | "create-order"
  | "products"
  | "create-product"
  | "edit-product"
  | "website-editor"
  | "inventory"
  | "stock-movement"
  | "stock-adjustment"
  | "customers"
  | "customer-detail"
  | "financials"
  | "expenses"
  | "purchase-orders"
  | "create-purchase-order"
  | "purchase-order-detail"
  | "coupons"
  | "create-coupon"
  | "notifications"
  | "activity-logs"
  | "settings";
