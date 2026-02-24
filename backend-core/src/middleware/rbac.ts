import { Request, Response, NextFunction } from 'express';
import { sendError, ErrorCodes } from '../utils/response';

export type Permission =
  // Users
  | 'users:read' | 'users:write' | 'users:delete'
  // Patients
  | 'patients:read' | 'patients:write' | 'patients:delete'
  // Appointments
  | 'appointments:read' | 'appointments:write' | 'appointments:delete'
  // Prescriptions / EMR
  | 'prescriptions:read' | 'prescriptions:write'
  | 'emr:read' | 'emr:write'
  // Pharmacy
  | 'pharmacy:read' | 'pharmacy:write' | 'pharmacy:dispense' | 'pharmacy:manage'
  // Lab
  | 'lab:read' | 'lab:write' | 'lab:process' | 'lab:upload'
  // Admin
  | 'admin:tenants' | 'admin:reports' | 'admin:settings'
  // Billing
  | 'billing:read' | 'billing:write'
  // Wards
  | 'wards:read' | 'wards:write';

// Role → Permissions mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'users:read', 'users:write', 'users:delete',
    'patients:read', 'patients:write', 'patients:delete',
    'appointments:read', 'appointments:write', 'appointments:delete',
    'prescriptions:read', 'prescriptions:write',
    'emr:read', 'emr:write',
    'pharmacy:read', 'pharmacy:write', 'pharmacy:dispense', 'pharmacy:manage',
    'lab:read', 'lab:write', 'lab:process', 'lab:upload',
    'admin:tenants', 'admin:reports', 'admin:settings',
    'billing:read', 'billing:write',
    'wards:read', 'wards:write',
  ],
  ADMIN: [
    'users:read', 'users:write',
    'patients:read', 'patients:write',
    'appointments:read', 'appointments:write',
    'prescriptions:read', 'prescriptions:write',
    'emr:read', 'emr:write',
    'pharmacy:read', 'pharmacy:write', 'pharmacy:manage',
    'lab:read', 'lab:write', 'lab:process', 'lab:upload',
    'admin:reports', 'admin:settings',
    'billing:read', 'billing:write',
    'wards:read', 'wards:write',
  ],
  DOCTOR: [
    'patients:read', 'patients:write',
    'appointments:read', 'appointments:write',
    'prescriptions:read', 'prescriptions:write',
    'emr:read', 'emr:write',
    'lab:read', 'lab:write',
    'billing:read',
    'wards:read',
  ],
  PHARMACIST: [
    'patients:read',
    'prescriptions:read',
    'pharmacy:read', 'pharmacy:write', 'pharmacy:dispense', 'pharmacy:manage',
    'billing:read', 'billing:write',
  ],
  LAB_TECH: [
    'patients:read',
    'lab:read', 'lab:write', 'lab:process', 'lab:upload',
    'billing:read',
  ],
  NURSE: [
    'patients:read', 'patients:write',
    'appointments:read', 'appointments:write',
    'prescriptions:read',
    'emr:read',
    'wards:read', 'wards:write',
    'billing:read',
  ],
  RECEPTIONIST: [
    'patients:read', 'patients:write',
    'appointments:read', 'appointments:write',
    'billing:read', 'billing:write',
  ],
  PATIENT: [
    'patients:read',
    'appointments:read',
    'prescriptions:read',
    'lab:read',
    'emr:read',
    'billing:read',
  ],
};

export const hasPermission = (role: string, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const authorize = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
      return;
    }

    const userRole = req.user.role;
    const hasAll = permissions.every((p) => hasPermission(userRole, p));

    if (!hasAll) {
      sendError(
        res,
        ErrorCodes.FORBIDDEN,
        `Insufficient permissions. Required: ${permissions.join(', ')}`,
        403
      );
      return;
    }

    next();
  };
};

// Role-based guard
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, ErrorCodes.FORBIDDEN, 'Insufficient role', 403);
      return;
    }

    next();
  };
};
