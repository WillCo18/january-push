import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfDay } from "date-fns";

interface LeaderboardMember {
  userId: string;
  nickname: string;
  todayReps: number;
  todayComplete: boolean;
  streak: number;
  totalCappedReps: number;
  isCurrentUser: boolean;
}

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");
  const januaryStart = format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd");

  const calculateStreak = (summaries: { log_date: string; is_complete: boolean }[]): number => {
    if (!summaries.length) return 0;

    // Sort by date descending
    const sorted = [...summaries].sort((a, b) => 
      new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );

    let streak = 0;
    const todayDate = startOfDay(new Date());
    let checkDate = todayDate;

    // Check if today is complete
    const todaySummary = sorted.find(s => s.log_date === today);
    
    // If today is not complete, start checking from yesterday
    if (!todaySummary?.is_complete) {
      checkDate = subDays(todayDate, 1);
    }

    // Count consecutive complete days
    for (let i = 0; i < 31; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const summary = sorted.find(s => s.log_date === dateStr);
      
      if (summary?.is_complete) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const fetchLeaderboard = useCallback(async () => {
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

      // Get group info
      const { data: group } = await supabase
        .from("groups")
        .select("name, invite_code")
        .eq("id", membership.group_id)
        .single();

      setGroupName(group?.name || null);
      setInviteCode(group?.invite_code || null);

      // Get all group members
      const { data: groupMembers } = await supabase
        .from("group_memberships")
        .select("user_id")
        .eq("group_id", membership.group_id);

      if (!groupMembers?.length) {
        setLoading(false);
        return;
      }

      const memberIds = groupMembers.map(m => m.user_id);

      // Get profiles for all members
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nickname")
        .in("id", memberIds);

      // Get all daily summaries for January
      const { data: summaries } = await supabase
        .from("daily_summary")
        .select("user_id, log_date, total_reps, capped_reps, is_complete")
        .in("user_id", memberIds)
        .gte("log_date", januaryStart);

      // Build leaderboard data
      const leaderboardData: LeaderboardMember[] = (profiles || []).map(profile => {
        const userSummaries = (summaries || []).filter(s => s.user_id === profile.id);
        const todaySummary = userSummaries.find(s => s.log_date === today);
        
        const totalCappedReps = userSummaries.reduce((sum, s) => sum + s.capped_reps, 0);
        const streak = calculateStreak(userSummaries);

        return {
          userId: profile.id,
          nickname: profile.nickname || "Anonymous",
          todayReps: todaySummary?.total_reps || 0,
          todayComplete: todaySummary?.is_complete || false,
          streak,
          totalCappedReps,
          isCurrentUser: profile.id === user.id,
        };
      });

      // Sort: primary by streak (desc), secondary by totalCappedReps (desc)
      leaderboardData.sort((a, b) => {
        if (b.streak !== a.streak) return b.streak - a.streak;
        return b.totalCappedReps - a.totalCappedReps;
      });

      setMembers(leaderboardData);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }, [user, today, januaryStart]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Real-time subscription for daily_summary changes (group member updates)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_summary',
        },
        (payload) => {
          console.log('Daily summary change:', payload);
          // Refetch leaderboard when any daily_summary changes
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLeaderboard]);

  return {
    members,
    groupName,
    inviteCode,
    loading,
    refetch: fetchLeaderboard,
  };
};
