import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  startOfDay,
  subDays,
} from "date-fns";

interface DayProgress {
  date: string;
  reps: number;
  isComplete: boolean;
}

interface MemberProgress {
  userId: string;
  nickname: string;
  days: DayProgress[];
  // Used for ordering; UI can ignore
  streak: number;
  daysCompleted: number;
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

      const memberIds = memberships.map((m) => m.user_id);

      // Get profiles for all members
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nickname")
        .in("id", memberIds);

      // Pull daily completion summaries for ordering (streak / days completed)
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const januaryStart = format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd");

      const { data: summaries } = await supabase
        .from("daily_summary")
        .select("user_id, log_date, is_complete")
        .in("user_id", memberIds)
        .gte("log_date", januaryStart);

      const calculateStreak = (userSummaries: { log_date: string; is_complete: boolean }[]) => {
        if (!userSummaries.length) return 0;

        // Sort by date descending
        const sorted = [...userSummaries].sort(
          (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
        );

        let streak = 0;
        const todayDate = startOfDay(new Date());
        let checkDate = todayDate;

        // If today is not complete, start checking from yesterday
        const todaySummary = sorted.find((s) => s.log_date === todayStr);
        if (!todaySummary?.is_complete) {
          checkDate = subDays(todayDate, 1);
        }

        // Count consecutive complete days (max 31 days for January)
        for (let i = 0; i < 31; i++) {
          const dateStr = format(checkDate, "yyyy-MM-dd");
          const summary = sorted.find((s) => s.log_date === dateStr);
          if (summary?.is_complete) {
            streak++;
            checkDate = subDays(checkDate, 1);
          } else {
            break;
          }
        }

        return streak;
      };

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

      const memberProgress: MemberProgress[] = (profiles || []).map((profile) => {
        const days = weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayLogs = (logs || []).filter(
            (log) => log.user_id === profile.id && log.log_date === dateStr
          );
          const totalReps = dayLogs.reduce((sum, log) => sum + log.reps, 0);

          return {
            date: dateStr,
            reps: totalReps,
            isComplete: totalReps >= 100,
          };
        });

        const userSummaries = (summaries || []).filter((s) => s.user_id === profile.id);
        const daysCompleted = userSummaries.filter((s) => s.is_complete).length;
        const streak = calculateStreak(userSummaries);

        return {
          userId: profile.id,
          nickname: profile.nickname || "Anonymous",
          days,
          streak,
          daysCompleted,
        };
      });

      // Sort: current user first, then by streak (desc), then days completed (desc), then nickname
      memberProgress.sort((a, b) => {
        if (a.userId === user.id) return -1;
        if (b.userId === user.id) return 1;
        if (b.streak !== a.streak) return b.streak - a.streak;
        if (b.daysCompleted !== a.daysCompleted) return b.daysCompleted - a.daysCompleted;
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
