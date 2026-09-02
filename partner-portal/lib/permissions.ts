export const PORTAL_PERMISSIONS = {
  CAN_VIEW_APPLICATIONS: true,
  CAN_CREATE_APPLICATION: true,
  CAN_VIEW_AMOUNT: true,
  CAN_VIEW_NOTES: true,
} as const;

export type PermissionKey = keyof typeof PORTAL_PERMISSIONS;

export function hasPermission(permission: PermissionKey): boolean {
  return PORTAL_PERMISSIONS[permission] ?? false;
}
