# ADR 0003 – Firebase Authentication for Identity

Status: Accepted  
Date: 2026-02-15  
Owner: Pactura Core

## Context

Pactura requires secure user authentication with minimal operational overhead.

Requirements:
- Email-based login
- Token-based authentication
- Integration with frontend
- No password storage in backend

## Decision

Use Firebase Authentication for identity.

The API layer will:
- Verify Firebase ID tokens
- Extract userId
- Resolve membership in Firestore
- Enforce RBAC server-side

Firebase handles identity only.
Authorization is enforced within Pactura.

## Alternatives Considered

1. Custom JWT authentication
   - More flexibility
   - Increased security burden

2. Auth0 or third-party provider
   - Higher cost
   - Additional dependency

3. Firebase Auth
   - Managed service
   - Tight frontend integration
   - Minimal overhead

## Consequences

Positive:
- Fast implementation
- Secure token verification
- Reduced operational complexity

Negative:
- Vendor dependency
- Limited customization compared to custom auth