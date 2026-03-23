import type { GapCheckResult } from '../gap-check/gap-check.types';

export interface RemediationAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  framework: string;
}

export interface FrameworkCallout {
  framework: string;
  met: number;
  partial: number;
  missing: number;
  topGap: string;
}

export interface AuditSummary {
  riskScore: number; // 1-10
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  executiveNarrative: string;
  remediationActions: RemediationAction[];
  frameworkCallouts: FrameworkCallout[];
  basedOnFrameworks: string[];
  runAt: FirebaseFirestore.Timestamp;
}
