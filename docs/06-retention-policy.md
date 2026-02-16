# Retention Policy – Pactura v1

## Overview

This document defines how long document data is retained, when automatic deletion occurs, and which data categories are affected.

Retention is organization-scoped and enforced through scheduled automation.

Deletion mechanics are defined separately in the Deletion Workflow document.

---

## Scope

Retention applies to document-related data only.

Included:

* Cloud Storage raw documents
* Cloud SQL documents rows
* Cloud SQL doc_chunks rows
* Cloud SQL doc_embeddings rows
* Firestore document metadata

Excluded:

* Organization metadata
* Membership records
* Audit events
* Usage counters
* System configuration

Audit retention may exceed document retention.

---

## Default Retention

Each organization stores:

retentionDaysDefault

Location:
organizations/{orgId}

If not configured, the platform default applies.

Recommended default for v1:
30 days

---

## Expiry Calculation

At document upload:

retentionExpiresAt = createdAt + retentionDaysDefault

Stored in:

* Firestore document metadata
* SQL documents table

Retention expiration is calculated once at ingestion.

If retentionDaysDefault is later updated:

* New uploads use the updated value
* Existing documents are not retroactively updated unless explicitly modified

---

## Automatic Retention Job

A scheduled job runs daily via Cloud Scheduler.

Process:

1. Query SQL documents where:

   * retention_expires_at < now
   * deleted_at IS NULL

2. For each document:

   * Invoke deletion workflow
   * Delete Cloud Storage object
   * Delete SQL document row
   * Cascade removal of chunks and embeddings
   * Update Firestore document status to deleted
   * Write audit event

Batch size limits apply to prevent resource spikes.

---

## Manual Override

Owner or Admin may delete a document manually before expiry.

Manual deletion:

* Immediately triggers full deletion workflow
* Overrides retention schedule
* Writes audit event

Retention does not block manual deletion.

---

## Chat Data Behavior

If a document is deleted:

* Associated chat sessions remain
* Future retrieval attempts fail safely
* No embeddings exist for deleted documents

v1 does not cascade chat deletion.

Future versions may optionally cascade sessions.

---

## Data Destruction Guarantees

Upon retention-triggered deletion:

* No raw document exists in Cloud Storage
* No SQL document row exists
* No chunk rows exist
* No embedding rows exist
* Firestore metadata reflects deleted status

Deletion is idempotent and tenant-scoped.

---

## Security Invariants

* All retention queries include org_id filter
* No cross-tenant deletion possible
* Deletion retries are safe
* No document text remains after deletion
* Embeddings are treated as sensitive and removed

---

## Cost Impact

Retention directly controls:

* Storage costs
* Vector index growth
* Embedding storage growth
* Retrieval performance degradation over time

Shorter retention reduces operating cost and index bloat.

---

## Status

Retention policy frozen for v1.
Changes require ADR entry.

