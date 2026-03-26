const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'pactura-prod',
});

const db = admin.firestore();

const UID = '0xV17loIriZuhSIv1zavyzOjbgo2';

const ORGS = [
  { id: 'org-001', name: 'Meridian Defense Solutions', industry: 'Federal Contracting' },
  { id: 'org-002', name: 'Vantage Financial Group',    industry: 'Financial Services'  },
  { id: 'org-003', name: 'Meridian Health',            industry: 'Healthcare'          },
  { id: 'org-004', name: 'Coastal Insurance Group',    industry: 'Insurance'           },
  { id: 'org-005', name: 'Hargrove & Ellis LLP',       industry: 'Legal'               },
];

async function seed() {
  for (const org of ORGS) {
    await db.collection('orgs').doc(org.id).set({
      name: org.name,
      industry: org.industry,
      ownerId: UID,
      createdAt: new Date().toISOString(),
    });
    await db.collection('orgs').doc(org.id)
      .collection('memberships').doc(UID).set({
        status: 'active',
        role: 'org_admin',
        joinedAt: '2026-01-01T00:00:00Z',
      });
    console.log(`✅ ${org.name}`);
  }
  console.log('\n🎉 Production seed complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });