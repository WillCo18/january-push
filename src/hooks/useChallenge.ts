import { useState, useCallback, useMemo } from "react";

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

// No mock data - friends will be loaded from database
const generateMockFriends = (): Friend[] => {
  // Return empty array - real friends will come from the database
  return [];
};

export const useChallenge = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const isJanuary = currentMonth === 0;

  // Initialize user logs from localStorage or empty
  const [userLogs, setUserLogs] = useState<DayLog[]>(() => {
    const saved = localStorage.getItem("january100-logs");
    if (saved) {
      return JSON.parse(saved);
    }
    // Start with empty logs - user must log their own data
    return [];
  });

  const [friends] = useState<Friend[]>(generateMockFriends);

  const saveLog = useCallback((day: number, count: number) => {
    setUserLogs(prev => {
      const existing = prev.findIndex(l => l.day === day);
      let updated: DayLog[];
      
      if (existing >= 0) {
        updated = prev.map(l => l.day === day ? { ...l, count } : l);
      } else {
        updated = [...prev, { day, count }];
      }
      
      localStorage.setItem("january100-logs", JSON.stringify(updated));
      return updated;
    });
  }, []);

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
    for (let day = currentDay; day >= 1; day--) {
      const count = getLogForDay(day);
      if (count >= DAILY_TARGET) {
        streak++;
      } else if (day < currentDay) {
        break;
      }
    }
    return streak;
  }, [currentDay, getLogForDay]);

  const leaderboard = useMemo(() => {
    const allParticipants = [
      {
        id: "user",
        name: "You",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
        totalCount,
        streak: currentStreak,
        isCurrentUser: true,
      },
      ...friends.map(friend => ({
        id: friend.id,
        name: friend.name,
        avatar: friend.avatar,
        totalCount: friend.logs.reduce((sum, log) => sum + log.count, 0),
        streak: friend.logs.filter(l => l.count >= DAILY_TARGET).length,
        isCurrentUser: false,
      })),
    ];

    return allParticipants.sort((a, b) => b.totalCount - a.totalCount);
  }, [friends, totalCount, currentStreak]);

  return {
    currentDay,
    isJanuary,
    todayCount,
    totalCount,
    completedDays,
    currentStreak,
    userLogs,
    friends,
    leaderboard,
    dailyTarget: DAILY_TARGET,
    totalDays: JANUARY_DAYS,
    saveLog,
    getLogForDay,
  };
};
