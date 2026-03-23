import type { FrameworkKey } from './framework-prompts';

export interface GapCheckDto {
  framework: FrameworkKey;
}

export interface GapItem {
  requirement: string;
  status: 'met' | 'partial' | 'missing';
  evidence: string;
  recommendation: string;
}

export interface GapCheckResult {
  framework: FrameworkKey;
  runAt: FirebaseFirestore.Timestamp;
  gaps: GapItem[];
}
