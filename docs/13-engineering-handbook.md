# Engineering Handbook – Pactura

## 1. Purpose

This document explains how Pactura is structured, how to run it locally, and how to safely contribute.

This is the first document a new engineer should read.

---

## 2. System Overview

Pactura is a multi-tenant AI contract intelligence platform.

Core principles

* Logical multi-tenancy via orgId scoping
* Server-side RBAC enforcement
* Structured audit logging
* Retention-based lifecycle control
* pgvector-backed semantic retrieval
* Strict data classification boundaries

Enforcement boundary
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

NestJS API using Fastify adapter. Handles

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
* Firebase CLI
* Java JDK 21+ for Firebase emulators
* GCP credentials when running against real GCP services, not required for emulator-only dev

Why these exist

* Firebase Auth handles identity. We validate tokens on the server to enforce security at the API boundary.
* Firestore stores metadata and governance objects. We use it for org, membership, audit, and usage.
* Emulators let you develop without incurring cost or risking production data.
* Java is required by the emulators.

### One-time install

Install Firebase CLI globally

```
npm install -g firebase-tools
firebase --version
```

---

## 5. Firebase Console Setup

This section assumes you are starting from zero.

### Create a Firebase project

1. Go to Firebase Console and create a project
2. Use a clear name like pactura-dev
3. Do not enable Analytics for dev unless you have a reason

Why
Project separation keeps blast radius small and controls cost.

### Enable Authentication

1. Firebase Console, Build, Authentication
2. Sign-in method
3. Enable Email and Password

Why
Email and password is the simplest for v1 local testing. You can add SSO later.

### Create a Web App in Firebase

1. Project settings, General, Your apps
2. Add app, Web
3. Register app

You will get a config object that includes apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId.

Why
The frontend needs the Firebase config to talk to Auth and other Firebase services.

### Optional, Hosting during web app creation

If you are using Next.js locally, do not set up Firebase Hosting yet. You can add it later when you are ready to deploy a static marketing site or a hosted frontend.

Why
Hosting adds deployment surface area. Keep early iteration tight.

---

## 6. Frontend Setup

### Create the Next.js app

From repo root, use the existing frontend directory. If it already exists, do not run create-next-app into the same folder unless it is empty.

Expected frontend layout

* frontend

  * src

    * app
    * lib

Why
App Router is the current Next.js default. It keeps routing and layouts consistent.

### Install Firebase SDK in the frontend

From the frontend directory

```
cd frontend
npm install firebase
```

### Add environment variables for the frontend

Create `frontend/.env.local` and do not commit it.

Store the web app config there, using NEXT_PUBLIC prefixes so Next.js can expose them to the browser.

Why
Next.js only exposes env vars to the browser when they start with NEXT_PUBLIC.

### Initialize Firebase client in one place

Create `frontend/src/lib/firebaseClient.ts` and initialize Firebase once.

Why
Centralizing initialization prevents duplicate app instances and makes emulator wiring easy.

### Add a basic sign-in page

Add a page at `frontend/src/app/sign-in/page.tsx` that signs in using email and password, then prints the ID token.

Why
This is the fastest way to confirm Auth is working end to end.

Success criteria

* You can sign in with a test user
* You can see an ID token printed in the UI
* You can use that token to call the API later

---

## 7. Firebase Emulators Setup

### Initialize emulator config at repo root

Run from repo root

```
firebase login
firebase init emulators
```

Select at least

* Authentication Emulator
* Firestore Emulator
* Storage Emulator

Why
These are the minimum services Pactura uses in v1.

### Start emulators

From repo root

```
firebase emulators:start
```

Emulator UI
If enabled in firebase.json, it runs on a local port and provides a browser UI. If it does not show up as a selection during init, you can still enable it by editing firebase.json.

### Java requirement

If the CLI reports that it requires Java 21+, install a JDK 21+ and ensure `java -version` works in your shell.

Why
firebase-tools uses Java for emulator runtime.

### Rules files required for Storage emulator

If Storage emulator fails to start, it is usually because storage rules are not configured. Ensure `storage.rules` exists and firebase.json references it.

Why
Storage emulator requires explicit rules config. Firestore will otherwise default to allow-all in emulator mode, which is risky even in local dev because it hides auth and rules problems.

---

## 8. API Setup

### Install and start API

From repo root

```
cd api
npm install
npm run start:dev
```

Health check

```
curl http://localhost:8081/health
```

Why the health route exists
It is the simplest readiness signal and must not require auth.

### API environment variables

Create `api/.env` based on `api/.env.example`. Do not commit it.

For emulator-based local dev, these are typical

* FIREBASE_PROJECT_ID
* FIREBASE_AUTH_EMULATOR_HOST
* FIRESTORE_EMULATOR_HOST
* STORAGE_EMULATOR_HOST
* PORT

Why
Admin SDK and some Firebase clients detect emulator routing via environment variables.

---

## 9. Authentication Flow

High level

* Frontend signs in via Firebase Auth
* Frontend receives Firebase ID token
* Frontend calls API with Authorization header using Bearer token
* API verifies token and attaches user identity to request
* Controllers and services enforce org boundaries and RBAC

Why this design
Never trust the browser. Token verification and authorization must happen server-side.

Current v1 implementation shape

* Auth middleware verifies token on protected routes
* Health and ops routes are excluded

---

## 10. Confirming Auth Works Locally

### Step 1 Create a test user

