import type { GapCheckResult, GapItem } from '../gap-check/gap-check.types';
import type { AuditSummary } from '../audit-summary/audit-summary.types';
import type { AnomalyReport } from '../anomaly-detect/anomaly-detect.types';

export interface DocumentRecord {
  id: string;
  name: string;
  fileType: string;
  storagePath: string;
  status: 'active' | 'pending';
  uploadedBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  version: number;
  previousVersionId?: string;
  isLatestVersion: boolean;
  complianceGaps?: Record<string, GapCheckResult>;
  auditSummary?: AuditSummary;
  anomalyReport?: AnomalyReport;
}

export interface CreateDocumentDto {
  name: string;
  fileType: string;
  storagePath: string;
}

export interface NewVersionDto {
  name: string;
  fileType: string;
  storagePath: string;
}

export interface GapDelta {
  resolved: GapItem[];
  persisting: GapItem[];
  introduced: GapItem[];
}

export type DeltaByFramework = Record<string, GapDelta>;

export interface ComplianceFlag {
  label: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AnalysisResult {
  contractType: string;
  keyParties: string[];
  complianceFlags: ComplianceFlag[];
  summary: string;
  effectiveDate?: string;
  termLength?: string;
  totalValue?: string;
  keyObligations?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatDto {
  messages: ChatMessage[];
}

export interface ChatReply {
  reply: string;
}
