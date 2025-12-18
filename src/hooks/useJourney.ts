import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";

interface DaySummary {
  date: string;
  totalReps: number;
  isComplete: boolean;
}

interface JourneyData {
  nickname: string;
  dailySummaries: DaySummary[];
  totalReps: number;
  currentStreak: number;
  bestStreak: number;
}

export const useJourney = (userId: string) => {
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");
  const year = new Date().getFullYear();
  const januaryStart = format(new Date(year, 0, 1), "yyyy-MM-dd");
  const januaryEnd = format(new Date(year, 0, 31), "yyyy-MM-dd");

  const calculateStreaks = (summaries: DaySummary[]) => {
    const summaryMap = new Map(summaries.map(s => [s.date, s]));
    
    // Current streak
    let currentStreak = 0;
    const todayDate = startOfDay(new Date());
    let checkDate = todayDate;
    
    const todaySummary = summaryMap.get(today);
    if (!todaySummary?.isComplete) {
      checkDate = subDays(todayDate, 1);
    }

    for (let i = 0; i < 31; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const summary = summaryMap.get(dateStr);
      
      if (summary?.isComplete) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Best streak
    let bestStreak = 0;
    let tempStreak = 0;
    
    for (let day = 1; day <= 31; day++) {
      const dateStr = format(new Date(year, 0, day), "yyyy-MM-dd");
      const summary = summaryMap.get(dateStr);
      
      if (summary?.isComplete) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak, bestStreak };
  };

  const fetchJourney = useCallback(async () => {
    if (!userId) return;

    try {
      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", userId)
        .single();

      // Get all daily summaries for January
      const { data: summaries } = await supabase
        .from("daily_summary")
        .select("log_date, total_reps, is_complete")
        .eq("user_id", userId)
        .gte("log_date", januaryStart)
        .lte("log_date", januaryEnd);

      const dailySummaries: DaySummary[] = (summaries || []).map(s => ({
        date: s.log_date,
        totalReps: s.total_reps,
        isComplete: s.is_complete,
      }));

      const totalReps = dailySummaries.reduce((sum, s) => sum + s.totalReps, 0);
      const { currentStreak, bestStreak } = calculateStreaks(dailySummaries);

      setData({
        nickname: profile?.nickname || "Anonymous",
        dailySummaries,
        totalReps,
        currentStreak,
        bestStreak,
      });
    } catch (err) {
      console.error("Error fetching journey:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, januaryStart, januaryEnd, today, year]);

  useEffect(() => {
    fetchJourney();
  }, [fetchJourney]);

  return { data, loading, refetch: fetchJourney };
};
