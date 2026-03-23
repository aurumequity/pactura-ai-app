const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
const fs = require('fs');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'pactura-prod',
  storageBucket: 'pactura-prod.firebasestorage.app',
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
const UID = '0xV17loIriZuhSIv1zavyzOjbgo2';

const BASE_PATH = `/Users/ddeamues/Desktop/Pactura.ai Info/Test Data`;

const DOCS = [
  // Coastal Insurance Group — org-004
  { orgId: 'org-004', folder: 'Coastal-Insurance-Group', file: 'CIG_Reinsurance_Treaty_QuotaShare_2026.pdf' },
  { orgId: 'org-004', folder: 'Coastal-Insurance-Group', file: 'CIG_Actuarial_Reserve_Report_Q4_2025.pdf' },
  { orgId: 'org-004', folder: 'Coastal-Insurance-Group', file: 'CIG_Claims_Handling_Policy_SOP_2026.pdf' },
  // Hargrove & Ellis LLP — org-005
  { orgId: 'org-005', folder: 'Hargrove-Ellis-LLP', file: 'HE_NDA_Template_Standard_v4.2.pdf' },
  { orgId: 'org-005', folder: 'Hargrove-Ellis-LLP', file: 'HE_Client_Retainer_Agreement_NovaTech.pdf' },
  { orgId: 'org-005', folder: 'Hargrove-Ellis-LLP', file: 'HE_Litigation_Hold_Notice_2026.pdf' },
  // Meridian Health — org-003
  { orgId: 'org-003', folder: 'Meridian-Health', file: 'MH_HIPAA_Risk_Assessment_Q1_2026.pdf' },
  { orgId: 'org-003', folder: 'Meridian-Health', file: 'MH_Business_Associate_Agreement_CloudMed.pdf' },
  { orgId: 'org-003', folder: 'Meridian-Health', file: 'MH_Patient_Data_Processing_SOP_PHI007.pdf' },
  // Meridian Defense Solutions — org-001
  { orgId: 'org-001', folder: 'Meridian-Defense-Solutions', file: 'MDS_CMMC_Level2_Compliance_Checklist.pdf' },
  { orgId: 'org-001', folder: 'Meridian-Defense-Solutions', file: 'MDS_DoD_Prime_Contract_2026.pdf' },
  { orgId: 'org-001', folder: 'Meridian-Defense-Solutions', file: 'MDS_SAM_Registration_Renewal_2026.pdf' },
  { orgId: 'org-001', folder: 'Meridian-Defense-Solutions', file: 'MDS_Subcontractor_NDA_CyberShield.pdf' },
  // Vantage Financial Group — org-002
  { orgId: 'org-002', folder: 'Vantage-Financial-Group', file: 'VFG_Investment_Management_Agreement_Northbrook.pdf' },
  { orgId: 'org-002', folder: 'Vantage-Financial-Group', file: 'VFG_SEC_Form_ADV_Part2A_2026.pdf' },
  { orgId: 'org-002', folder: 'Vantage-Financial-Group', file: 'VFG_KYC_AML_Compliance_Package_2026.pdf' },
];

async function upload() {
  for (const doc of DOCS) {
    const localPath = path.join(BASE_PATH, doc.folder, doc.file);
    const storagePath = `orgs/${doc.orgId}/documents/${doc.file}`;

    console.log(`Uploading ${doc.file}...`);

    // Upload to Storage
    await bucket.upload(localPath, {
      destination: storagePath,
      metadata: { contentType: 'application/pdf' },
    });

    // Create Firestore document record
    const docRef = db.collection('orgs').doc(doc.orgId).collection('documents').doc();
    await docRef.set({
      name: doc.file.replace('.pdf', '').replace(/_/g, ' '),
      fileType: 'application/pdf',
      storagePath,
      status: 'active',
      uploadedBy: UID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ ${doc.file}`);
  }

  console.log('\n🎉 All documents uploaded and indexed!');
  process.exit(0);
}

upload().catch(err => { console.error(err); process.exit(1); });
