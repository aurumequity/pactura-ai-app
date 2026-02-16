## Overview

This document defines the primary security threats to Pactura v1 and the architectural controls used to mitigate them.

The goal is to:

* Identify sensitive assets
* Define trust boundaries
* Evaluate threat categories
* Document mitigations
* Assess residual risk

This threat model supports future security reviews and compliance readiness.

---

## Trust Boundaries

Pactura operates across several trust zones.

### 1. User Device Boundary

* Browser environment
* Untrusted
* All requests must be authenticated and validated

### 2. API Enforcement Boundary

* Cloud Run service
* Primary security enforcement point
* Handles authentication, authorization, audit, retention logic

### 3. Data Storage Boundary

* Firestore
* Cloud SQL
* Cloud Storage
* Secret Manager

Access only via API layer.

No direct client access.

### 4. External LLM Provider Boundary

* Embeddings API
* Chat completion API

External system.
Treated as semi-trusted.
No sensitive logging allowed.

---

## Protected Assets

Highly Sensitive Assets

* Raw contract documents
* Extracted chunk text
* Vector embeddings
* AI prompts
* AI responses

Sensitive Assets

* User emails
* Membership roles
* Audit metadata
* Retention configuration

Operational Assets

* Usage counters
* Plan tiers
* System logs

---

## Threat Categories

### 1. Cross-Tenant Data Access

Risk:
User accesses another organization’s data.

Mitigation:

* orgId required in every route
* Firestore nesting under organizations/{orgId}
* SQL queries require org_id filter
* Vector retrieval filtered by org_id
* RBAC evaluated before handler execution

Residual Risk:
Low if enforcement boundary is respected.

---

### 2. Privilege Escalation

Risk:
Member attempts to elevate role.

Mitigation:

* Role stored in Firestore membership record
* Server-side role resolution
* Only Owner may update roles
* Role updates audited

Residual Risk:
Low.

---

### 3. Data Leakage via Logs

Risk:
Document content appears in logs.

Mitigation:

* Explicit logging policy
* No document text in audit metadata
* Sanitized error responses
* No embedding data logged

Residual Risk:
Medium if developers bypass logging rules.

Requires code review discipline.

---

### 4. Embedding Inference Risk

Risk:
Embedding vectors leak semantic meaning.

Mitigation:

* Embeddings treated as Highly Sensitive
* Not exposed externally
* Deleted on retention expiry
* Not returned directly to clients

Residual Risk:
Low.

---

### 5. Unauthorized Deletion

Risk:
Malicious user deletes documents.

Mitigation:

* RBAC enforcement
* Role validation
* org_id filtered deletes
* Audit logging
* Idempotent workflow

Residual Risk:
Low.

---

### 6. Prompt Injection via Document Content

Risk:
Malicious document text manipulates model behavior.

Mitigation:

* Strict system instructions
* Clear context delimitation
* No tool execution from document instructions
* No automatic command execution

Residual Risk:
Medium.
LLM prompt injection remains an evolving risk.

---

### 7. Denial of Service

Risk:
Excessive queries or uploads increase cost and degrade performance.

Mitigation:

* Usage counters
* Rate limiting
* Token caps
* Batch retention cleanup
* Cloud Run autoscaling limits

Residual Risk:
Medium without enforced rate limits.

---

## Out of Scope for v1

* Hardware attacks
* Nation-state actors
* Side-channel attacks
* Encrypted search at rest
* Full SOC 2 certification

---

## Security Invariants

* All protected routes require orgId
* All SQL queries include org_id
* No raw document content in logs
* RBAC enforced server-side only
* Retention deletes all derived artifacts
* Deletion is tenant-scoped and idempotent

---

## Status

Threat model frozen for v1.
Changes require ADR entry.
