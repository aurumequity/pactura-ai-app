# Pactura API Specification v1

## Overview

This document defines Pactura API routes, authorization requirements, and request and response contracts.

Design goals
- Single enforcement boundary in the API
- Explicit org scoping on every request
- Action based authorization aligned to RBAC
- Audit events for protected actions
- Tenant safe data access with orgId filtering in every data layer

Base path
- /orgs/{orgId}

---

## Authentication

Auth mechanism
- Firebase ID token

Request requirement
- Authorization header with Bearer token
- Authorization value is Bearer and the Firebase ID token

Server behavior
- Verify token on every request
- Derive userId from token
- Resolve membership at organizations/{orgId}/memberships/{userId}
- Deny if membership missing or status not active

---

## Authorization

Authorization model
- Action based RBAC
- Each route maps to a single actionName
- Allowed roles defined in RBAC Matrix

Chat session deletion rule
- Member may delete only sessions they created
- Owner and Admin may delete any session

---

## Standard Response Codes

Success
- 200 OK
- 201 Created
- 204 No Content

Client errors
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 429 Too Many Requests

Server errors
- 500 Internal Server Error

---

## Error Format

All errors return the same shape.

Fields
- errorCode string
- message string
- requestId string

Rules
- message must not include document content, chunk text, prompts, or model output
- requestId is used to correlate audit and logs

---

## Common Types

Identifier types
- orgId UUID string
- documentId UUID string
- sessionId UUID string
- inviteId UUID string
- eventId UUID string
- periodId string formatted YYYY-MM

Timestamps
- stored as Firestore Timestamp in Firestore
- returned as ISO 8601 strings in API responses

Pagination
- list endpoints support pageSize and pageToken
- responses return nextPageToken when more results exist

---

## Organization

### Get organization

Method
- GET

Route
- /orgs/{orgId}

Action
- org.view

Allowed roles
- owner, admin, member

Response fields
- orgId
- name
- status
- plan
- ownerUserId
- retentionDaysDefault
- settings
- createdAt
- updatedAt

Audit event
- none

---

### Update organization

Method
- PATCH

Route
- /orgs/{orgId}

Action
- org.update

Allowed roles
- owner, admin

Request fields
- name optional
- settings optional
  - allowMemberUploads optional
  - allowMemberInvites optional

Response fields
- same as Get organization

Audit event
- org_updated

---

### Delete organization

Method
- DELETE

Route
- /orgs/{orgId}

Action
- org.delete

Allowed roles
- owner

Response
- 204 No Content

Audit event
- org_deleted

---

## Billing

### Get billing

Method
- GET

Route
- /orgs/{orgId}/billing

Action
- billing.view

Allowed roles
- owner, admin

Response fields
- plan
- status
- currentPeriodStart
- currentPeriodEnd

Audit event
- none

---

### Update billing

Method
- PATCH

Route
- /orgs/{orgId}/billing

Action
- billing.update

Allowed roles
- owner

Request fields
- plan

Response fields
- plan
- status

Audit event
- billing_updated

---

## Members and Invites

### List members

Method
- GET

Route
- /orgs/{orgId}/members

Action
- members.list

Allowed roles
- owner, admin, member

Query params
- pageSize optional
- pageToken optional

Response fields
- members list
  - userId
  - email
  - role
  - status
  - joinedAt

Pagination fields
- nextPageToken optional

Audit event
- none

---

### Create invite

Method
- POST

Route
- /orgs/{orgId}/invites

Action
- members.invite

Allowed roles
- owner, admin

Request fields
- email
- role admin or member

Response fields
- inviteId
- email
- role
- status
- expiresAt
- createdAt

Audit event
- member_invited

Notes
- invite token is never returned from this endpoint
- delivery is via email provider

---

### Remove member

Method
- DELETE

Route
- /orgs/{orgId}/members/{userId}

Action
- members.remove

Allowed roles
- owner, admin

Rules
- owner may remove admin or member
- admin may remove member only
- owner cannot remove self

Response
- 204 No Content

Audit event
- member_removed

---

### Update member role

Method
- PATCH

Route
- /orgs/{orgId}/members/{userId}/role

Action
- members.role.update

Allowed roles
- owner

Request fields
- role admin or member

Response fields
- userId
- role
- updatedAt

Audit event
- member_role_updated

---

## Documents

### List documents

Method
- GET

Route
- /orgs/{orgId}/documents

Action
- documents.list

Allowed roles
- owner, admin, member

