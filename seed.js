#!/usr/bin/env node
/**
 * Pactura Dev Seed Script
 * Creates a test user, all five demo orgs with memberships, and sample documents.
 * Run: npm run seed
 */
const EMULATOR_AUTH = "http://localhost:9099";
const EMULATOR_FIRESTORE = "http://localhost:8080";
const PROJECT_ID = "pactura-dev";
const API_KEY = "fake-api-key-for-emulator";
const TEST_EMAIL = "test@pactura.ai";
const TEST_PASSWORD = "password123";

const ORGS = [
  { id: "org-001", name: "Meridian Defense Solutions", industry: "Federal Contracting" },
  { id: "org-002", name: "Vantage Financial Group",    industry: "Financial Services"  },
  { id: "org-003", name: "Meridian Health",            industry: "Healthcare"          },
  { id: "org-004", name: "Coastal Insurance Group",    industry: "Insurance"           },
  { id: "org-005", name: "Hargrove & Ellis LLP",       industry: "Legal"               },
];

const DOCUMENTS = {
  "org-001": [
    { name: "CMMC Compliance Policy.pdf",           fileType: "application/pdf", storagePath: "orgs/org-001/docs/cmmc-compliance-policy.pdf" },
    { name: "DoD Subcontractor Agreement.pdf",      fileType: "application/pdf", storagePath: "orgs/org-001/docs/dod-subcontractor-agreement.pdf" },
    { name: "Federal Data Handling Procedures.pdf", fileType: "application/pdf", storagePath: "orgs/org-001/docs/federal-data-handling.pdf" },
  ],
  "org-002": [
    { name: "FINRA Supervisory Procedures.pdf",     fileType: "application/pdf", storagePath: "orgs/org-002/docs/finra-supervisory-procedures.pdf" },
    { name: "Customer Data Privacy Policy.pdf",     fileType: "application/pdf", storagePath: "orgs/org-002/docs/customer-data-privacy.pdf" },
    { name: "AML Compliance Framework.pdf",         fileType: "application/pdf", storagePath: "orgs/org-002/docs/aml-compliance-framework.pdf" },
  ],
  "org-003": [
    { name: "HIPAA Security Risk Assessment.pdf",   fileType: "application/pdf", storagePath: "orgs/org-003/docs/hipaa-risk-assessment.pdf" },
    { name: "Patient Data Access Policy.pdf",       fileType: "application/pdf", storagePath: "orgs/org-003/docs/patient-data-access.pdf" },
    { name: "Business Associate Agreement.pdf",     fileType: "application/pdf", storagePath: "orgs/org-003/docs/baa-template.pdf" },
  ],
  "org-004": [
    { name: "Claims Processing SOC 2 Report.pdf",   fileType: "application/pdf", storagePath: "orgs/org-004/docs/soc2-report.pdf" },
    { name: "Policyholder Data Retention Policy.pdf", fileType: "application/pdf", storagePath: "orgs/org-004/docs/data-retention-policy.pdf" },
    { name: "Vendor Risk Management Policy.pdf",    fileType: "application/pdf", storagePath: "orgs/org-004/docs/vendor-risk-management.pdf" },
  ],
  "org-005": [
    { name: "Client Confidentiality Agreement.pdf", fileType: "application/pdf", storagePath: "orgs/org-005/docs/client-confidentiality.pdf" },
    { name: "GDPR Data Processing Addendum.pdf",    fileType: "application/pdf", storagePath: "orgs/org-005/docs/gdpr-dpa.pdf" },
    { name: "Matter File Retention Schedule.pdf",   fileType: "application/pdf", storagePath: "orgs/org-005/docs/matter-retention-schedule.pdf" },
  ],
};

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": "Bearer owner",
};

async function firestoreSet(path, fields) {
  const url = `${EMULATOR_FIRESTORE}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: ADMIN_HEADERS,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore write failed for ${path}: ${text}`);
  }
  return res.json();
}

async function firestoreAdd(collectionPath, fields) {
  const url = `${EMULATOR_FIRESTORE}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionPath}`;
  const res = await fetch(url, {
    method: "POST",
    headers: ADMIN_HEADERS,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore add failed for ${collectionPath}: ${text}`);
  }
  return res.json();
}

async function seed() {
  console.log("🌱 Seeding Firebase emulators...\n");

  // 1. Create or sign in test user
  let uid, token;
  const signUpRes = await fetch(
    `${EMULATOR_AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
    }
  );
  const signUpData = await signUpRes.json();
  if (signUpData.localId) {
    uid = signUpData.localId;
    token = signUpData.idToken;
    console.log(`✅ Created user: ${TEST_EMAIL}`);
  } else {
    const signInRes = await fetch(
      `${EMULATOR_AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
      }
    );
    const signInData = await signInRes.json();
    if (!signInData.localId) {
      console.error("❌ Failed to create or sign in user:", signInData);
      process.exit(1);
    }
    uid = signInData.localId;
    token = signInData.idToken;
    console.log(`✅ Signed in existing user: ${TEST_EMAIL}`);
  }
  console.log("");

  // 2. Create all orgs + memberships + documents
  for (const org of ORGS) {
    await firestoreSet(`orgs/${org.id}`, {
      name:      { stringValue: org.name      },
      industry:  { stringValue: org.industry  },
      ownerId:   { stringValue: uid           },
      createdAt: { stringValue: new Date().toISOString() },
    });

    await firestoreSet(`orgs/${org.id}/memberships/${uid}`, {
      status:   { stringValue: "active"               },
      role:     { stringValue: "admin"                },
      joinedAt: { stringValue: "2026-01-01T00:00:00Z" },
    });

    const docs = DOCUMENTS[org.id] || [];
    for (const doc of docs) {
      await firestoreAdd(`orgs/${org.id}/documents`, {
        name:        { stringValue: doc.name        },
        fileType:    { stringValue: doc.fileType    },
        storagePath: { stringValue: doc.storagePath },
        status:      { stringValue: "active"        },
        uploadedBy:  { stringValue: uid             },
        createdAt:   { stringValue: new Date().toISOString() },
        updatedAt:   { stringValue: new Date().toISOString() },
      });
    }

    console.log(`✅ ${org.name} (${org.id}) — ${docs.length} documents seeded`);
  }

  console.log("\n🎉 Seed complete!\n");
  console.log(`📋 UID:   ${uid}`);
  console.log(`🔑 TOKEN: ${token}`);
  console.log(`\nTOKEN="${token}"\n`);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});