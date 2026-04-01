import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { Resend } from "resend";

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
}): Promise<void> {
  await admin
    .firestore()
    .collection(`orgs/${params.orgId}/auditLog`)
    .add({
      ...params,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: "inviteUserToOrg",
    });
}

// ── Helper: Build branded invite email HTML ───────────────────────────────────
function buildInviteEmailHtml(params: {
  orgName: string;
  role: Role;
  inviteUrl: string;
}): string {
  const { orgName, role, inviteUrl } = params;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to ${orgName} on Pactura.ai</title>
</head>
<body style="margin:0;padding:0;background-color:#0A1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A1628;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img
                src="https://pactura.ai/pactura-logo-dark.png"
                alt="Pactura.ai"
                width="96"
                height="96"
                style="display:block;object-fit:contain;"
              />
              <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#C9A84C;letter-spacing:0.5px;">
                Pactura.ai
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#112040;border-radius:12px;border:1px solid #1e3560;padding:40px 36px;">

              <!-- Heading -->
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.3;">
                You've been invited
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.6;">
                You have been invited to join
                <strong style="color:#FFFFFF;">${orgName}</strong>
                on Pactura.ai as a&nbsp;<strong style="color:#C9A84C;">${roleLabel}</strong>.
              </p>

              <!-- Role badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#0A1628;border:1px solid #C9A84C33;border-radius:8px;padding:14px 20px;">
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#C9A84C;">
                      Your Role
                    </p>
                    <p style="margin:4px 0 0;font-size:17px;font-weight:700;color:#FFFFFF;">
                      ${roleLabel}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a
                      href="${inviteUrl}"
                      style="display:inline-block;background-color:#C9A84C;color:#0A1628;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;"
                    >
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #1e3560;margin:32px 0;" />

              <!-- Footer note -->
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;text-align:center;">
                If you weren't expecting this invitation, you can safely ignore this email.<br/>
                Questions? Contact us at
                <a href="mailto:info@pactura.ai" style="color:#C9A84C;text-decoration:none;">info@pactura.ai</a>
              </p>
            </td>
          </tr>

          <!-- Bottom brand -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#334155;">
                © ${new Date().getFullYear()} Aurum Equity LLC · Pactura.ai
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Cloud Function ─────────────────────────────────────────────────────────────
export const inviteUserToOrg = onCall(
  {
    cors: true,
    region: "us-central1",
    secrets: ["RESEND_API_KEY"],
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

    // 5. Write the success invite audit log (Pillar 1)
    await writeAuditLog({
      orgId,
      actorUid: requesterUid,
      action: "INVITE_USER",
      targetEmail: email,
      role,
      result: "SUCCESS",
    });

    // 6. Send the transactional invite email via Resend
    const orgName: string =
      typeof orgData.name === "string" ? orgData.name : orgId;
    const resend = new Resend(process.env.RESEND_API_KEY);

    let emailResult: "SUCCESS" | "FAILURE" = "SUCCESS";
    let emailFailReason: string | undefined;

    try {
      const { error } = await resend.emails.send({
        from: "noreply@pactura.ai",
        to: email.toLowerCase(),
        subject: `You've been invited to ${orgName} on Pactura.ai`,
        html: buildInviteEmailHtml({
          orgName,
          role,
          inviteUrl: "https://pactura.ai/sign-in",
        }),
      });

      if (error) {
        emailResult = "FAILURE";
        emailFailReason = error.message;
        console.error("[inviteUserToOrg] Resend error:", error);
      }
    } catch (err: unknown) {
      emailResult = "FAILURE";
      emailFailReason =
        err instanceof Error ? err.message : "Unknown email error";
      console.error("[inviteUserToOrg] Email send exception:", err);
    }

    // 7. Write EMAIL_INVITE_SENT audit log regardless of outcome
    await writeAuditLog({
      orgId,
      actorUid: requesterUid,
      action: "EMAIL_INVITE_SENT",
      targetEmail: email,
      role,
      result: emailResult,
      reason: emailFailReason,
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

export const removeMemberRecord = onCall(
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

    // RBAC: only org owner may permanently remove a member record
    const orgDoc = await admin.firestore().collection("orgs").doc(orgId).get();
    const orgData = orgDoc.data();

    if (!orgData || orgData.ownerId !== requesterUid) {
      throw new HttpsError(
        "permission-denied",
        "Only the Org Admin can remove member records.",
      );
    }

    const memberRef = admin
      .firestore()
      .collection(`orgs/${orgId}/members`)
      .doc(memberId);

    const memberDoc = await memberRef.get();
    const memberData = memberDoc.data();

    if (!memberDoc.exists) {
      throw new HttpsError("not-found", "Member record not found.");
    }

    // Audit log before hard delete so the action is always traceable (Pillar 1)
    await writeAuditLog({
      orgId,
      actorUid: requesterUid,
      action: "REMOVE_MEMBER_RECORD",
      targetEmail: memberData?.email ?? memberId,
      role: memberData?.role ?? "unknown",
      result: "SUCCESS",
    });

    await memberRef.delete();

    return { success: true };
  },
);
