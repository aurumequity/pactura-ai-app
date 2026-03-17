import type { GapCheckResult } from '../gap-check/gap-check.types';

export interface DocumentRecord {
  id: string;
  name: string;
  fileType: string;
  storagePath: string;
  status: 'active' | 'pending';
  uploadedBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  complianceGaps?: Record<string, GapCheckResult>;
}

export interface CreateDocumentDto {
  name: string;
  fileType: string;
  storagePath: string;
}

export interface ComplianceFlag {
  label: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AnalysisResult {
  contractType: string;
  keyParties: string[];
  complianceFlags: ComplianceFlag[];
  summary: string;
}
