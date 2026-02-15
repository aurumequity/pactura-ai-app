## Firestore Schema (v1 Frozen)

All tenant data is nested under:

organizations/{orgId}

Naming convention:
- camelCase for all fields
- Timestamp fields end with At
- Status fields use lowercase enums

---

### organizations
Path:
organizations/{orgId}

Fields:
- name
- status: active | suspended | deleted
- plan: free | pro
- ownerUserId
- retentionDaysDefault
- settings
  - allowMemberUploads
  - allowMemberInvites
- createdAt
- updatedAt

---

### memberships
Path:
organizations/{orgId}/memberships/{userId}

Fields:
- userId
- email
- role: owner | admin | member
- status: active | removed
- joinedAt
- removedAt
- createdAt
- updatedAt

---

### invites
Path:
organizations/{orgId}/invites/{inviteId}

Fields:
- inviteId
- email
- role: admin | member
- status: pending | accepted | cancelled | expired
- tokenHash
- expiresAt
- invitedByUserId
- acceptedByUserId
- acceptedAt
- createdAt
- updatedAt

---

### documents
Path:
organizations/{orgId}/documents/{documentId}

Fields:
- documentId
- title
- originalFilename
- mimeType
- sizeBytes
- storagePath
- uploadedByUserId
- status: uploading | processing | ready | failed | deleting | deleted
- retentionExpiresAt
- deletedAt
- processing
  - errorCode
  - errorMessage
- extracted
  - pageCount
  - sha256
  - extractedAt
- embeddings
  - provider
  - model
  - dimension
  - chunkCount
  - indexedAt
- createdAt
- updatedAt

---

### chatSessions
Path:
organizations/{orgId}/chatSessions/{sessionId}

Fields:
- sessionId
- documentId
- createdByUserId
- title
- status: active | deleted
- lastMessageAt
- createdAt
- updatedAt

---

### chatMessages
Path:
organizations/{orgId}/chatSessions/{sessionId}/messages/{messageId}

Fields:
- messageId
- role: user | assistant | system
- content
- citations
- usage
  - promptTokens
  - completionTokens
  - totalTokens
- createdAt

---

### auditEvents
Path:
organizations/{orgId}/auditEvents/{eventId}

Fields:
- eventId
- eventType
- actorUserId
- requestId
- ipHash
- userAgent
- targetUserId
- targetEmail
- inviteId
- documentId
- sessionId
- metadata
- createdAt

---

### usage
Path:
organizations/{orgId}/usage/{periodId}

Fields:
- periodId
- documentsUploaded
- queriesExecuted
- tokensEstimated
- storageBytesEstimated
- lastUpdatedAt
- createdAt
- updatedAt