import { useState } from "react";
import { ProgressRing } from "@/components/ProgressRing";
import { AddRepsSheet } from "@/components/AddRepsSheet";
import { GroupProgressGrid } from "@/components/GroupProgressGrid";
import { Button } from "@/components/ui/button";
import { Plus, Check, Info } from "lucide-react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { useGroupProgress } from "@/hooks/useGroupProgress";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Check if today is a practice day (Dec 30 or 31)
const isPracticeDay = () => {
  const today = new Date();
  const month = today.getMonth(); // 0-indexed, so December = 11
  const day = today.getDate();
  return month === 11 && (day === 30 || day === 31);
};

// Check if the challenge has started (January 1st or later)
const isChallengeStarted = () => {
  const today = new Date();
  const month = today.getMonth();
  return month === 0; // January = 0
};

export const HomeTab = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const {
    todayReps,
    loading: activityLoading,
    addReps,
    isComplete,
    remaining,
    progress,
    dailyTarget,
    refetch: refetchActivity,
  } = useActivityLogs();

  const {
    members,
    groupName,
    loading: groupLoading,
    refetch: refetchGroup,
  } = useGroupProgress();

  const loading = activityLoading || groupLoading;

  const handleAddReps = async (reps: number, date?: string) => {
    const success = await addReps(reps, date);
    if (success) {
      toast.success(`Added ${reps} reps!`);
      // Refetch both activity and group progress
      refetchActivity();
      refetchGroup();
    } else {
      toast.error("Failed to add reps");
    }
    return success;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showPracticeBanner = isPracticeDay();

  return (
    <div className="px-4 pt-safe pb-24">
      {/* Header */}
      <header className="pt-6 pb-6">
        <p className="text-sm text-muted-foreground mb-1">Your group</p>
        <h1 className="text-2xl font-semibold text-foreground">{groupName || "January 100"}</h1>
      </header>

      {/* Practice Days Banner */}
      {showPracticeBanner && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Practice Days</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                The challenge officially starts on January 1st. Use these days to familiarise yourself with the app and get warmed up!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personal Stats Card */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your progress today</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">{todayReps}</span>
              <span className="text-lg text-muted-foreground">/ {dailyTarget}</span>
            </div>
            <div className="mt-2">
              {isComplete ? (
                <div className="flex items-center gap-2 text-[#00A699]">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Complete!</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{remaining}</span> to go
                </p>
              )}
            </div>
          </div>
          <div>
            <ProgressRing progress={progress} size={100} strokeWidth={8}>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{Math.round(progress)}%</p>
              </div>
            </ProgressRing>
          </div>
        </div>
      </div>

      {/* Group Progress Grid */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
          Group Progress This Week
        </h2>
        <GroupProgressGrid members={members} />
      </div>

      {/* Count Today's Press-ups Button */}
      <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto">
        <Button
          className="w-full h-14 bg-[#00A699] hover:bg-[#00A699]/90 text-white text-lg shadow-lg"
          onClick={() => setIsSheetOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Count today's press-ups
        </Button>
      </div>

      {/* Add Reps Sheet */}
      <AddRepsSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAdd={handleAddReps}
      />
    </div>
  );
};
