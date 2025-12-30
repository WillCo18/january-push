import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";

interface DayProgress {
  date: string;
  reps: number;
  isComplete: boolean;
}

interface MemberProgress {
  userId: string;
  nickname: string;
  days: DayProgress[];
}

export const useGroupProgress = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState<string | null>(null);

  const fetchGroupProgress = useCallback(async () => {
    if (!user) return;

    try {
      // Get user's group
      const { data: membership } = await supabase
        .from("group_memberships")
        .select("group_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership?.group_id) {
        setLoading(false);
        return;
      }

      // Get group name
      const { data: group } = await supabase
        .from("groups")
        .select("name")
        .eq("id", membership.group_id)
        .single();

      setGroupName(group?.name || null);

      // Get all members in the group
      const { data: memberships } = await supabase
        .from("group_memberships")
        .select("user_id")
        .eq("group_id", membership.group_id);

      if (!memberships?.length) {
        setLoading(false);
        return;
      }

      const memberIds = memberships.map(m => m.user_id);

      // Get profiles for all members
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nickname")
        .in("id", memberIds);

      // Get current week dates
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

      // Get activity logs for all members for the current week
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(weekEnd, "yyyy-MM-dd");

      const { data: logs } = await supabase
        .from("activity_logs")
        .select("user_id, log_date, reps")
        .in("user_id", memberIds)
        .gte("log_date", startDate)
        .lte("log_date", endDate);

      // Build member progress data
      const memberProgress: MemberProgress[] = (profiles || []).map(profile => {
        const days = weekDays.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayLogs = (logs || []).filter(
            log => log.user_id === profile.id && log.log_date === dateStr
          );
          const totalReps = dayLogs.reduce((sum, log) => sum + log.reps, 0);

          return {
            date: dateStr,
            reps: totalReps,
            isComplete: totalReps >= 100,
          };
        });

        return {
          userId: profile.id,
          nickname: profile.nickname || "Anonymous",
          days,
        };
      });

      // Sort: current user first, then by nickname
      memberProgress.sort((a, b) => {
        if (a.userId === user.id) return -1;
        if (b.userId === user.id) return 1;
        return a.nickname.localeCompare(b.nickname);
      });

      setMembers(memberProgress);
    } catch (err) {
      console.error("Error fetching group progress:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroupProgress();
  }, [fetchGroupProgress]);

  return {
    members,
    groupName,
    loading,
    refetch: fetchGroupProgress,
  };
};
