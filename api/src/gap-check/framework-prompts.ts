export const VALID_FRAMEWORKS = ['SOC2', 'HIPAA', 'GDPR', 'CMMC', 'FINRA'] as const;
export type FrameworkKey = (typeof VALID_FRAMEWORKS)[number];

interface FrameworkDefinition {
  label: string;
  controls: string[];
}

const FRAMEWORKS: Record<FrameworkKey, FrameworkDefinition> = {
  SOC2: {
    label: 'SOC 2',
    controls: [
      'CC1 – Control Environment',
      'CC2 – Communication and Information',
      'CC3 – Risk Assessment',
      'CC4 – Monitoring of Controls',
      'CC5 – Control Activities',
      'CC6 – Logical and Physical Access Controls',
      'CC7 – System Operations',
      'CC8 – Change Management',
      'CC9 – Risk Mitigation',
      'A1 – Availability',
      'C1 – Confidentiality',
      'PI1 – Processing Integrity',
      'P1-P8 – Privacy',
    ],
  },
  HIPAA: {
    label: 'HIPAA',
    controls: [
      '164.308(a)(1) – Security Management Process',
      '164.308(a)(3) – Workforce Security',
      '164.308(a)(4) – Information Access Management',
      '164.308(a)(5) – Security Awareness and Training',
      '164.308(a)(6) – Security Incident Procedures',
      '164.308(a)(7) – Contingency Plan',
      '164.308(a)(8) – Evaluation',
      '164.310 – Physical Safeguards',
      '164.312 – Technical Safeguards',
      '164.314 – Organizational Requirements',
      '164.316 – Policies and Procedures',
      '164.502 – Uses and Disclosures of PHI',
      '164.524 – Access of Individuals to PHI',
    ],
  },
  GDPR: {
    label: 'GDPR',
    controls: [
      'Art. 5 – Principles of Processing',
      'Art. 6 – Lawfulness of Processing',
      'Art. 7 – Conditions for Consent',
      'Art. 12-14 – Transparency and Notice Obligations',
      'Art. 15-22 – Data Subject Rights',
      'Art. 25 – Data Protection by Design and Default',
      'Art. 28 – Processor Agreements',
      'Art. 30 – Records of Processing Activities',
      'Art. 32 – Security of Processing',
      'Art. 33-34 – Breach Notification',
      'Art. 35 – Data Protection Impact Assessment',
      'Art. 37-39 – Data Protection Officer',
    ],
  },
  CMMC: {
    label: 'CMMC',
    controls: [
      'AC – Access Control',
      'AT – Awareness and Training',
      'AU – Audit and Accountability',
      'CA – Assessment, Authorization, and Monitoring',
      'CM – Configuration Management',
      'IA – Identification and Authentication',
      'IR – Incident Response',
      'MA – Maintenance',
      'MP – Media Protection',
      'PE – Physical Protection',
      'PS – Personnel Security',
      'RA – Risk Assessment',
      'SA – Security Assessment',
      'SC – System and Communications Protection',
      'SI – System and Information Integrity',
    ],
  },
  FINRA: {
    label: 'FINRA',
    controls: [
      'Rule 4370 – Business Continuity Plans',
      'Rule 3110 – Supervision',
      'Rule 3120 – Supervisory Control System',
      'Rule 3130 – Annual Compliance Certification',
      'Rule 4511 – Books and Records',
      'Rule 4512 – Customer Account Information',
      'Reg S-P – Privacy of Consumer Financial Information',
      'Reg S-ID – Identity Theft Red Flags',
      'SEC Reg SCI – Systems Compliance and Integrity',
      'FINRA Cybersecurity – Access Controls',
      'FINRA Cybersecurity – Data Loss Prevention',
      'FINRA Cybersecurity – Incident Response',
    ],
  },
};

export function buildPrompt(frameworkKey: FrameworkKey): string {
  const fw = FRAMEWORKS[frameworkKey];
  const controlList = fw.controls.map((c, i) => `${i + 1}. ${c}`).join('\n');

  return `You are a compliance analyst reviewing the attached document against the ${fw.label} framework.

For each of the following ${fw.label} control areas, determine whether the document explicitly addresses, partially addresses, or does not address the requirement. Base your assessment only on the content of the document — do not assume controls are in place if they are not mentioned.

${fw.label} Control Areas:
${controlList}

Respond ONLY with a valid JSON array. Do not include any preamble, explanation, or markdown fences. Each element must follow this exact shape:
{
  "requirement": "<control area name exactly as listed above>",
  "status": "met" | "partial" | "missing",
  "evidence": "<direct quote or paraphrase from the document that supports your finding, or 'No relevant content found' if missing>",
  "recommendation": "<one concrete action the organization should take, or 'No action needed' if met>"
}`;
}
