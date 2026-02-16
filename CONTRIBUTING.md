# Contributing to Pactura

## Purpose

This document defines the standards for contributing to Pactura.

All changes must preserve:

* Tenant isolation
* RBAC enforcement
* Audit integrity
* Data classification rules
* Retention guarantees

This is a governed system. Discipline matters.

---

## Before You Begin

1. Read `docs/13-engineering-handbook.md`
2. Review relevant ADR files
3. Understand the RBAC model
4. Confirm you are not bypassing enforcement layers

---

## Branching Strategy

* `main` is protected
* Create feature branches:

```
feature/<short-description>
fix/<short-description>
chore/<short-description>
```

Example:

```
feature/document-upload
```

---

## Development Rules

### 1. No Direct Database Access in Controllers

Controllers must call services.

Bad:

```
controller → Firestore directly
```

Correct:

```
controller → service → Firestore
```

---

### 2. Every Protected Route Must Declare an Action

All routes under `/orgs/:orgId` must:

* Define required RBAC action
* Pass through RBAC middleware

If you add a route:

* Add action to `actions.ts`
* Update RBAC matrix
* Update Route-to-Action map
* Update API spec

---

### 3. Always Filter by org_id

All SQL queries must include:

```
WHERE org_id = ?
```

Never assume tenant context.

---

### 4. No Sensitive Data in Logs

Never log:

* Document text
* Chunk text
* Embeddings
* LLM prompts
* LLM responses

Logs may include:

* IDs
* Counts
* Metadata

---

### 5. Deletion Must Cascade

Deleting a document must:

* Remove SQL record
* Remove chunk rows
* Remove embedding rows
* Remove Cloud Storage object
* Write audit event

Deletion must be idempotent.

---

## Documentation Requirements

If you change:

* API surface → update `04-api-spec.md`
* RBAC model → update `03-rbac.md`
* Data model → update `02-data-model.md`
* Governance logic → update `05-governance.md`
* Architecture decisions → create or update ADR

Documentation updates are not optional.

---

## Commit Standards

Commit messages must be clear and scoped.

Examples:

```
feat: add document upload endpoint
fix: enforce org_id filter in vector query
chore: remove nested git repo in api
```

Avoid vague commits like:

```
updates
fix stuff
changes
```

---

## Pull Request Checklist

Before merging:

* [ ] Code builds
* [ ] No secrets committed
* [ ] All SQL filtered by org_id
* [ ] RBAC action declared
* [ ] Audit event written if required
* [ ] Documentation updated
* [ ] Tests added or updated

---

## Security Discipline

If unsure:

* Default to deny
* Default to tenant isolation
* Default to explicit validation

Security and governance are product features.

---

## Lessons Learned

Add operational lessons to:

```
docs/13-engineering-handbook.md
```

Do not bury operational learnings in commit history.

---

## Final Principle

Pactura is not just an AI tool.
It is a governed, multi-tenant platform.

Every change must respect that standard.

