import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminGroups } from "@/hooks/useAdminGroups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Copy, RefreshCw, Eye, UserMinus, Plus, LogOut, Loader2, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useGroups } from "@/hooks/useGroups";

interface ActivityLog {
  id: string;
  log_date: string;
  reps: number;
  logged_at: string;
}

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { groups, loading, regenerateInviteCode, removeMember, getMemberLogs, canCreateGroup, refetch } = useAdminGroups();
  const { createGroup } = useGroups();

  const [viewLogsModal, setViewLogsModal] = useState<{ open: boolean; nickname: string; logs: ActivityLog[] }>({
    open: false,
    nickname: "",
    logs: [],
  });
  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; groupId: string; memberId: string; nickname: string }>({
    open: false,
    groupId: "",
    memberId: "",
    nickname: "",
  });
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleCopyLink = async (inviteCode: string) => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCode(inviteCode);
      toast.success("Invite link copied!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleEmailInvite = (inviteCode: string, groupName: string) => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    const subject = encodeURIComponent(`Join ${groupName} - January 100 Challenge!`);
    const body = encodeURIComponent(
      `Hey! I'd like to invite you to join my group "${groupName}" for the January 100 Challenge (100 press-ups every day in January).\n\nClick the link below to join:\n\n${link}\n\nLet's do this together!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleRegenerateLink = async (groupId: string) => {
    try {
      await regenerateInviteCode(groupId);
      toast.success("Invite link regenerated!");
    } catch {
      toast.error("Failed to regenerate link");
    }
  };

  const handleViewLogs = async (memberId: string, nickname: string) => {
    try {
      const logs = await getMemberLogs(memberId);
      setViewLogsModal({ open: true, nickname, logs });
    } catch {
      toast.error("Failed to load logs");
    }
  };

  const handleRemoveMember = async () => {
    try {
      await removeMember(removeConfirm.groupId, removeConfirm.memberId);
      toast.success(`${removeConfirm.nickname} has been removed`);
      setRemoveConfirm({ open: false, groupId: "", memberId: "", nickname: "" });
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim().length < 2) {
      toast.error("Group name must be at least 2 characters");
      return;
    }

    setCreating(true);
    try {
      await createGroup(newGroupName.trim());
      toast.success("Group created!");
      setCreateGroupModal(false);
      setNewGroupName("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!user) return;

    setResetting(true);
    try {
      // Delete all activity logs
      const { error: logsError } = await supabase
        .from("activity_logs")
        .delete()
        .neq("user_id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (logsError) throw logsError;

      // Delete all group memberships
      const { error: membershipsError } = await supabase
        .from("group_memberships")
        .delete()
        .neq("user_id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (membershipsError) throw membershipsError;

      // Delete all groups
      const { error: groupsError } = await supabase
        .from("groups")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (groupsError) throw groupsError;

      // Delete all profiles except current user
      const { error: profilesError } = await supabase
        .from("profiles")
        .delete()
        .neq("id", user.id);

      if (profilesError) throw profilesError;

      toast.success("Database reset successfully!");
      setResetConfirm(false);
      refetch();
    } catch (err: any) {
      console.error("Reset error:", err);
      toast.error(err.message || "Failed to reset database");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-safe pb-8">
        {/* Header */}
        <header className="pt-6 pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        </header>

        {/* Admin Groups Section */}
        {groups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
              My Groups (Admin)
            </h2>

            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                  {/* Group Header */}
                  <div className="p-4 border-b border-border/50">
                    <h3 className="font-semibold text-foreground mb-3">{group.name}</h3>
                    
                    {/* Invite Link */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(group.inviteCode)}
                          className="flex-1"
                        >
                          {copiedCode === group.inviteCode ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy link
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEmailInvite(group.inviteCode, group.name)}
                          className="flex-1"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateLink(group.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="divide-y divide-border/50">
                    {group.members.map((member) => (
                      <div key={member.userId} className="p-3 flex items-center justify-between">
                        <span className="text-sm text-foreground">
                          {member.nickname}
                          {member.userId === user?.id && (
                            <span className="text-muted-foreground"> (you)</span>
                          )}
                        </span>
                        
                        {member.userId !== user?.id && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewLogs(member.userId, member.nickname)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setRemoveConfirm({
                                  open: true,
                                  groupId: group.id,
                                  memberId: member.userId,
                                  nickname: member.nickname,
                                })
                              }
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {group.members.length === 0 && (
                      <p className="p-3 text-sm text-muted-foreground">No members yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Group Button */}
        {canCreateGroup && (
          <Button
            variant="outline"
            className="w-full mb-8"
            onClick={() => setCreateGroupModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create new group
          </Button>
        )}

        {/* Reset Database (Admin Only) */}
        <div className="mb-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
          <p className="text-sm text-muted-foreground mb-3">
            <strong className="text-destructive">Danger Zone:</strong> Reset all data and start fresh (keeps your account)
          </p>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setResetConfirm(true)}
          >
            Reset Database
          </Button>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>

      {/* View Logs Modal */}
      <Dialog open={viewLogsModal.open} onOpenChange={(open) => !open && setViewLogsModal({ open: false, nickname: "", logs: [] })}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewLogsModal.nickname}'s Activity Logs</DialogTitle>
            <DialogDescription>Recent activity entries (read-only)</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 mt-4">
            {viewLogsModal.logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No logs found</p>
            ) : (
              viewLogsModal.logs.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{format(new Date(log.log_date), "EEE, d MMM")}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.logged_at), "h:mm a")}
                    </p>
                  </div>
                  <span className="font-semibold">{log.reps} reps</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={removeConfirm.open} onOpenChange={(open) => !open && setRemoveConfirm({ open: false, groupId: "", memberId: "", nickname: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeConfirm.nickname}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from the group. They can rejoin using an invite link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Group Modal */}
      <Dialog open={createGroupModal} onOpenChange={setCreateGroupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new group</DialogTitle>
            <DialogDescription>Give your group a name</DialogDescription>
          </DialogHeader>

          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            className="mt-4"
            maxLength={50}
          />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCreateGroupModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={creating || newGroupName.trim().length < 2}
              className="bg-[#00A699] hover:bg-[#00A699]/90 text-white"
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Database Confirmation */}
      <AlertDialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Database?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All activity logs</li>
                <li>All groups</li>
                <li>All group memberships</li>
                <li>All user profiles (except yours)</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDatabase}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground"
            >
              {resetting ? "Resetting..." : "Reset Database"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
