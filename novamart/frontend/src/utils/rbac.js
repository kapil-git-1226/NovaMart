// Role IDs from the database
// 1 = regional_admin | 2 = store_manager | 3 = inventory_supervisor | 4 = sales_associate

export const ROLES = {
  REGIONAL_ADMIN:       1,
  STORE_MANAGER:        2,
  INVENTORY_SUPERVISOR: 3,
  SALES_ASSOCIATE:      4,
};

export function getUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

export function getRoleId() {
  return getUser().role_id || 0;
}

// Sidebar visibility
export const canSeeDashboard  = (r) => [1, 2].includes(r);
export const canSeeInventory  = (r) => [1, 2, 3, 4].includes(r);
export const canSeePOS        = (r) => [1, 2, 4].includes(r);
export const canSeeReceipts   = (r) => [1, 2, 4].includes(r);
export const canSeeAI         = (r) => [1, 2, 3, 4].includes(r);

// Inventory action permissions
export const canAddProduct    = (r) => [1, 2, 3].includes(r);
export const canEditProduct   = (r) => [1, 2, 3].includes(r);
export const canDeleteProduct = (r) => [1, 2].includes(r);
export const canAdjustStock   = (r) => [1, 2, 3].includes(r);
