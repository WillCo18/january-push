import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useJourney } from "@/hooks/useJourney";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, getDay, isFuture, isToday } from "date-fns";

export const JourneyPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const targetUserId = userId || user?.id || "";
  const isOwnJourney = targetUserId === user?.id;
  
  const { data, loading } = useJourney(targetUserId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Could not load journey data</p>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const januaryFirst = new Date(year, 0, 1);
  const startDayOfWeek = getDay(januaryFirst); // 0 = Sunday
  // Convert to Monday-first (0 = Monday, 6 = Sunday)
  const mondayFirstOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Create calendar grid
  const calendarDays: (number | null)[] = [];
  // Add empty cells for days before January 1st
  for (let i = 0; i < mondayFirstOffset; i++) {
    calendarDays.push(null);
  }
  // Add all 31 days of January
  for (let day = 1; day <= 31; day++) {
    calendarDays.push(day);
  }

  const summaryMap = new Map(
    data.dailySummaries.map(s => [s.date, s])
  );

  const getDayState = (day: number) => {
    const date = new Date(year, 0, day);
    const dateStr = format(date, "yyyy-MM-dd");
    const summary = summaryMap.get(dateStr);

    if (isFuture(date) && !isToday(date)) {
      return { type: "future" as const, reps: 0 };
    }

    if (!summary || summary.totalReps === 0) {
      return { type: "empty" as const, reps: 0 };
    }

    if (summary.isComplete) {
      return { type: "complete" as const, reps: summary.totalReps };
    }

    return { type: "partial" as const, reps: summary.totalReps };
  };

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-safe pb-8">
        {/* Header */}
        <header className="pt-6 pb-6">
          {!isOwnJourney && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/?tab=friends")}
              className="mb-4 -ml-2 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <h1 className="text-2xl font-semibold text-foreground">
            {isOwnJourney ? "My Journey" : `${data.nickname}'s Journey`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">January {year}</p>
        </header>

        {/* Calendar Grid */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 mb-6">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const state = getDayState(day);
              const date = new Date(year, 0, day);
              const isCurrentDay = isToday(date);

              return (
                <div
                  key={day}
                  className={cn(
                    "aspect-square flex items-center justify-center relative",
                    isCurrentDay && "ring-2 ring-primary/30 rounded-full"
                  )}
                >
                  {state.type === "complete" && (
                    <div className="w-9 h-9 rounded-full bg-[#00A699] flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {state.type === "partial" && (
                    <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">{state.reps}</span>
                    </div>
                  )}
                  {state.type === "empty" && (
                    <div className="w-9 h-9 rounded-full border-2 border-[#E0E0E0] flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{day}</span>
                    </div>
                  )}
                  {state.type === "future" && (
                    <div className="w-9 h-9 rounded-full border border-border/30 flex items-center justify-center opacity-40">
                      <span className="text-xs text-muted-foreground">{day}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-4 bg-card rounded-xl border border-border/50">
            <span className="text-muted-foreground">Total reps</span>
            <span className="font-semibold text-foreground">{data.totalReps.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-card rounded-xl border border-border/50">
            <span className="text-muted-foreground">Current streak</span>
            <span className="font-semibold text-foreground">🔥 {data.currentStreak}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-card rounded-xl border border-border/50">
            <span className="text-muted-foreground">Best streak</span>
            <span className="font-semibold text-foreground">{data.bestStreak} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
