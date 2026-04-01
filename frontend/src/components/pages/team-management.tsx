import React, { useEffect, useState } from "react";
import { db, app } from "@/lib/firebaseClient";
import { collection, onSnapshot, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/StatusBadge";

type Role = "analyst" | "auditor" | "viewer";

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: "analyst",
    label: "Analyst",
    description: "Upload docs, run AI analysis, create remediations",
  },
  {
    value: "auditor",
    label: "Auditor",
    description: "Read-only access, can export evidence packages",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "View dashboards only",
  },
];

const ROLE_BADGE: Record<string, string> = {
  analyst: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  auditor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  viewer: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

interface Member {
  id: string;
  email: string;
  role: Role;
  status: string;
}

export const UserManagement = ({ orgId }: { orgId: string }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [editRole, setEditRole] = useState<Role>("viewer");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const functions = getFunctions(app, "us-central1");
  const inviteUserFn = httpsCallable(functions, "inviteUserToOrg");
  const updateRoleFn = httpsCallable(functions, "updateMemberRole");
  const cancelInviteFn = httpsCallable(functions, "cancelMemberInvite");
  const removeMemberFn = httpsCallable(functions, "removeMemberRecord");

  useEffect(() => {
    if (!orgId) return;
    const q = query(collection(db, `orgs/${orgId}/members`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMembers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Member),
        );
      },
      (error) => console.error("Firestore error:", error.message),
    );
    return () => unsubscribe();
  }, [orgId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      await inviteUserFn({ orgId, email, role });
      setFeedback({
        type: "success",
        message: `Invitation sent to ${email} as ${role}.`,
      });
      setIsInviteOpen(false);
      setEmail("");
      setRole("viewer");
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message ?? "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (member: Member) => {
    setEditingMember(member);
    setEditRole(member.role ?? "viewer");
  };

  const handleEditSave = async () => {
    if (!editingMember) return;
    setLoading(true);
    try {
      await updateRoleFn({
        orgId,
        memberId: editingMember.id,
        newRole: editRole,
      });
      setFeedback({
        type: "success",
        message: `${editingMember.email} is now a${editRole === "analyst" ? "n" : ""} ${editRole}.`,
      });
      setEditingMember(null);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message ?? "Failed to update role.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (member: Member) => {
    if (!confirm(`Cancel invite for ${member.email}?`)) return;
    setLoading(true);
    try {
      await cancelInviteFn({ orgId, memberId: member.id });
      setFeedback({
        type: "success",
        message: `Invite for ${member.email} has been cancelled.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message ?? "Failed to cancel invite.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancelled = async (member: Member) => {
    if (!confirm(`Permanently remove ${member.email} from the list?`)) return;
    setLoading(true);
    try {
      await removeMemberFn({ orgId, memberId: member.id });
      setFeedback({ type: "success", message: `${member.email} removed.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove member.";
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (member: Member) => {
    // Placeholder — wire in next pass
    setFeedback({ type: "error", message: "Remove not yet implemented." });
  };

  const RoleCards = ({
    selected,
    onChange,
  }: {
    selected: Role;
    onChange: (r: Role) => void;
  }) => (
    <div className="flex flex-col gap-2">
      {ROLE_OPTIONS.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            selected === option.value
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/50"
          }`}
        >
          <input
            type="radio"
            name="role"
            value={option.value}
            checked={selected === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 accent-[hsl(var(--accent))]"
          />
          <div>
            <div className="text-sm font-semibold text-foreground capitalize">
              {option.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {option.description}
            </div>
          </div>
        </label>
      ))}
    </div>
  );

  return (
    <>
      {/* ── Invite Modal ── */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border p-8 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Invite Team Member
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Assign a role to control what this person can access.
            </p>
            <form onSubmit={handleInvite}>
              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  placeholder="colleague@agency.gov"
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Role
                </label>
                <RoleCards selected={role} onChange={setRole} />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-accent text-accent-foreground font-bold"
                >
                  {loading ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Role Modal ── */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border p-8 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-foreground mb-1">
              Edit Access
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Changing role for{" "}
              <span className="text-foreground font-medium">
                {editingMember.email}
              </span>
            </p>
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                New Role
              </label>
              <RoleCards selected={editRole} onChange={setEditRole} />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleEditSave}
                disabled={loading || editRole === editingMember.role}
                className="bg-accent text-accent-foreground font-bold disabled:opacity-40"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Table ── */}
      <div className="p-6 bg-background min-h-screen text-foreground">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Team Management</h2>
            <p className="text-muted-foreground text-sm">
              Manage access and roles for your organization
            </p>
          </div>
          <Button
            onClick={() => setIsInviteOpen(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            + Invite User
          </Button>
        </div>

        {feedback && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="rounded-xl overflow-x-auto border border-border bg-card">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No team members found. Start by inviting someone.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-accent/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">
                        {member.email}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter opacity-50">
                        {member.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 text-xs rounded-full border capitalize font-medium ${
                          ROLE_BADGE[member.role] ?? ROLE_BADGE.viewer
                        }`}
                      >
                        {member.role || "viewer"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={member.status || "active"} />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {member.status !== "cancelled" && (
                        <button
                          onClick={() => handleEditOpen(member)}
                          className="text-muted-foreground hover:text-foreground mr-4 text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {member.status === "invited" ? (
                        <button
                          onClick={() => handleCancelInvite(member)}
                          className="text-yellow-600 hover:text-yellow-700 text-sm font-medium transition-colors"
                        >
                          Cancel Invite
                        </button>
                      ) : member.status === "cancelled" ? (
                        <button
                          onClick={() => handleDeleteCancelled(member)}
                          disabled={loading}
                          className="text-destructive hover:text-destructive/80 text-sm font-medium transition-colors disabled:opacity-40"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemove(member)}
                          className="text-destructive hover:text-destructive/80 text-sm font-medium transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
