import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useGroups = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkGroupMembership = async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("group_memberships")
      .select("group_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking group membership:", error);
      return null;
    }
    
    return data;
  };

  const getAdminGroupsCount = async () => {
    if (!user) return 0;
    
    const { count, error } = await supabase
      .from("groups")
      .select("*", { count: "exact", head: true })
      .eq("admin_id", user.id);
    
    if (error) {
      console.error("Error counting admin groups:", error);
      return 0;
    }
    
    return count || 0;
  };

  const generateInviteCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createGroup = async (name: string) => {
    if (!user) throw new Error("Not authenticated");
    
    setLoading(true);
    try {
      // Check if user already has 3 groups as admin
      const adminCount = await getAdminGroupsCount();
      if (adminCount >= 3) {
        throw new Error("You can only create a maximum of 3 groups");
      }

      const inviteCode = generateInviteCode();
      
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name,
          invite_code: inviteCode,
          admin_id: user.id,
        })
        .select()
        .single();
      
      if (groupError) throw groupError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from("group_memberships")
        .insert({
          user_id: user.id,
          group_id: group.id,
        });
      
      if (memberError) throw memberError;

      return group;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkGroupMembership,
    createGroup,
    getAdminGroupsCount,
    loading,
  };
};
