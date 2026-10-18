// src/types/database.ts
/**
 * Central TypeScript definitions for the Turashoboye Feeds database schema.
 * Types are aligned with Supabase PostgreSQL tables (UUID primary keys, integer monetary values in whole RWF).
 */

/** UUID string type alias */
export type UUID = string;

/** Monetary amount stored as integer whole Rwandan Francs (RWF). e.g., 1250 = RWF 1,250 */
export type Money = number;

/** User role definitions */
export const UserRole = {
  PUBLIC: "public",
  SALES_STAFF: "sales_staff",
  INVENTORY: "inventory",
  MANAGER: "manager",
  OWNER: "owner",
  SUPER_ADMIN: "super_admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Permission resource-action pair */
export interface Permission {
  id: UUID;
  roleId: UUID;
  resource: string;
  action: string;
}

/** Profile (user) */
export interface Profile {
  id: UUID;
  authUserId: string; // Supabase auth uid
  role: UserRole;
  displayName: string;
  fullName?: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  createdAt?: string;
}

/** Category */
export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
}

/** Unit of Measure */
export interface UnitOfMeasure {
  id: UUID;
  name: string;
  abbreviation: string;
  conversionFactorToBase: number; // e.g. base = kg
}

/** Product types */
export const ProductType = {
  FINISHED_FEED: "finished_feed",
  RAW_INGREDIENT: "raw_ingredient",
  PACKAGING: "packaging",
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

/** Product */
export interface Product {
  id: UUID;
  categoryId: UUID;
  name: string;
  slug: string;
  description?: string;
  type: ProductType | string;
  published: boolean;
  createdAt: string; // ISO timestamp
  updatedAt?: string;
}

/** Product variant */
export interface ProductVariant {
  id: UUID;
  productId: UUID;
  sku: string;
  packageSize: string;
  unitId: UUID;
  price: Money; // price per unit in whole RWF
  currencyCode: string; // "RWF"
  cost: Money; // cost per unit in whole RWF (restricted to manager/owner)
  reorderThreshold: number;
  gtin?: string | null;
}

/** Product image */
export interface ProductImage {
  id: UUID;
  productId?: UUID | null;
  variantId?: UUID | null;
  cloudinaryPublicId: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

/** Supplier */
export interface Supplier {
  id: UUID;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  gln?: string;
  createdAt: string;
}

/** Ingredient Lot */
export interface IngredientLot {
  id: UUID;
  variantId: UUID;
  lotNumber: string;
  supplierId: UUID;
  receivedQty: number;
  unitId: UUID;
  expiryDate?: string;
  status: "available" | "depleted" | "held" | "rejected";
  gtin?: string;
  createdAt: string;
}

/** Inventory location */
export interface InventoryLocation {
  id: UUID;
  name: string;
  address?: string;
  isDefault?: boolean;
}

/** Movement type */
export const MovementType = {
  OPENING_BALANCE: "opening_balance",
  RECEIPT: "receipt",
  CONSUMPTION: "consumption",
  PRODUCTION_OUTPUT: "production_output",
  SALE: "sale",
  ADJUSTMENT: "adjustment",
  RETURN: "return",
  DAMAGE: "damage",
  TRANSFER: "transfer",
} as const;
export type MovementType = (typeof MovementType)[keyof typeof MovementType];

/** Inventory movement (immutable append-only ledger) */
export interface InventoryMovement {
  id: UUID;
  variantId: UUID;
  locationId: UUID;
  type: MovementType;
  quantity: number; // positive = stock addition, negative = deduction
  unitId: UUID;
  referenceId?: UUID; // FK to orders/receipts/batches/adjustments
  lotId?: UUID; // FK to ingredient_lots if applicable
  userId: UUID;
  reason?: string;
  createdAt: string;
}

/** Production Formula */
export interface ProductionFormula {
  id: UUID;
  name: string;
  description?: string;
  currentVersion: number;
  createdAt: string;
}

/** Formula Version */
export interface FormulaVersion {
  id: UUID;
  formulaId: UUID;
  versionNumber: number;
  expectedOutputQty: number;
  outputVariantId: UUID;
  approvedBy?: UUID;
  isApproved: boolean;
  createdAt: string;
}

/** Formula Ingredient */
export interface FormulaIngredient {
  id: UUID;
  formulaVersionId: UUID;
  ingredientVariantId: UUID;
  expectedQuantity: number;
  unitId: UUID;
}

/** Production Batch */
export interface ProductionBatch {
  id: UUID;
  batchNumber: string; // Human readable e.g. B-20261017-001
  productVariantId: UUID;
  formulaVersionId?: UUID | null;
  plannedOutputQty: number;
  actualOutputQty?: number;
  lossQty?: number;
  lossPercentage?: number;
  status: "planned" | "in_progress" | "completed" | "held" | "cancelled";
  startedAt?: string;
  completedAt?: string;
  operatorId: UUID;
  supervisorId: UUID;
  notes?: string;
  gtin?: string;
}

/** Quality Check */
export interface QualityCheck {
  id: UUID;
  batchId: UUID;
  inspectorId: UUID;
  checkedAt: string;
  result: "passed" | "failed" | "held";
  notes?: string;
}

/** Customer */
export interface Customer {
  id: UUID;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  preferredContact?: string;
  createdAt: string;
}

/** Order status */
export const OrderStatus = {
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  FULFILLED: "fulfilled",
  CANCELLED: "cancelled",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Sales order */
export interface SalesOrder {
  id: UUID;
  customerId: UUID;
  status: OrderStatus;
  orderDate: string;
  total: Money; // in whole RWF
  currencyCode: string; // "RWF"
  notes?: string;
  createdAt: string;
}

/** Sales order item */
export interface SalesOrderItem {
  id: UUID;
  orderId: UUID;
  variantId: UUID;
  batchId?: UUID; // Batch trace
  quantity: number;
  unitPrice: Money;
  discount?: Money;
}

/** Payment method */
export const PaymentMethod = {
  CASH: "cash",
  MOMO: "momo",
  BANK_TRANSFER: "bank_transfer",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/** Payment status */
export const PaymentStatus = {
  PENDING_VERIFICATION: "pending_verification",
  CONFIRMED: "confirmed",
  FAILED: "failed",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/** Payment */
export interface Payment {
  id: UUID;
  orderId: UUID;
  method: PaymentMethod;
  amount: Money; // in whole RWF
  paymentDate: string;
  reference?: string;
  status: PaymentStatus;
  idempotencyKey?: string;
  recordedBy?: UUID;
  isOfflineRecorded?: boolean;
}

/** Regulatory Record */
export interface RegulatoryRecord {
  id: UUID;
  category: "company" | "premises" | "product_registration" | "standard_certification" | "inspection";
  authority: string; // e.g. "RICA", "RSB"
  referenceNumber: string;
  issueDate?: string;
  expiryDate?: string;
  status: "not_entered" | "pending_verification" | "verified" | "expired" | "not_applicable";
  verifiedBy?: UUID;
  verificationSource?: string;
  notes?: string;
  createdAt: string;
}

/** Audit log */
export interface AuditLog {
  id: UUID;
  userId: UUID;
  action: string;
  resourceType: string;
  resourceId?: UUID;
  detail?: string;
  createdAt: string;
}

/** Offline Sync Operation */
export interface SyncOperation {
  id: UUID; // client generated UUID
  clientId: string; // device UUID
  operationType:
    | "create_receipt"
    | "create_batch"
    | "create_order"
    | "record_payment"
    | "stock_count"
    | "create_customer";
  payload: Record<string, unknown>;
  status: "pending" | "syncing" | "synced" | "failed" | "conflict";
  errorMessage?: string;
  createdAt: string;
  syncedAt?: string;
}
