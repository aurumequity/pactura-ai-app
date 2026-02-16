# Engineering Handbook – Pactura

## 1. Purpose

This document explains how Pactura is structured, how to run it locally, and how to safely contribute.

This is the first document a new engineer should read.

---

## 2. System Overview

Pactura is a multi-tenant AI contract intelligence platform.

Core principles:

* Logical multi-tenancy via orgId scoping
* Server-side RBAC enforcement
* Structured audit logging
* Retention-based lifecycle control
* pgvector-backed semantic retrieval
* Strict data classification boundaries

Enforcement boundary:
Cloud Run API service.

Frontend never directly accesses database services.

---

## 3. Repository Structure

```
pactura/
  frontend/
  api/
  docs/
  adr/
```

### frontend

Next.js application.

### api

NestJS API using Fastify adapter.
Handles:

* Auth
* Org resolution
* RBAC
* Audit
* Retention
* AI retrieval

### docs

Architecture, governance, API spec.

### adr

Architectural decisions and rationale.

---

## 4. Local Development Setup

### Requirements

* Node 18+
* npm
* Firebase project
* GCP credentials (application default)

### Start API

From repo root:

```
cd api
npm install
npm run start:dev
```

Health check:

```
curl http://localhost:8080/health
```

---

## 5. Environment Variables

Do not commit `.env`.

Create:

```
api/.env
```

Based on:

```
api/.env.example
```

Secrets must not be committed.

---

## 6. Authentication Flow

* Firebase ID token verified by middleware
* userId attached to request
* All protected routes require token

Health and ops routes excluded.

---

## 7. Organization Resolution

All routes under:

```
/orgs/:orgId/*
```

Require:

* Valid membership
* membership.status === active

Middleware attaches:

```
req.user
req.orgContext
```

---

## 8. RBAC Model

Action-based enforcement.

Controllers declare required action.
RBAC middleware compares role to matrix.

Roles:

* owner
* admin
* member

---

## 9. Data Storage

Firestore:

* Organizations
* Memberships
* Audit
* Usage

Cloud SQL:

* documents
* doc_chunks
* doc_embeddings

Cloud Storage:

* Raw document files

---

## 10. Governance Guarantees

* No cross-tenant access
* All SQL queries filtered by org_id
* No document text in logs
* Embeddings treated as sensitive
* Deletion is idempotent

---

## 11. Deployment Model

* Cloud Run API
* Cloud SQL with pgvector
* Firestore
* Cloud Storage
* Secret Manager
* Cloud Scheduler for retention

Environments:

* dev
* staging
* prod

---

## 12. Lessons Learned

Document operational issues here.

Example entries:

### Nested Git Repository

Issue:
Nest CLI created a nested git repository inside api/.

Impact:
Git refused to add api folder.

Resolution:
Removed api/.git and tracked api as a normal directory.

---

### Running npm from Wrong Directory

Issue:
Attempted to run npm from repo root.

Impact:
ENOENT package.json error.

Resolution:
Run npm commands from api directory.

---

### Auth Middleware Blocking Health Route

Issue:
401 on all routes including health.

Resolution:
Explicitly exclude health route in middleware configuration.

---

Add new entries here whenever something unexpected occurs.

---

## 13. Contribution Guidelines

Before committing:

* Ensure no secrets in code
* Ensure org_id filters exist in SQL
* Ensure RBAC action mapped
* Ensure audit event added for protected actions
* Update documentation if architecture changes

---

## 14. Architecture Discipline Rules

* No direct database access in controllers
* All access goes through service layer
* All protected routes declare action requirement
* No document text in logs
* All deletions must cascade

---

Status:
Handbook is living documentation.
