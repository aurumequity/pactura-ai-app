# Pactura

Pactura is a multi-tenant AI-powered contract intelligence platform designed to help small businesses securely analyze and understand agreements.

## Overview

Pactura enables organizations to:

- Securely upload and store contracts
- Analyze clauses using retrieval-augmented generation (RAG)
- Enforce role-based access control (RBAC)
- Maintain audit logs and retention policies
- Isolate tenant data at every layer

## Architecture

- **Frontend:** Next.js (TypeScript)
- **API Layer:** Cloud Run (Node.js)
- **Auth:** Firebase Authentication
- **Metadata & Governance:** Firestore
- **Document & Vector Storage:** Cloud SQL (Postgres + pgvector)
- **File Storage:** Cloud Storage
- **Secrets Management:** Secret Manager

## Core Principles

- Tenant isolation first
- Governance before features
- Production-grade design
- Cost-aware infrastructure

## Status

Active development.
