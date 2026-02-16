# ADR 0002 – Cloud SQL with pgvector

Status: Accepted  
Date: 2026-02-15  
Owner: Pactura Core

## Context

Pactura requires semantic search across document content.

Requirements:
- Persistent storage of embeddings
- Tenant-safe similarity search
- Controlled infrastructure cost
- Managed database service

## Decision

Use Cloud SQL PostgreSQL with the pgvector extension.

Embeddings will be stored in:
- doc_embeddings table
- vector column with fixed dimension

Vector search will use:
- ivfflat index
- cosine similarity
- org_id filtering in every query

## Alternatives Considered

1. Managed vector database
   - Higher cost
   - Vendor lock-in
   - Less control

2. In-memory vector search
   - Not persistent
   - Not scalable

3. Postgres + pgvector
   - Unified database
   - Cost-controlled
   - Operational simplicity

## Consequences

Positive:
- Single managed database
- Persistent embeddings
- Strong SQL filtering guarantees

Negative:
- Requires index tuning
- Must manage connection pooling