Options

* Firebase Console, Authentication, Users, Add user
* Emulator UI, Authentication tab, add user

Why
You need a known credential pair to test sign-in.

### Step 2 Sign in from the frontend

* Run Next dev server in frontend
* Visit the sign-in page
* Enter the test user credentials
* Confirm an ID token is displayed

### Step 3 Use the token against the API

Example

```
curl -i -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8081/whoami
```

Success criteria

* health returns 200
* whoami returns 200 when token is valid
* whoami returns 401 when token is missing or invalid

---

## 11. Common Troubleshooting

### Problem Invalid API key on the frontend

Symptoms

* Firebase error auth invalid-api-key
* It fails on initializeAuth or signInWithEmailAndPassword

Likely causes

* You pasted the config into the wrong file
* You placed JS object syntax into .env.local instead of key value pairs
* You forgot NEXT_PUBLIC prefix
* You restarted Next.js without reloading env vars

Fix

* Use .env.local with NEXT_PUBLIC variables
* Restart `npm run dev`

Why
Next.js loads env vars at process start.

### Problem Emulator UI not available during init

Symptoms

* The init prompt did not list UI

Fix

* Edit firebase.json and ensure ui enabled is true

Why
CLI prompts vary by version, but firebase.json is authoritative.

### Problem Emulator start fails without Java

Symptoms

* firebase-tools reports missing Java runtime

Fix

* Install JDK 21+
* Verify `java -version`

Why
Emulators require Java.

### Problem Storage emulator cannot start without rules

Symptoms

* Emulator starts auth and firestore
* Storage fails with a rules configuration error and shuts down

Fix

* Run `firebase init storage` or create storage.rules
* Reference it from firebase.json

Why
Storage emulator requires rules.

### Problem API returns Invalid token even with a token from frontend

This is the key onboarding lesson. Tokens must be minted and verified in the same environment.

Likely causes

* Frontend is using real Firebase Auth but API is verifying against emulator
* Frontend is using emulator but API is verifying against real Firebase
* API did not load .env, so FIREBASE_AUTH_EMULATOR_HOST is not actually set at runtime
* firebase-admin was initialized before env vars were loaded
* Multiple initialization paths exist in main.ts and firebase-admin.ts

Fix strategy

1. Confirm the API process has FIREBASE_AUTH_EMULATOR_HOST at runtime
2. Ensure firebase-admin initializes once, after env is loaded
3. Ensure frontend either connects to Auth emulator or uses real Auth consistently
4. Always test with a freshly minted token after changes

Why
Token issuer and token verifier must align, otherwise verification fails.

---

## 12. Organization Resolution

All routes under

```
/orgs/:orgId/*
```

Require

* Valid membership
* membership status active

Middleware attaches

* req.user
* req.orgContext

---

## 13. RBAC Model

Action-based enforcement.

Controllers declare required action. RBAC middleware compares role to matrix.

Roles

* owner
* admin
* member

---

## 14. Data Storage

Firestore

* Organizations
* Memberships
* Audit
* Usage

Cloud SQL

* documents
* doc_chunks
* doc_embeddings

Cloud Storage

* Raw document files

---

## 15. Governance Guarantees

* No cross-tenant access
* All SQL queries filtered by org_id
* No document text in logs
* Embeddings treated as sensitive
* Deletion is idempotent

---

## 16. Deployment Model

* Cloud Run API
* Cloud SQL with pgvector
* Firestore
* Cloud Storage
* Secret Manager
* Cloud Scheduler for retention

Environments

* dev
* staging
* prod

---

## 17. Lessons Learned

Document operational issues here.

### Nested Git Repository

Issue
Nest CLI created a nested git repository inside api.

Impact
Git refused to add api folder.

Resolution
Removed api/.git and tracked api as a normal directory.

### Running npm from Wrong Directory

Issue
Attempted to run npm from repo root.

Impact
ENOENT package.json error.

Resolution
Run npm commands from the api directory.

### Auth Middleware Blocking Health Route

Issue
401 on all routes including health.

Resolution
Explicitly exclude health route in middleware configuration.

### Next.js scaffold conflict in existing folder

Issue
create-next-app refused to scaffold because the directory contained conflicting files.

Impact
Setup stalled.

Resolution
Use a clean directory or remove conflicting files before scaffolding.

Why
create-next-app protects you from overwriting existing work.

### Emulators require Java 21+

Issue
firebase-tools refused to start emulators without Java 21+.

Impact
Local emulators could not run.

Resolution
Install JDK 21+ and ensure it is on PATH.

### Storage emulator requires rules

Issue
Storage emulator shut down because no rules file was configured.

Impact
Emulator suite stopped.

Resolution
Add storage.rules and reference it in firebase.json.

### Token invalid due to environment mismatch

Issue
Frontend could mint a token, but API rejected it as invalid.

Impact
Blocked end-to-end auth validation.

Resolution
Align emulator usage across frontend and API, and ensure API loads env vars before initializing firebase-admin.

---

## 18. Contribution Guidelines

Before committing

* Ensure no secrets in code
* Ensure org_id filters exist in SQL
* Ensure RBAC action mapped
* Ensure audit event added for protected actions
* Update documentation if architecture changes

---

## 19. Architecture Discipline Rules

* No direct database access in controllers
* All access goes through service layer
* All protected routes declare action requirement
* No document text in logs
* All deletions must cascade

---

Status
Handbook is living documentation.
