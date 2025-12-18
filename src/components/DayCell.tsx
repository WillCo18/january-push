import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface DayCellProps {
  day: number;
  count: number;
  target: number;
  isToday?: boolean;
  isFuture?: boolean;
  onClick?: () => void;
}

export const DayCell = ({ day, count, target, isToday, isFuture, onClick }: DayCellProps) => {
  const percentage = Math.min((count / target) * 100, 100);
  const isComplete = count >= target;
  const hasProgress = count > 0;

  return (
    <button
      onClick={onClick}
      disabled={isFuture}
      className={cn(
        "relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-200",
        isToday && "ring-2 ring-primary ring-offset-2",
        isFuture && "opacity-40 cursor-not-allowed",
        !isFuture && "hover:scale-105 active:scale-95 cursor-pointer",
        isComplete && "bg-success text-success-foreground",
        hasProgress && !isComplete && "bg-warning/20",
        !hasProgress && !isFuture && "bg-card"
      )}
    >
      <span className={cn(
        "text-sm font-semibold",
        isComplete && "text-success-foreground",
        !isComplete && "text-foreground"
      )}>
        {day}
      </span>
      {isComplete && (
        <Check className="h-3.5 w-3.5 mt-0.5" />
      )}
      {hasProgress && !isComplete && (
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-inactive rounded-full overflow-hidden">
          <div 
            className="h-full bg-warning rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </button>
  );
};
