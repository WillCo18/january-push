import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const DAILY_TARGET = 100;

export const useActivityLogs = () => {
  const { user } = useAuth();
  const [todayReps, setTodayReps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTodayReps = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("reps")
        .eq("user_id", user.id)
        .eq("log_date", today);

      if (error) throw error;

      const total = data?.reduce((sum, log) => sum + log.reps, 0) || 0;
      setTodayReps(total);
    } catch (err) {
      console.error("Error fetching today's reps:", err);
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  const fetchGroupName = useCallback(async () => {
    if (!user) return;

    try {
      const { data: membership } = await supabase
        .from("group_memberships")
        .select("group_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership?.group_id) {
        const { data: group } = await supabase
          .from("groups")
          .select("name")
          .eq("id", membership.group_id)
          .single();

        setGroupName(group?.name || null);
      }
    } catch (err) {
      console.error("Error fetching group name:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayReps();
    fetchGroupName();
  }, [fetchTodayReps, fetchGroupName]);

  const addReps = async (reps: number, logDate?: string) => {
    if (!user || reps <= 0) return;

    const dateToLog = logDate || today;

    try {
      const { error } = await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          reps,
          log_date: dateToLog,
        });

      if (error) throw error;

      // Update local state if logging for today
      if (dateToLog === today) {
        setTodayReps(prev => prev + reps);
      }

      return true;
    } catch (err) {
      console.error("Error adding reps:", err);
      return false;
    }
  };

  const isComplete = todayReps >= DAILY_TARGET;
  const remaining = Math.max(0, DAILY_TARGET - todayReps);
  const progress = Math.min((todayReps / DAILY_TARGET) * 100, 100);

  return {
    todayReps,
    loading,
    groupName,
    addReps,
    refetch: fetchTodayReps,
    isComplete,
    remaining,
    progress,
    dailyTarget: DAILY_TARGET,
  };
};
