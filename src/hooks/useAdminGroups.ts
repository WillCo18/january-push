import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GroupMember {
  userId: string;
  nickname: string;
}

interface AdminGroup {
  id: string;
  name: string;
  inviteCode: string;
  members: GroupMember[];
}

export const useAdminGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminGroups = useCallback(async () => {
    if (!user) return;

    try {
      // Get groups where user is admin
      const { data: adminGroups, error: groupsError } = await supabase
        .from("groups")
        .select("id, name, invite_code")
        .eq("admin_id", user.id);

      if (groupsError) throw groupsError;

      if (!adminGroups?.length) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // For each group, get members
      const groupsWithMembers: AdminGroup[] = await Promise.all(
        adminGroups.map(async (group) => {
          const { data: memberships } = await supabase
            .from("group_memberships")
            .select("user_id")
            .eq("group_id", group.id);

          const memberIds = memberships?.map(m => m.user_id) || [];
          
          let members: GroupMember[] = [];
          if (memberIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, nickname")
              .in("id", memberIds);

            members = (profiles || []).map(p => ({
              userId: p.id,
              nickname: p.nickname || "Anonymous",
            }));
          }

          return {
            id: group.id,
            name: group.name,
            inviteCode: group.invite_code,
            members,
          };
        })
      );

      setGroups(groupsWithMembers);
    } catch (err) {
      console.error("Error fetching admin groups:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAdminGroups();
  }, [fetchAdminGroups]);

  const regenerateInviteCode = async (groupId: string) => {
    // Use RPC to generate unique invite code server-side
    const { data: newCode, error: rpcError } = await supabase
      .rpc('generate_unique_invite_code');

    if (rpcError) throw rpcError;

    const { error } = await supabase
      .from("groups")
      .update({ invite_code: newCode })
      .eq("id", groupId);

    if (error) throw error;

    setGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, inviteCode: newCode } : g))
    );

    return newCode;
  };

  const removeMember = async (groupId: string, memberId: string) => {
    const { error } = await supabase
      .from("group_memberships")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", memberId);

    if (error) throw error;

    setGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, members: g.members.filter(m => m.userId !== memberId) }
          : g
      )
    );
  };

  const getMemberLogs = async (memberId: string) => {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, log_date, reps, logged_at")
      .eq("user_id", memberId)
      .order("logged_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  };

  const updateGroupName = async (groupId: string, newName: string) => {
    const { error } = await supabase
      .from("groups")
      .update({ name: newName })
      .eq("id", groupId);

    if (error) throw error;

    setGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, name: newName } : g))
    );
  };

  return {
    groups,
    loading,
    refetch: fetchAdminGroups,
    regenerateInviteCode,
    removeMember,
    getMemberLogs,
    updateGroupName,
    canCreateGroup: groups.length < 3,
  };
};
