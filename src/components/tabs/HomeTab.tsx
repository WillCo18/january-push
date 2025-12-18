import { useState } from "react";
import { ProgressRing } from "@/components/ProgressRing";
import { StatCard } from "@/components/StatCard";
import { LogPressUpsSheet } from "@/components/LogPressUpsSheet";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Target, Plus } from "lucide-react";

interface HomeTabProps {
  challenge: ReturnType<typeof import("@/hooks/useChallenge").useChallenge>;
}

export const HomeTab = ({ challenge }: HomeTabProps) => {
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  
  const { 
    currentDay, 
    todayCount, 
    totalCount, 
    completedDays, 
    currentStreak, 
    dailyTarget,
    totalDays,
    saveLog 
  } = challenge;

  const todayProgress = Math.min((todayCount / dailyTarget) * 100, 100);
  const remaining = Math.max(0, dailyTarget - todayCount);

  const handleSaveLog = (count: number) => {
    saveLog(currentDay, count);
  };

  return (
    <div className="px-4 pt-safe">
      {/* Header */}
      <header className="pt-6 pb-4">
        <p className="text-sm text-muted-foreground">Day {currentDay} of {totalDays}</p>
        <h1 className="text-2xl font-bold text-foreground">January 100 Challenge</h1>
      </header>

      {/* Main Progress Ring */}
      <div className="flex flex-col items-center py-8">
        <ProgressRing progress={todayProgress} size={200} strokeWidth={14}>
          <div className="text-center">
            <p className="text-5xl font-bold text-foreground">{todayCount}</p>
            <p className="text-sm text-muted-foreground">of {dailyTarget}</p>
          </div>
        </ProgressRing>
        
        <p className="mt-4 text-muted-foreground text-center">
          {remaining > 0 
            ? `${remaining} press-ups to go today`
            : "Today's target complete! 🎉"}
        </p>
      </div>

      {/* Log Button */}
      <div className="px-4 mb-8">
        <Button 
          size="xl" 
          className="w-full"
          onClick={() => setIsLogSheetOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Log Press-Ups
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={currentStreak}
          subtitle="days"
          variant="warning"
        />
        <StatCard
          icon={Trophy}
          label="Total Count"
          value={totalCount.toLocaleString()}
          subtitle="press-ups"
          variant="success"
        />
        <StatCard
          icon={Target}
          label="Days Complete"
          value={`${completedDays}/${currentDay}`}
          subtitle="target hit"
          variant="default"
        />
        <StatCard
          icon={Target}
          label="Avg Per Day"
          value={currentDay > 0 ? Math.round(totalCount / currentDay) : 0}
          subtitle="press-ups"
          variant="default"
        />
      </div>

      {/* Log Sheet */}
      <LogPressUpsSheet
        isOpen={isLogSheetOpen}
        onClose={() => setIsLogSheetOpen(false)}
        onSave={handleSaveLog}
        currentCount={todayCount}
        target={dailyTarget}
      />
    </div>
  );
};
