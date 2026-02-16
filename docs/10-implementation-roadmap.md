# Implementation Roadmap – Pactura v1

## Overview

This roadmap defines the ordered execution plan for building Pactura v1.

The objective is controlled delivery with architectural integrity.

---

## Phase 1 – Infrastructure Foundation

Goals:
- Create GCP project
- Enable Cloud Run
- Enable Cloud SQL with pgvector
- Enable Firestore
- Enable Cloud Storage
- Enable Secret Manager
- Configure service accounts and IAM
- Establish environment separation

Exit Criteria:
Cloud infrastructure provisioned and secured.

---

## Phase 2 – Authentication and Org Layer

Goals:
- Integrate Firebase Auth
- Implement org creation
- Implement membership resolution
- Implement RBAC middleware
- Implement org view endpoint

Exit Criteria:
Authenticated multi-tenant org access functional.

---

## Phase 3 – Document Ingestion Pipeline

Goals:
- Implement document upload endpoint
- Store file in Cloud Storage
- Create Firestore metadata record
- Insert SQL documents row
- Implement chunking logic
- Generate embeddings
- Insert doc_chunks and doc_embeddings
- Update Firestore status

Exit Criteria:
Documents indexed and retrievable.

---

## Phase 4 – Retrieval and Chat

Goals:
- Implement session creation
- Implement tenant-safe vector retrieval
- Construct LLM prompts
- Return responses with citations
- Write audit events

Exit Criteria:
AI contract analysis functional with citations.

---

## Phase 5 – Governance Automation

Goals:
- Implement retention update endpoint
- Implement deletion workflow
- Implement retention sweep job
- Implement audit log listing
- Implement usage counters

Exit Criteria:
Lifecycle governance automated.

---

## Phase 6 – Hardening

Goals:
- Add rate limiting
- Add request validation
- Add structured logging
- Add monitoring alerts
- Validate tenant safety invariants
- Conduct security review

Exit Criteria:
System ready for private beta.

---

Status:
Roadmap frozen for v1.