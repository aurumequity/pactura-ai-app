export interface DocumentRecord {
  id: string;
  name: string;
  status: 'pending';
  uploadedBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}