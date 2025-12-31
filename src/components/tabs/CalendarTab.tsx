import { useState } from "react";
import { DayCell } from "@/components/DayCell";
import { LogPressUpsSheet } from "@/components/LogPressUpsSheet";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarTabProps {
  challenge: ReturnType<typeof import("@/hooks/useChallenge").useChallenge>;
}

export const CalendarTab = ({ challenge }: CalendarTabProps) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const { 
    currentDay, 
    dailyTarget, 
    totalDays, 
    getLogForDay, 
    saveLog,
    completedDays,
    totalCount
  } = challenge;

  // Generate calendar days with padding for proper alignment
  const firstDayOfMonth = new Date(2026, 0, 1).getDay(); // 0 = Sunday, etc.
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start
  
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleDayClick = (day: number) => {
    if (day <= currentDay) {
      setSelectedDay(day);
    }
  };

  const handleSaveLog = (count: number) => {
    if (selectedDay !== null) {
      saveLog(selectedDay, count);
    }
  };

  return (
    <div className="px-4 pt-safe">
      {/* Header */}
      <header className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">January 2026</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {completedDays} days complete · {totalCount.toLocaleString()} total
        </p>
      </header>

      {/* Calendar Grid */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {weekDays.map((day) => (
            <div 
              key={day} 
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Padding for first week */}
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          
          {/* Actual days */}
          {days.map((day) => (
            <DayCell
              key={day}
              day={day}
              count={getLogForDay(day)}
              target={dailyTarget}
              isToday={day === currentDay}
              isFuture={day > currentDay}
              onClick={() => handleDayClick(day)}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success" />
          <span className="text-muted-foreground">Complete</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning/30" />
          <span className="text-muted-foreground">Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-card border border-border" />
          <span className="text-muted-foreground">None</span>
        </div>
      </div>

      {/* Log Sheet for selected day */}
      {selectedDay !== null && (
        <LogPressUpsSheet
          isOpen={selectedDay !== null}
          onClose={() => setSelectedDay(null)}
          onSave={handleSaveLog}
          currentCount={getLogForDay(selectedDay)}
          target={dailyTarget}
        />
      )}
    </div>
  );
};
