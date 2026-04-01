"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Mail, ShieldCheck, FileSearch, AlertTriangle, FileDown, ClipboardList } from "lucide-react";

const SECTIONS = [
  {
    title: "Audit Summary",
    icon: ShieldCheck,
    description: "AI-generated contract overview",
    items: [
      {
        q: "What is the Audit Summary?",
        a: "The Audit Summary provides an AI-generated overview of a contract — including contract type, key parties, effective dates, term length, total value, key obligations, and compliance flags. It gives you a quick read on what the contract contains and any immediate concerns.",
      },
      {
        q: "How do I generate an Audit Summary?",
        a: "Click the ✦ (sparkle) icon on any document card. The AI will analyze the full document and populate the Audit Summary tab within the expanded card.",
      },
      {
        q: "What are Compliance Flags?",
        a: "Compliance Flags are issues or risks identified in the contract during audit analysis. They are rated Critical, Warning, or Info based on severity and appear at the bottom of the Audit Summary tab.",
      },
    ],
  },
  {
    title: "Gap Check",
    icon: FileSearch,
    description: "Framework compliance analysis",
    items: [
      {
        q: "What is a Gap Check?",
        a: "A Gap Check evaluates your contract against a compliance framework. For each requirement, it reports whether the contract is Compliant, has a Gap, or is Partial — along with supporting evidence from the document and a recommended remediation action.",
      },
      {
        q: "What frameworks are available?",
        a: "Pactura supports FAR (Federal Acquisition Regulation), DFARS (Defense Federal Acquisition Regulation Supplement), CMMC (Cybersecurity Maturity Model Certification), and ITAR (International Traffic in Arms Regulations). Select the relevant framework from the Gap Check tab on any document card.",
      },
      {
        q: "Where do Gap Check results go?",
        a: "Results are saved to the document and appear in the Gap Check tab. Any identified gaps are automatically converted into remediation items visible on the Dashboard's Recent Activity feed.",
      },
    ],
  },
  {
    title: "Anomaly Report",
    icon: AlertTriangle,
    description: "Unusual or risky clause detection",
    items: [
      {
        q: "What is the Anomaly Report?",
        a: "The Anomaly Report scans the contract for unusual, non-standard, or potentially risky clauses. Each anomaly is rated Critical, High, or Medium based on its potential impact.",
      },
      {
        q: "What counts as Critical or High?",
        a: "Critical anomalies are clauses that could create significant legal or financial exposure — e.g., unlimited liability, unilateral termination rights, or IP ownership conflicts. High anomalies are clauses that deviate significantly from standard practice and warrant close review.",
      },
      {
        q: "How do I run the Anomaly Report?",
        a: "Open a document card, expand it, and navigate to the Anomalies tab. Click 'Run Anomaly Detection' to analyze the document. Results are saved and will also update the Flagged Clauses count on the Dashboard.",
      },
    ],
  },
  {
    title: "Evidence Package",
    icon: FileDown,
    description: "Downloadable audit report PDF",
    items: [
      {
        q: "What is an Evidence Package?",
        a: "The Evidence Package is a PDF report that bundles the Audit Summary, Gap Check results, and Anomaly Report for a document into a single file suitable for auditors, contracting officers, or legal review.",
      },
      {
        q: "How do I download an Evidence Package?",
        a: "Click the download (↓) icon on any document card. The package will be generated and downloaded automatically. All three analyses must be complete for a full package.",
      },
      {
        q: "Who should receive the Evidence Package?",
        a: "The Evidence Package is designed for auditors, contracting officers, or program managers who need a concise record of the AI compliance review. Auditor-role users have download access by default.",
      },
    ],
  },
  {
    title: "Dashboard & Activity",
    icon: ClipboardList,
    description: "Understanding your pipeline overview",
    items: [
      {
        q: "What does 'Pending Review' mean?",
        a: "A document is Pending Review when an Audit Summary has not yet been generated. Click the ✦ Analyze button on the document card to complete the analysis and remove it from Pending Review.",
      },
      {
        q: "What does 'Completed' mean?",
        a: "A document is Completed when it has a full Audit Summary, at least one Gap Check result, and an Anomaly Report — all three AI analyses have been run on the latest version.",
      },
      {
        q: "Why isn't my gap check showing in Recent Activity?",
        a: "Recent Activity shows the last 5 events across remediations and gap checks. If you've run many events, older ones may scroll off. Gap checks appear with a purple 'Gap Check' badge; remediations show a severity dot and status badge.",
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-foreground hover:text-accent transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {q}
        {open
          ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export function HelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Help & FAQ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Learn how to use Pactura's AI reports and get the most out of the platform.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <section.icon className="size-4 text-accent" aria-hidden="true" />
              <CardTitle className="text-base">{section.title}</CardTitle>
            </div>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {section.items.map((item) => (
              <AccordionItem key={item.q} q={item.q} a={item.a} />
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Still need help?</CardTitle>
          <CardDescription>
            Reach out to the Pactura team for additional questions or to report an issue.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <a
            href="mailto:info@pactura.ai"
            className="flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            <Mail className="size-4" aria-hidden="true" />
            info@pactura.ai
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
