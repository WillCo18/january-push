import { useState } from "react";
import { DayCell } from "@/components/DayCell";
import { AddRepsSheet } from "@/components/AddRepsSheet";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { format, getDaysInMonth } from "date-fns";

interface CalendarTabProps {
  challenge: ReturnType<typeof import("@/hooks/useChallenge").useChallenge>;
}

interface SelectedDate {
  day: number;
  month: number; // 0 = January, 1 = February
}

export const CalendarTab = ({ challenge }: CalendarTabProps) => {
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const { addReps } = useActivityLogs();
  
  const { 
    currentDay, 
    dailyTarget, 
    getLogForDay,
    completedDays,
    totalCount
  } = challenge;

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Month configurations
  const months = [
    { name: "January", year: 2026, month: 0, days: 31 },
    { name: "February", year: 2026, month: 1, days: getDaysInMonth(new Date(2026, 1)) }
  ];

  // Calculate current day of year (1-62 for Jan 1 to Feb 28)
  const today = new Date();
  const isCurrentYear = today.getFullYear() === 2026;
  const currentMonth = today.getMonth();
  const currentDayOfMonth = today.getDate();
  
  // Get day of year for comparison
  const getDayOfYear = (month: number, day: number) => {
    if (month === 0) return day;
    return 31 + day; // January has 31 days
  };

  const currentDayOfYear = isCurrentYear ? getDayOfYear(currentMonth, currentDayOfMonth) : 62;

  const getFirstDayPadding = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    return firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
  };

  const handleDayClick = (month: number, day: number) => {
    const dayOfYear = getDayOfYear(month, day);
    if (dayOfYear <= currentDayOfYear) {
      setSelectedDate({ day, month });
    }
  };

  const getLogForDate = (month: number, day: number) => {
    const dayOfYear = getDayOfYear(month, day);
    return getLogForDay(dayOfYear);
  };

  const handleAddReps = async (reps: number, date?: string) => {
    if (selectedDate !== null) {
      const logDate = date || format(new Date(2026, selectedDate.month, selectedDate.day), "yyyy-MM-dd");
      const success = await addReps(reps, logDate);
      return success;
    }
    return false;
  };

  const isToday = (month: number, day: number) => {
    if (!isCurrentYear) return false;
    return month === currentMonth && day === currentDayOfMonth;
  };

  const isFuture = (month: number, day: number) => {
    const dayOfYear = getDayOfYear(month, day);
    return dayOfYear > currentDayOfYear;
  };

  return (
    <div className="px-4 pt-safe pb-24">
      {/* Header */}
      <header className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">2026 Challenge</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {completedDays} days complete · {totalCount.toLocaleString()} total
        </p>
      </header>

      {/* Calendar Months */}
      <div className="space-y-6">
        {months.map((monthData) => (
          <div key={monthData.name} className="bg-card rounded-2xl p-4 shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-3">{monthData.name}</h2>
            
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
              {Array.from({ length: getFirstDayPadding(monthData.year, monthData.month) }).map((_, i) => (
                <div key={`pad-${monthData.month}-${i}`} className="aspect-square" />
              ))}
              
              {/* Actual days */}
              {Array.from({ length: monthData.days }, (_, i) => i + 1).map((day) => (
                <DayCell
                  key={`${monthData.month}-${day}`}
                  day={day}
                  count={getLogForDate(monthData.month, day)}
                  target={dailyTarget}
                  isToday={isToday(monthData.month, day)}
                  isFuture={isFuture(monthData.month, day)}
                  onClick={() => handleDayClick(monthData.month, day)}
                />
              ))}
            </div>
          </div>
        ))}
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

      {/* Add Reps Sheet for selected day */}
      <AddRepsSheet
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        onAdd={handleAddReps}
        currentReps={selectedDate !== null ? getLogForDate(selectedDate.month, selectedDate.day) : 0}
        dailyTarget={dailyTarget}
      />
    </div>
  );
};
