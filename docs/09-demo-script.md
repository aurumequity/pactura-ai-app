# Cost Control Strategy – Pactura v1

## Overview

Pactura is designed to control operational costs from day one.

Primary cost drivers:

* Cloud Storage usage
* Cloud SQL storage and compute
* Vector index size
* Embedding generation
* LLM token usage
* Cloud Run invocations

This document defines mechanisms to manage and limit these costs.

---

## Major Cost Drivers

### 1. Cloud Storage

Costs driven by:

* Raw document size
* Retention duration

Mitigation:

* Retention policy enforcement
* Hard deletion of expired files
* No duplicate storage
* No storing derived artifacts in storage

---

### 2. Cloud SQL Storage

Costs driven by:

* Document rows
* Chunk rows
* Embedding rows
* Index size growth

Mitigation:

* Retention deletion cascades
* Unique chunk indexing
* Controlled embedding dimension
* No redundant embeddings

---

### 3. Vector Index Growth

Costs driven by:

* Number of chunks per document
* Embedding dimension
* Number of stored documents

Mitigation:

* Limit chunk size
* Avoid overly small chunk segmentation
* Retention cleanup
* Tune ivfflat list count

---

### 4. Embedding API Usage

Costs driven by:

* Embedding generation per document
* Embedding regeneration events

Mitigation:

* Embed once at ingestion
* No re-embedding unless document changes
* Store embeddings persistently
* Avoid duplicate uploads via sha256 detection

---

### 5. LLM Token Usage

Costs driven by:

* Prompt size
* Number of retrieved chunks
* Response length
* Query frequency

Mitigation:

* TopK retrieval limits
* Token cap per request
* Rate limiting per organization
* Usage counters

---

### 6. Cloud Run Invocations

Costs driven by:

* Query frequency
* Background job frequency
* Autoscaling behavior

Mitigation:

* Minimum instances set to zero in non-production
* Batch retention processing
* Request size limits
* Response caching where possible

---

## Usage Controls

Each organization maintains usage counters:

Stored at:
organizations/{orgId}/usage/{periodId}

Tracked metrics:

* documentsUploaded
* queriesExecuted
* tokensEstimated
* storageBytesEstimated

Usage counters support:

* Future plan enforcement
* Billing integration
* Abuse detection

---

## Rate Limiting

Planned v1 controls:

* Per-user query rate limits
* Per-org daily token cap
* Upload size limits
* File type validation

Rate limiting enforced at API layer.

---

## Budget Monitoring

Cloud-level controls:

* GCP budget alerts
* Billing thresholds
* Alert policies for:

  * High SQL CPU
  * Storage growth
  * LLM cost spikes

Application-level alerts:

* Query volume spike detection
* Token usage anomalies

---

## Retention as Cost Lever

Retention is the primary cost containment mechanism.

Shorter retention:

* Reduces storage
* Shrinks vector index
* Improves retrieval performance
* Lowers total cost of ownership

Retention policy is a strategic cost control mechanism.

---

## Scaling Strategy

v1 assumptions:

* Low initial document volume
* Moderate chunk counts
* Limited concurrent users

As scale increases:

* Increase ivfflat list count
* Introduce connection pooling
* Consider horizontal API scaling
* Evaluate database sizing

Scaling decisions will be data-driven.

---

## Security and Cost Alignment

Security controls also reduce cost:

* Prevent cross-tenant leakage
* Prevent duplicate embeddings
* Prevent uncontrolled uploads
* Prevent token abuse

Cost control and governance are aligned.

---

## Status

Cost control strategy frozen for v1.
Adjustments require ADR entry.

