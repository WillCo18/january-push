import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Settings, Award, Target, Flame, Calendar, TrendingUp } from "lucide-react";

interface ProfileTabProps {
  challenge: ReturnType<typeof import("@/hooks/useChallenge").useChallenge>;
}

export const ProfileTab = ({ challenge }: ProfileTabProps) => {
  const { 
    totalCount, 
    completedDays, 
    currentStreak, 
    currentDay,
    dailyTarget,
    totalDays,
    leaderboard
  } = challenge;

  const userRank = leaderboard.findIndex(p => p.isCurrentUser) + 1;
  const averagePerDay = currentDay > 0 ? Math.round(totalCount / currentDay) : 0;
  const projectedTotal = averagePerDay * totalDays;
  const completionRate = currentDay > 0 ? Math.round((completedDays / currentDay) * 100) : 0;

  return (
    <div className="px-4 pt-safe pb-8">
      {/* Header */}
      <header className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
          <p className="text-sm text-muted-foreground">January 100 Challenge</p>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 overflow-hidden">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" 
              alt="Your avatar"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">You</h2>
            <p className="text-muted-foreground">Rank #{userRank} of {leaderboard.length}</p>
          </div>
        </div>

        {/* Big stat */}
        <div className="text-center py-6 border-t border-b border-border">
          <p className="text-5xl font-bold text-primary">{totalCount.toLocaleString()}</p>
          <p className="text-muted-foreground mt-1">Total Press-Ups</p>
        </div>

        {/* Progress bar to challenge goal */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Challenge Progress</span>
            <span className="font-medium text-foreground">
              {totalCount.toLocaleString()} / {(dailyTarget * totalDays).toLocaleString()}
            </span>
          </div>
          <div className="h-3 bg-inactive rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalCount / (dailyTarget * totalDays)) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <h3 className="text-lg font-semibold text-foreground mb-3">Statistics</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={currentStreak}
          subtitle="days"
          variant="warning"
        />
        <StatCard
          icon={Target}
          label="Completion Rate"
          value={`${completionRate}%`}
          subtitle="of days"
          variant="success"
        />
        <StatCard
          icon={Calendar}
          label="Days Complete"
          value={completedDays}
          subtitle={`of ${currentDay} days`}
          variant="default"
        />
        <StatCard
          icon={TrendingUp}
          label="Daily Average"
          value={averagePerDay}
          subtitle="press-ups"
          variant="default"
        />
      </div>

      {/* Achievements teaser */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Award className="h-6 w-6 text-warning" />
          <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
        </div>
        <div className="flex gap-3">
          {currentStreak >= 3 && (
            <div className="flex flex-col items-center p-3 bg-warning/10 rounded-xl">
              <span className="text-2xl">🔥</span>
              <span className="text-xs text-muted-foreground mt-1">3-Day Streak</span>
            </div>
          )}
          {completedDays >= 7 && (
            <div className="flex flex-col items-center p-3 bg-success/10 rounded-xl">
              <span className="text-2xl">⭐</span>
              <span className="text-xs text-muted-foreground mt-1">Week Warrior</span>
            </div>
          )}
          {totalCount >= 500 && (
            <div className="flex flex-col items-center p-3 bg-primary/10 rounded-xl">
              <span className="text-2xl">💪</span>
              <span className="text-xs text-muted-foreground mt-1">500 Club</span>
            </div>
          )}
          {totalCount >= 1000 && (
            <div className="flex flex-col items-center p-3 bg-primary/10 rounded-xl">
              <span className="text-2xl">🏆</span>
              <span className="text-xs text-muted-foreground mt-1">1K Legend</span>
            </div>
          )}
        </div>
        {completedDays < 1 && (
          <p className="text-sm text-muted-foreground mt-4">
            Complete your first day to unlock achievements!
          </p>
        )}
      </div>
    </div>
  );
};
