export interface AuditLogEntry {
  id: string;
  userId: string;
  orgId: string;
  documentId: string;
  action: string;
  modelUsed: string;
  tokensUsed: number;
  responseStatus: 'success' | 'error';
  timestamp: string; // ISO 8601, converted from Firestore Timestamp server-side
}

export interface AuditLogPage {
  logs: AuditLogEntry[];
  nextCursor: string | null;
}
