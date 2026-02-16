# Deployment Architecture – Pactura v1

## Overview

Defines runtime deployment structure for Pactura v1.

Focus areas:
- Isolation
- Scalability
- Observability
- Secret management

---

## Runtime Components

Frontend:
- Next.js
- Deployed via Vercel or Cloud Run

API:
- Cloud Run container
- Stateless
- Autoscaling enabled

Database:
- Cloud SQL PostgreSQL
- pgvector extension enabled
- Private IP access only

Storage:
- Cloud Storage bucket
- Private access
- Signed URLs for controlled downloads

Secrets:
- Managed in Secret Manager
- Injected via environment variables

---

## Networking Model

- API exposed over HTTPS
- Cloud SQL accessed via private VPC connector
- No public database endpoints
- Service-to-service authentication via IAM

---

## Environment Separation

Environments:
- dev
- staging
- prod

Each environment has:
- Separate GCP project
- Separate Cloud SQL instance
- Separate Firestore database
- Separate storage bucket
- Separate Firebase project

No shared production data.

---

## Observability

Logging:
- Cloud Logging
- Structured JSON logs

Monitoring:
- Cloud Monitoring dashboards
- Alerting policies for:
  - Error rate spikes
  - Retention job failures
  - Elevated latency

Error tracking:
- Centralized error aggregation

---

## Scaling Strategy

- Cloud Run autoscaling based on traffic
- Connection pooling for Cloud SQL
- Retention job batch processing
- Vector index tuning over time

---

Status:
Deployment model frozen for v1.