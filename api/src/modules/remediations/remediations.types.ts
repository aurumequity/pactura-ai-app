import { FrameworkKey } from '../../gap-check/framework-prompts';
import { GapItem } from '../../gap-check/gap-check.types';

export type RemediationStatus = 'open' | 'in_progress' | 'resolved';
export type RemediationSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Remediation {
  id: string;
  orgId: string;
  documentId: string;
  sourceGap: string;
  framework: FrameworkKey;
  title: string;
  description: string;
  assigneeId: string;
  assigneeEmail: string;
  dueDate: string;
  status: RemediationStatus;
  severity: RemediationSeverity;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  createdBy: string;
}

// POST /orgs/:orgId/remediations
export interface CreateRemediationDto {
  documentId: string;
  sourceGap: string;
  framework: FrameworkKey;
  title: string;
  description: string;
  assigneeId: string;
  assigneeEmail: string;
  dueDate: string;
  severity: RemediationSeverity;
  status?: RemediationStatus; // defaults to 'open'
}

// PATCH /orgs/:orgId/remediations/:remediationId
export interface UpdateRemediationDto {
  status?: RemediationStatus;
  assigneeId?: string;
  assigneeEmail?: string;
  dueDate?: string;
}

// POST /orgs/:orgId/documents/:docId/remediations/bulk-create
export interface BulkCreateRemediationsDto {
  framework: FrameworkKey;
  gaps: GapItem[];
  defaultAssigneeId: string;
  defaultAssigneeEmail: string;
  defaultDueDate: string;
}

// Query params for GET /orgs/:orgId/remediations
export interface ListRemediationsQuery {
  status?: RemediationStatus;
  framework?: FrameworkKey;
  documentId?: string;
}