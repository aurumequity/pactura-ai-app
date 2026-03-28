import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

admin.initializeApp();

// — Types
type Role = "analyst" | "auditor" | "viewer";

interface InviteUserPayload {
  orgId: string;
  email: string;
  role: Role;
}
// ── Helper: Write to the immutable audit log (Pillar 1) ───────────────────────
async function writeAuditLog(params: {
  orgId: string;
  actorUid: string;
  action: string;
  targetEmail: string;
  role: string;
  result: "SUCCESS" | "FAILURE";
  reason?: string;
}) {
  await admin
    .firestore()
    .collection(`orgs/${params.orgId}/auditLog`)
    .add({
      ...params,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: "inviteUserToOrg",
    });
}

// ── Cloud Function ─────────────────────────────────────────────────────────────
export const inviteUserToOrg = onCall(
  {
    cors: true,
    region: "us-central1",
  },
  async (request) => {
    // 1. Auth check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { orgId, email, role } = request.data as InviteUserPayload;
    const requesterUid = request.auth.uid;

    if (!orgId || !email || !role) {
      throw new HttpsError(
        "invalid-argument",
        "orgId, email, and role are required.",
      );
    }

    // 2. Look up the org document
    const orgDoc = await admin.firestore().collection("orgs").doc(orgId).get();
    const orgData = orgDoc.data();

    // Diagnostic log — visible in GCP Cloud Logging
    console.log("[inviteUserToOrg] Auth audit:", {
      requesterUid,
      orgOwnerId: orgData?.ownerId ?? "FIELD_MISSING",
      orgExists: orgDoc.exists,
      match: orgData?.ownerId === requesterUid,
    });

    // 3. RBAC check: only the org owner can invite
    if (!orgData || orgData.ownerId !== requesterUid) {
      await writeAuditLog({
        orgId,
        actorUid: requesterUid,
        action: "INVITE_USER",
        targetEmail: email,
        role,
        result: "FAILURE",
        reason: orgData
          ? "Requester is not the org owner"
          : "Org document not found",
      });

      throw new HttpsError(
        "permission-denied",
        "Only the Org Admin can invite members.",
      );
    }

    // 4. Write the member to the sub-collection
    const memberRef = admin
      .firestore()
      .collection(`orgs/${orgId}/members`)
      .doc();

    await memberRef.set({
      email: email.toLowerCase(),
      role: role || "viewer",
      status: "invited",
      invitedBy: requesterUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Write the success audit log (Pillar 1)
    await writeAuditLog({
      orgId,
      actorUid: requesterUid,
      action: "INVITE_USER",
      targetEmail: email,
      role,
      result: "SUCCESS",
    });

    return { success: true, memberId: memberRef.id };
  },
);

export const updateMemberRole = onCall(
  { cors: true, region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { orgId, memberId, newRole } = request.data as {
      orgId: string;
      memberId: string;
      newRole: Role;
    };
    const requesterUid = request.auth.uid;

    // RBAC: only org owner can change roles
    const orgDoc = await admin.firestore().collection("orgs").doc(orgId).get();
    const orgData = orgDoc.data();

    if (!orgData || orgData.ownerId !== requesterUid) {
      await writeAuditLog({
        orgId,
        actorUid: requesterUid,
        action: "UPDATE_MEMBER_ROLE",
        targetEmail: memberId,
        role: newRole,
        result: "FAILURE",
        reason: "Requester is not the org owner",
      });
      throw new HttpsError(
        "permission-denied",
        "Only the Org Admin can change roles.",
      );
    }

    await admin
      .firestore()
      .collection(`orgs/${orgId}/members`)
      .doc(memberId)
      .update({
        role: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    await writeAuditLog({
      orgId,
      actorUid: requesterUid,
      action: "UPDATE_MEMBER_ROLE",
      targetEmail: memberId,
      role: newRole,
      result: "SUCCESS",
    });

    return { success: true };
  },
);
export const cancelMemberInvite = onCall(
  { cors: true, region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { orgId, memberId } = request.data as {
      orgId: string;
      memberId: string;
    };
    const requesterUid = request.auth.uid;

    // RBAC: only org owner can cancel invites
    const orgDoc = await admin.firestore().collection("orgs").doc(orgId).get();
    const orgData = orgDoc.data();

    if (!orgData || orgData.ownerId !== requesterUid) {
      throw new HttpsError(
        "permission-denied",
        "Only the Org Admin can cancel invites.",
      );
    }

    // Only cancel if still in invited state
    const memberRef = admin
      .firestore()
      .collection(`orgs/${orgId}/members`)
      .doc(memberId);

    const memberDoc = await memberRef.get();
    const memberData = memberDoc.data();

    if (!memberDoc.exists || memberData?.status !== "invited") {
      throw new HttpsError(
        "failed-precondition",
        "Invite is no longer pending.",
      );
    }

    // Soft delete: mark as cancelled, never hard delete (Pillar 1)
    await memberRef.update({
      status: "cancelled",
      cancelledBy: requesterUid,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await writeAuditLog({
      orgId,
      actorUid: requesterUid,
      action: "CANCEL_INVITE",
      targetEmail: memberData?.email ?? memberId,
      role: memberData?.role ?? "unknown",
      result: "SUCCESS",
    });

    return { success: true };
  },
);
