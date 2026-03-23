import { Action, Actions } from './actions';

export type Role = 'org_admin' | 'compliance_officer' | 'auditor';

export const RBAC_MATRIX: Record<Role, Action[]> = {
  org_admin: [
    Actions.DOCUMENTS_READ,
    Actions.DOCUMENTS_UPLOAD,
    Actions.DOCUMENTS_ANALYZE,
    Actions.REMEDIATIONS_CREATE,
    Actions.REMEDIATIONS_UPDATE,
    Actions.AUDIT_LOG_READ,
    Actions.MEMBERS_MANAGE,
    Actions.REPORTS_EXPORT,
  ],

  compliance_officer: [
    Actions.DOCUMENTS_READ,
    Actions.DOCUMENTS_UPLOAD,
    Actions.DOCUMENTS_ANALYZE,
    Actions.REMEDIATIONS_CREATE,
    Actions.REMEDIATIONS_UPDATE,
    Actions.AUDIT_LOG_READ,
    Actions.REPORTS_EXPORT,
  ],

  auditor: [
    Actions.DOCUMENTS_READ,
    Actions.AUDIT_LOG_READ,
    Actions.REPORTS_EXPORT,
  ],
};

export function canPerform(role: Role, action: Action): boolean {
  return RBAC_MATRIX[role]?.includes(action) ?? false;
}