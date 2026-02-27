# Pactura — User Persona Matrix

## Demo Companies

### Meridian Defense Solutions
Mid-size federal defense contractor based in Huntsville, AL.
**Story arc:** Upcoming CMMC audit in 30 days with expiring documents and subcontractor compliance gaps.
**Personas:** Marcus Webb (PM), Jordan Tate (Engineering)

### Vantage Federal Group
Compliance-focused federal contractor and consulting firm based in Arlington, VA.
**Story arc:** Post-audit improvement — compliance scorecard shows measurable gains after Pactura implementation.
**Personas:** David Nguyen (CCO), Renee Okafor (CEO)

### Hargrove & Ellis LLP
Washington D.C. law firm handling federal matters and privileged client documentation.
**Story arc:** Unauthorized document access incident drives need for privilege flagging and stronger access controls.
**Personas:** Simone Carter (Senior Associate)

---

## Stakeholder Matrix

| Role                  | Federal Contracting    | Financial Services     | Healthcare             | Insurance              | Legal                  |
|-----------------------|------------------------|------------------------|------------------------|------------------------|------------------------|
| Executive             | —                      | Renee Okafor ✅        | TBD                    | TBD                    | TBD                    |
| Compliance Officer    | David Nguyen ✅        | TBD                    | TBD                    | TBD                    | —                      |
| Operations / PM Lead  | Marcus Webb ✅         | —                      | —                      | TBD                    | —                      |
| IT / Engineering Lead | Jordan Tate ✅         | —                      | —                      | —                      | TBD                    |
| HR Professional       | —                      | TBD                    | TBD                    | —                      | —                      |
| End User              | —                      | —                      | TBD                    | TBD                    | Simone Carter ✅       |

---

## Fully Developed Personas

### Profile 1 — Marcus Webb
- **Title:** Project Manager
- **Company:** Meridian Defense Solutions
- **Location:** Huntsville, AL
- **Industry:** Federal Contracting
- **Problem Statement:** Managing subcontractor document compliance across a portfolio of active contracts with an audit in 30 days. Documents are scattered, some are expiring, and he has no single view of what's missing.
- **Dashboard Focus:** Task deadlines, document expiration alerts, team assignments, subcontractor compliance status
- **Key Documents:** FAR Clause Checklist, CMMC Level 2 Assessment, Subcontractor Agreements
- **Pain Points:** No centralized visibility, manual tracking in spreadsheets, can't tell at a glance what's expired or missing
- **What he needs to see in a demo:** Expiring document alerts, a compliance checklist with red/green status, and task assignments to team members

---

### Profile 2 — David Nguyen
- **Title:** Chief Compliance Officer
- **Company:** Vantage Federal Group
- **Location:** Arlington, VA
- **Industry:** Federal Contracting
- **Problem Statement:** Responsible for maintaining NIST 800-171 compliance across the organization but has no real-time visibility into document governance gaps. Relies on manual audits.
- **Dashboard Focus:** Compliance scorecard, upcoming audit dates, framework tracking, policy acknowledgement status
- **Key Documents:** NIST 800-171 Reports, Audit Trails, Policy Acknowledgements, Access Logs
- **Pain Points:** Can't produce an audit trail on demand, policy acknowledgements aren't tracked systematically, version history is unreliable
- **What he needs to see in a demo:** A compliance scorecard with measurable improvement over time, clean audit trail export, and version-controlled policy documents

---

### Profile 3 — Jordan Tate
- **Title:** Senior Integration Engineer
- **Company:** Meridian Defense Solutions
- **Location:** Huntsville, AL
- **Industry:** Federal Contracting
- **Problem Statement:** Tasked with integrating Pactura into the company's existing tech stack. Needs to evaluate security architecture, API availability, and SSO compatibility before recommending adoption.
- **Dashboard Focus:** API keys, integration status, webhook logs, connected systems, SSO configuration
- **Key Documents:** Technical architecture docs, integration specs, security assessments
- **Pain Points:** Most compliance tools have poor APIs, no SSO, and require heavy manual configuration. Black-box security is a dealbreaker.
- **What he needs to see in a demo:** API documentation, SSO/SAML support, role-based access controls at the API level, and a clear security model

---

### Profile 4 — Simone Carter
- **Title:** Senior Associate
- **Company:** Hargrove & Ellis LLP
- **Location:** Washington D.C.
- **Industry:** Legal
- **Problem Statement:** Manages privileged client documents across multiple active matters. A recent unauthorized access incident exposed a gap in access controls that put client privilege at risk.
- **Dashboard Focus:** Active matters, document access logs, client folders, privilege flags
- **Key Documents:** Privileged Client Memos, NDA Repository, Matter Files, Court Filings
- **Pain Points:** No audit trail on who accessed what, privilege protection is manual, document organization across matters is inconsistent
- **What she needs to see in a demo:** Access logs showing who viewed a document and when, privilege flagging, matter-scoped folders with role-based access, and an exportable audit report

---

### Profile 5 — Renee Okafor
- **Title:** Principal / CEO
- **Company:** Vantage Federal Group
- **Location:** Arlington, VA
- **Industry:** Financial Services (executive crossover)
- **Problem Statement:** As CEO, she needs board-level visibility into the organization's document governance posture without getting into the weeds. She wants ROI proof before expanding Pactura company-wide.
- **Dashboard Focus:** Full system view, user management, billing, all documents across all users, executive compliance summary
- **Key Documents:** Board reports, company-wide policy documents, audit summaries
- **Pain Points:** No executive summary view, can't benchmark compliance improvement over time, no single number that communicates risk posture to the board
- **What she needs to see in a demo:** An executive dashboard with a compliance score, trend line showing improvement, user activity summary, and a one-click audit report

---

## Personas in Development (TBD)

| Industry           | Role                  | Company (suggested)          |
|--------------------|-----------------------|------------------------------|
| Financial Services | Compliance Officer    | Vantage Financial Group      |
| Financial Services | HR Professional       | Vantage Financial Group      |
| Healthcare         | Compliance Officer    | Meridian Health              |
| Healthcare         | HR Professional       | Meridian Health              |
| Healthcare         | End User              | Meridian Health              |
| Insurance          | Operations / PM Lead  | Coastal Insurance Group      |
| Insurance          | Compliance Officer    | Coastal Insurance Group      |
| Insurance          | End User              | Coastal Insurance Group      |
| Legal              | Executive             | Hargrove & Ellis LLP         |
| Legal              | IT / Engineering Lead | Hargrove & Ellis LLP         |

---

## Demo Org Seed Data

| Org ID  | Name                        | Industry             |
|---------|-----------------------------|----------------------|
| org-001 | Meridian Defense Solutions  | Federal Contracting  |
| org-002 | Vantage Financial Group     | Financial Services   |
| org-003 | Meridian Health             | Healthcare           |
| org-004 | Coastal Insurance Group     | Insurance            |
| org-005 | Hargrove & Ellis LLP        | Legal                |

*All orgs seeded via `npm run seed` with test@pactura.ai as admin.*