Query params
- pageSize optional
- pageToken optional
- status optional

Response fields
- documents list
  - documentId
  - title
  - originalFilename
  - mimeType
  - sizeBytes
  - status
  - retentionExpiresAt
  - createdAt
  - updatedAt

Pagination fields
- nextPageToken optional

Audit event
- none

---

### Upload document

Method
- POST

Route
- /orgs/{orgId}/documents

Action
- documents.upload

Allowed roles
- owner, admin, member

Request fields
- file multipart upload
- title optional

Response fields
- documentId
- status
- createdAt

Audit event
- document_uploaded

Notes
- ingestion and embeddings may be async
- client polls Get document for status

---

### Get document

Method
- GET

Route
- /orgs/{orgId}/documents/{documentId}

Action
- documents.view

Allowed roles
- owner, admin, member

Response fields
- documentId
- title
- originalFilename
- mimeType
- sizeBytes
- status
- storagePath
- uploadedByUserId
- retentionExpiresAt
- deletedAt
- processing
  - errorCode
  - errorMessage
- embeddings
  - provider
  - model
  - dimension
  - chunkCount
  - indexedAt
- createdAt
- updatedAt

Audit event
- none

---

### Delete document

Method
- DELETE

Route
- /orgs/{orgId}/documents/{documentId}

Action
- documents.delete

Allowed roles
- owner, admin

Response
- 204 No Content

Audit event
- document_deleted

Notes
- deletion is idempotent
- deletion triggers SQL cascade and storage delete

---

## Retention

### Get retention policy

Method
- GET

Route
- /orgs/{orgId}/retention

Action
- retention.view

Allowed roles
- owner, admin

Response fields
- retentionDaysDefault
- updatedAt

Audit event
- none

---

### Update retention policy

Method
- PATCH

Route
- /orgs/{orgId}/retention

Action
- retention.update

Allowed roles
- owner, admin

Request fields
- retentionDaysDefault

Response fields
- retentionDaysDefault
- updatedAt

Audit event
- retention_updated

---

## Chat

### Create chat session for a document

Method
- POST

Route
- /orgs/{orgId}/documents/{documentId}/sessions

Action
- chat.session.create

Allowed roles
- owner, admin, member

Request fields
- title optional

Response fields
- sessionId
- documentId
- title
- createdAt

Audit event
- chat_session_created

---

### List chat sessions

Method
- GET

Route
- /orgs/{orgId}/sessions

Action
- chat.session.list

Allowed roles
- owner, admin, member

Query params
- pageSize optional
- pageToken optional
- documentId optional

Response fields
- sessions list
  - sessionId
  - documentId
  - title
  - status
  - lastMessageAt
  - createdAt

Pagination fields
- nextPageToken optional

Audit event
- none

---

### Delete chat session

Method
- DELETE

Route
- /orgs/{orgId}/sessions/{sessionId}

Action
- chat.session.delete

Allowed roles
- owner, admin, conditional member

Rule for member
- allowed only if createdByUserId equals caller userId

Response
- 204 No Content

Audit event
- chat_session_deleted

---

### Send message

Method
- POST

Route
- /orgs/{orgId}/sessions/{sessionId}/messages

Action
- chat.message.send

Allowed roles
- owner, admin, member

Request fields
- content string

Response fields
- messageId
- assistantMessageId
- createdAt

Audit event
- ai_query_submitted

Notes
- citations reference chunk ids and pages
- system must not store retrieved snippets in audit metadata

---

## Audit

### List audit events

Method
- GET

Route
- /orgs/{orgId}/audit

Action
- audit.list

Allowed roles
- owner, admin

Query params
- pageSize optional
- pageToken optional
- eventType optional
- documentId optional
- actorUserId optional

Response fields
- events list
  - eventId
  - eventType
  - actorUserId
  - createdAt
  - documentId optional
  - targetUserId optional
  - targetEmail optional
  - metadata optional

Pagination fields
- nextPageToken optional

Audit event
- none

---

## Internal Operations

These routes are not called by the frontend. They are invoked by automation.

### Retention sweep trigger

Method
- POST

Route
- /ops/retentionSweep

Auth
- service identity only

Behavior
- process batch of expired documents
- run deletion workflow and audit writes

Response fields
- processedCount
- failedCount

Audit event
- retention_sweep_executed

---

## Status

This API surface is frozen for v1.  
Any new route must be added to the Route to Action Map and RBAC Matrix.