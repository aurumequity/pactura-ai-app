# Pactura Role-Based Access Control (RBAC) v1

## Overview

Pactura uses organization-scoped role-based access control to ensure that users can only perform actions appropriate to their role within an organization.

RBAC is enforced exclusively in the API layer.  
Client-side checks are considered advisory only.

All access decisions are evaluated after:
1. Firebase identity verification
2. Organization membership resolution
3. Role validation

---

## Roles

Pactura defines three roles per organization.

### Owner

The Owner is the highest-privilege role.

Responsibilities:
- Organization ownership
- Billing and plan management
- Role assignment
- Governance configuration

Notes:
- Each organization has exactly one Owner
- Ownership transfer is out of scope for v1

---

### Admin

Admins manage day-to-day operations.

Responsibilities:
- Invite and remove members
- Upload and delete documents
- Configure retention policies
- View audit logs

Admins cannot:
- Change billing plans
- Delete the organization
- Promote users to Owner

---

### Member

Members are standard users.

Responsibilities:
- Upload documents (if allowed by org settings)
- Query documents using the AI interface
- View documents they have access to

Members cannot:
- Invite users
- Delete documents
- View audit logs
- Modify governance settings

---

## Role Assignment Model

Membership records live at:

organizations/{orgId}/memberships/{userId}

Each membership record contains:
- userId
- role
- status

RBAC enforcement uses the role value from this record only.  
Client-provided role information is ignored.

---

## Action-Based Authorization

Access control is enforced using action names mapped to roles.

Each API route declares:
- actionName
- allowedRoles
- auditEventType

Authorization is evaluated before handler execution.

---

## RBAC Matrix

| Action | Owner | Admin | Member |
|------|------|------|------|
| org.view | yes | yes | yes |
| org.update | yes | yes | no |
| org.delete | yes | no | no |
| billing.view | yes | yes | no |
| billing.update | yes | no | no |
| members.list | yes | yes | yes |
| members.invite | yes | yes | no |
| members.remove | yes | yes | no |
| members.role.update | yes | no | no |
| documents.list | yes | yes | yes |
| documents.upload | yes | yes | yes |
| documents.view | yes | yes | yes |
| documents.delete | yes | yes | no |
| retention.view | yes | yes | no |
| retention.update | yes | yes | no |
| chat.session.create | yes | yes | yes |
| chat.session.list | yes | yes | yes |
| chat.session.delete | yes | yes | yes* |
| chat.message.send | yes | yes | yes |
| audit.list | yes | yes | no |

*Members may only delete chat sessions they created.

---

## Enforcement Rules

1. All RBAC checks occur server-side
2. Every request must include orgId context
3. Membership status must be active
4. Role must be explicitly allowed for the action
5. Missing or invalid roles result in 403 responses

---

## Audit Integration

Sensitive actions generate audit events.

Examples:
- member_invited
- member_removed
- document_uploaded
- document_deleted
- retention_updated
- ai_query_submitted

Audit events include:
- orgId
- actorUserId
- action type
- requestId
- timestamp

Audit events never include document text or AI context.

---

## Security Invariants

- No cross-organization access is possible
- Role escalation is restricted to Owner
- Deleted memberships immediately revoke access
- RBAC checks are mandatory for every protected route

---

## Future Extensions

Potential v2 enhancements:
- Read-only roles
- Document-level permissions
- Temporary access grants
- External collaborator roles

These are intentionally out of scope for v1.