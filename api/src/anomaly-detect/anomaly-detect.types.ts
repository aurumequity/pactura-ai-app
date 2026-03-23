export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyType = 'unusual_clause' | 'missing_clause' | 'conflicting_terms' | 'non_standard_language';

export interface Anomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  recommendation: string;
  location?: string; // e.g. "Section 4.2" if detectable
}

export interface AnomalyReport {
  documentType: string;
  totalAnomalies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  anomalies: Anomaly[];
  runAt: FirebaseFirestore.Timestamp;
}
