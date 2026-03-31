# Pactura.ai — Staff Architect Context

## What This Is

Pactura.ai is a high-stakes GovTech compliance automation platform for federal
contractors targeting CMMC Level 2 certification. Every UI and architectural
decision must reflect a "Secure Operations Center" aesthetic and support
audit-defensible workflows.

## Tech Stack

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- Backend: Firebase Cloud Functions v2 (Node.js 24, TypeScript)
- Database: Firestore with immutable sub-collection audit logs
- Auth: Firebase Auth
- AI: Anthropic Claude SDK (claude-sonnet-4-20250514)
- Email: Resend (noreply@pactura.ai)
- Hosting: Firebase / Vercel

## Brand Identity

- Primary Navy: #1a2a4a
- Secondary Navy: #3b5998
- Gold Accent: #C9A84C (use gradients for 3D fiber-optic logo matching)
- Background: #0A1628 (near-black navy)
- Aesthetic: Defense Tech — sharp corners (4px max radius), high information
  density, SOC (Secure Operations Center) vibes
- Always dark mode by default
- Monospaced fonts for all data points, scores, and IDs
- Logo: /public/pactura-logo-transparent.png (dark surfaces)
  /public/pactura-logo-dark.png (light surfaces/emails)

## The 7 Architectural Pillars

Every feature must satisfy at least one of these:

1. IMMUTABLE AUDITABILITY — Every AI action logged: user, timestamp,
   document ID, action, result. Nothing happens without a trail.
2. REMEDIATION OVER INSIGHTS — Don't just find gaps, create actionable
   tasks. Every anomaly needs status (Open/Resolved), assignee, due date.
3. VERSION + DELTA LOGIC — Documents are living entities. Support versioning
   and Compliance Deltas (v1 vs v2 comparison).
4. BENCHMARKING + CONTEXT — Data without context is noise. Always show
   how a score compares to industry/vertical benchmarks.
5. RBAC (NEED-TO-KNOW) — Analysts execute. Auditors read-only + export.
   Viewers see dashboards only. Enforced at API layer, not just UI.
6. EVIDENCE PACKAGING — The product IS the output. Prioritize audit-ready
   PDF exports. The "Generate Auditor Evidence Package" button is a primary CTA.
7. GOLDEN PATH ONBOARDING — 60-second flow: raw PDF upload to first
   executive risk summary.

## UI Patterns to Follow

### Dashboard

- Lead with "Audit Readiness Score" as a Health Dial, not a number
- Surface "Critical Anomalies" above all other metrics
- If AI detects a gap, the relevant card gets a subtle gold glow pulse animation
- Never use vanity metrics as primary KPIs

### AI Assistant (Floating Chatbot)

- Trigger: Gold Shield icon, fixed lower-right corner
- UI: Glassmorphism panel with react-markdown support for tables
- Must be action-oriented: when AI finds a missing clause, show a
  "Generate Amendment" button inline in the chat response
- Closing the loop between insight and action is the core differentiator

### Evidence Package Button

- Gold-bordered, "Security" aesthetic
- Label: "Generate Auditor Evidence Package"
- Pillar 6 — this is always a primary CTA, never buried

### Auditor Portal (Placeholder)

- Keep middleware/auth logic extensible for a future /auditor route
- View-only access to evidence packages only
- No write permissions, no AI access, no team data
- This is the enterprise contract-winning feature

## RBAC Role Definitions

- org_admin: full access, invite/remove users, all AI features
- analyst: upload docs, run AI analysis, create remediations
- auditor: read-only, export evidence packages only
- viewer: dashboards only, no documents, no AI

## File Structure Reference

frontend/src/
app/
(dashboard)/
layout.tsx ← global theme, sidebar
dashboard/page.tsx ← health dial, anomalies, audit score
documents/ ← document list, analysis, versioning
audit-log/ ← immutable log viewer
team/ ← RBAC management
settings/
components/
pages/ ← full page components
team/ ← InviteModal, EditRoleModal, MemberTable
ui/ ← StatusBadge, PacturaLogo, shadcn
hooks/ ← useTeamMembers, useSidebar
services/ ← team.service.ts, all Cloud Function calls
types/ ← team.types.ts, shared interfaces
lib/
constants/roles.ts ← ROLE_OPTIONS, ROLE_BADGE map
firebaseClient.ts

functions/src/
index.ts ← inviteUserToOrg, updateMemberRole,
cancelMemberInvite, AI analysis endpoint

## Code Constraints

- TypeScript strict mode — no `any` types on new code
- No localStorage for sensitive data
- Never hardcode API keys — use Firebase Secret Manager
- All AI calls must write to the auditLog sub-collection
- Responsive: mobile-first, test at 375px / 768px / 1280px
- No em dashes or semicolons in user-facing copy
- Use Tailwind responsive prefixes only (sm: md: lg:)
- Forms use React event handlers, never HTML form submit to external URLs

## Current Demo Status

Three items remaining before demo-ready:

1. seed-prod.js rewrite with realistic federal procurement documents
2. Federal buyer demo script
3. Complete single-document analysis run-through with all four tabs populated

## Federal Buyer Demo Tips (keep in mind for every feature)

- Show disabled buttons for non-admin roles — proves RBAC is real
- Show auditLog sub-collection populating in Firestore in real-time
- Lead with the Evidence Package export as the closing move
- Every feature should have a one-sentence CMMC compliance mapping ready
