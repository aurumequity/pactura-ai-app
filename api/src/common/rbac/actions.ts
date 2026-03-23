export const Actions = {
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_UPLOAD: 'documents:upload',
  DOCUMENTS_ANALYZE: 'documents:analyze',
  REMEDIATIONS_CREATE: 'remediations:create',
  REMEDIATIONS_UPDATE: 'remediations:update',
  AUDIT_LOG_READ: 'audit_log:read',
  MEMBERS_MANAGE: 'members:manage',
  REPORTS_EXPORT: 'reports:export',
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];