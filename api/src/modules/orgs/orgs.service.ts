import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

export interface OrgResult {
  id: string;
  name: string;
  slug: string | null;
  plan: string | null;
  role: string;
}

@Injectable()
export class OrgsService {
  private db = admin.firestore();

  async getOrgsForUser(uid: string): Promise<OrgResult[]> {
    const orgsSnap = await this.db.collection('orgs').get();
    if (orgsSnap.empty) return [];

    const results: OrgResult[] = [];

    for (const orgDoc of orgsSnap.docs) {
      const memberSnap = await this.db
        .collection('orgs')
        .doc(orgDoc.id)
        .collection('memberships')
        .doc(uid)
        .get();

      if (memberSnap.exists && memberSnap.data()?.status === 'active') {
        const data = orgDoc.data();
        results.push({
          id: orgDoc.id,
          name: data.name,
          slug: data.slug ?? null,
          plan: data.plan ?? null,
          role: memberSnap.data()?.role ?? 'member',
        });
      }
    }

    return results;
  }

  async supportChat(
    orgId: string,
    uid: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<{ reply: string }> {
    // Verify membership
    const memberSnap = await this.db
      .collection('orgs')
      .doc(orgId)
      .collection('memberships')
      .doc(uid)
      .get();
    if (!memberSnap.exists || memberSnap.data()?.status !== 'active') {
      throw new Error('Not a member of this organization');
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are Pactura's support assistant — a friendly, knowledgeable expert on the Pactura contract intelligence platform. Help users understand and use Pactura's features effectively.

Pactura's core features:
- **Audit Summary**: AI-generated contract overview (contract type, parties, dates, value, obligations, compliance flags). Triggered by the ✦ Analyze button on a document card.
- **Gap Check**: Evaluates a contract against compliance frameworks — FAR, DFARS, CMMC, ITAR. Reports Compliant / Gap / Partial per requirement with evidence and remediation recommendations.
- **Anomaly Report**: Scans for unusual or risky clauses, rated Critical / High / Medium. Critical+High count appears on the Dashboard as "Flagged Clauses".
- **Evidence Package**: PDF bundle of Audit Summary + Gap Check + Anomaly Report, downloadable via the ↓ icon on any document card. Intended for auditors and contracting officers.
- **Document Chat**: AI assistant for asking questions about a specific document's content, gaps, and risks. Opened via the chat bubble icon on a document card.
- **Remediations**: Auto-generated from Gap Check gaps. Tracked as Open / In Progress / Resolved.
- **Dashboard stats**: Total Contracts, Pending Review (no Audit Summary yet), Flagged Clauses (critical+high anomalies), Completed (all three analyses done).
- **Audit Log**: Record of all actions taken in the organization.
- **Team Management**: Invite members, assign roles (Analyst, Auditor, Viewer), cancel invites.
- **Roles**: Analyst = full access; Auditor = read-only + download evidence packages; Viewer = dashboards only.

Keep answers concise and practical. If a question is outside Pactura's scope, suggest contacting info@pactura.ai.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    return { reply };
  }
}
