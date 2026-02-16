# Pactura Governance Model – v1

## Overview

Pactura is designed with governance as a first-class concern.

Governance in v1 is enforced through:

* Tenant isolation
* Role-based access control
* Structured audit logging
* Data classification
* Retention enforcement
* Controlled deletion workflows

Governance decisions are implemented at the API enforcement boundary.

---

## Tenant Isolation

Isolation is logical and organization-scoped.

Enforced at:

* API layer via orgId validation
* Firestore document path nesting
* SQL queries requiring org_id filters
* Vector retrieval filtered by org_id

No request executes without validated org context.

Cross-tenant access is structurally impossible if enforcement rules are followed.

---

## Identity and Authorization

Authentication

* Firebase ID token verification

Authorization

* Action-based RBAC
* Role resolved per organization
* Server-side enforcement only

Membership status must be active.

Client role claims are ignored.

---

## Audit Logging

Audit events are written for all protected actions.

Each event contains:

* orgId
* eventType
* actorUserId
* requestId
* createdAt

Audit events never contain:

* Document text
* Chunk content
* Embeddings
* LLM prompts
* LLM responses

Audit logs are immutable.

Only Owner and Admin may view audit logs.

---

## Data Classification

Data is classified into four levels:

Public
Internal
Sensitive
Highly Sensitive

Highly Sensitive data includes:

* Contract content
* Chunk text
* Embeddings
* AI prompts and responses

Highly Sensitive data is:

* Never logged
* Never written to audit metadata
* Deleted upon retention expiry

---

## Retention Enforcement

Each organization defines:

retentionDaysDefault

At upload time:

* retentionExpiresAt is calculated

A scheduled retention job:

* Identifies expired documents
* Deletes Cloud Storage objects
* Deletes SQL records
* Cascades chunk and embedding removal
* Updates Firestore status
* Writes audit events

Manual deletion overrides retention schedule.

Deletion is idempotent.

---

## Deletion Guarantees

After deletion:

* No SQL document row exists
* No chunk rows exist
* No embedding rows exist
* No Cloud Storage object exists
* Firestore metadata reflects deleted status

Audit logs remain.

Deletion is always org-scoped.

---

## Logging Controls

Application logs must never contain:

* Document content
* Chunk content
* Embedding vectors
* AI prompts
* AI responses

Logs may include:

* IDs
* Counts
* Role changes
* Configuration updates

---

## API Enforcement Boundary

All governance logic lives in the Cloud Run API layer.

Responsibilities:

* Identity verification
* Membership resolution
* Role validation
* Action authorization
* Audit event creation
* Data access control
* Retention enforcement

No direct database access from the frontend.

---

## Security Invariants

* All protected routes require orgId
* All SQL queries require org_id filter
* No raw contract content stored in Firestore
* No Highly Sensitive data in logs
* RBAC evaluated before data access
* Deletion must cascade across storage layers

---

## Cost Control Alignment

Governance also supports cost control:

* Retention reduces storage footprint
* Vector index growth constrained by retention
* Usage counters track token consumption
* Batch deletion prevents runaway growth

---

## Compliance Positioning

This governance structure supports:

* SOC 2 readiness
* Vendor security questionnaires
* Enterprise security reviews
* Data handling transparency

Although v1 is not certified, its architecture is compliance-aligned.

---

## Status

Governance model frozen for v1.

Changes require ADR entry.

