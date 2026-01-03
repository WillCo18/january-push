import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DayLog {
  day: number;
  count: number;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  logs: DayLog[];
}

const DAILY_TARGET = 100;
const JANUARY_DAYS = 31;

export const useChallenge = () => {
  const { user } = useAuth();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentDay = today.getMonth() === 0 ? today.getDate() : JANUARY_DAYS; // If not January, show all 31 days
  const currentMonth = today.getMonth();
  const isJanuary = currentMonth === 0;

  const [userLogs, setUserLogs] = useState<DayLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's daily summaries for January
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get all daily summaries for January of the current year
        const startDate = `${currentYear}-01-01`;
        const endDate = `${currentYear}-01-31`;

        const { data, error } = await supabase
          .from("daily_summary")
          .select("log_date, total_reps")
          .eq("user_id", user.id)
          .gte("log_date", startDate)
          .lte("log_date", endDate);

        if (error) throw error;

        // Convert to DayLog format
        const logs: DayLog[] = (data || []).map(row => ({
          day: new Date(row.log_date).getDate(),
          count: row.total_reps
        }));

        setUserLogs(logs);
      } catch (err) {
        console.error("Error fetching user stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();

    // Subscribe to realtime updates on daily_summary
    if (user) {
      const channel = supabase
        .channel('profile-stats')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_summary',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchUserStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, currentYear]);

  const getLogForDay = useCallback((day: number): number => {
    return userLogs.find(l => l.day === day)?.count || 0;
  }, [userLogs]);

  const todayCount = useMemo(() => getLogForDay(currentDay), [getLogForDay, currentDay]);

  const totalCount = useMemo(() => 
    userLogs.reduce((sum, log) => sum + log.count, 0), 
    [userLogs]
  );

  const completedDays = useMemo(() => 
    userLogs.filter(log => log.count >= DAILY_TARGET).length,
    [userLogs]
  );

  const currentStreak = useMemo(() => {
    let streak = 0;
    const effectiveDay = isJanuary ? currentDay : JANUARY_DAYS;
    
    for (let day = effectiveDay; day >= 1; day--) {
      const count = getLogForDay(day);
      if (count >= DAILY_TARGET) {
        streak++;
      } else if (day < effectiveDay) {
        break;
      }
    }
    return streak;
  }, [currentDay, isJanuary, getLogForDay]);

  // Leaderboard is now handled by useLeaderboard hook
  const leaderboard = useMemo(() => {
    return [{
      id: "user",
      name: "You",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
      totalCount,
      streak: currentStreak,
      isCurrentUser: true,
    }];
  }, [totalCount, currentStreak]);

  return {
    currentDay: isJanuary ? currentDay : JANUARY_DAYS,
    isJanuary,
    todayCount,
    totalCount,
    completedDays,
    currentStreak,
    userLogs,
    leaderboard,
    dailyTarget: DAILY_TARGET,
    totalDays: JANUARY_DAYS,
    getLogForDay,
    loading,
  };
};
