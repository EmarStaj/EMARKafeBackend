export const AuditActorType = {
  ADMIN: 'admin',
  BARISTA: 'barista',
  MANAGER: 'branch_manager',
  CUSTOMER: 'customer',
  SYSTEM: 'system',
  GUEST: 'guest'
} as const;

export type AuditActorType = typeof AuditActorType[keyof typeof AuditActorType];

export const AuditStatus = {
  SUCCESS: 'success',
  FAILURE: 'failure'
} as const;

export type AuditStatus = typeof AuditStatus[keyof typeof AuditStatus];

export const AuditEntityType = {
  USER: 'user',
  PRODUCT: 'product',
  CATEGORY: 'category',
  BRANCH: 'branch',
  ORDER: 'order',
  WALLET: 'wallet',
  QR: 'qr'
} as const;

export type AuditEntityType = typeof AuditEntityType[keyof typeof AuditEntityType];

export const AuditAction = {
  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',

  // Menu (Product/Category)
  PRODUCT_CREATE: 'product_create',
  PRODUCT_UPDATE: 'product_update',
  PRODUCT_DELETE: 'product_delete',
  CATEGORY_CREATE: 'category_create',
  CATEGORY_UPDATE: 'category_update',
  CATEGORY_DELETE: 'category_delete',

  // Branch & Stock
  STOCK_UPDATE: 'stock_update',

  // Order
  ORDER_STATUS_UPDATE: 'order_status_update',
  ORDER_CANCEL: 'order_cancel',

  // QR / Checkout
  QR_SCAN: 'qr_scan'
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];
