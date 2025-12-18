import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

interface LeaderboardRowProps {
  rank: number;
  nickname: string;
  todayReps: number;
  todayComplete: boolean;
  streak: number;
  isCurrentUser: boolean;
  onClick?: () => void;
}

export const LeaderboardRow = ({
  rank,
  nickname,
  todayReps,
  todayComplete,
  streak,
  isCurrentUser,
  onClick,
}: LeaderboardRowProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left",
        isCurrentUser 
          ? "bg-[#00A699]/10 border border-[#00A699]/20" 
          : "bg-card border border-border/50 hover:bg-muted/50"
      )}
    >
      {/* Rank */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
        rank === 1 ? "bg-amber-100 text-amber-700" :
        rank === 2 ? "bg-slate-100 text-slate-600" :
        rank === 3 ? "bg-orange-100 text-orange-700" :
        "bg-muted text-muted-foreground"
      )}>
        {rank}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate",
          isCurrentUser ? "text-[#00A699]" : "text-foreground"
        )}>
          {nickname}
          {isCurrentUser && <span className="text-muted-foreground font-normal"> (you)</span>}
        </p>
      </div>

      {/* Today's status */}
      <div className="flex items-center gap-4">
        {todayComplete ? (
          <div className="w-8 h-8 rounded-full bg-[#00A699] flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
        ) : (
          <span className={cn(
            "text-sm font-medium min-w-[32px] text-center",
            todayReps > 0 ? "text-foreground" : "text-muted-foreground"
          )}>
            {todayReps || "—"}
          </span>
        )}

        {/* Streak */}
        {streak > 0 && (
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            🔥 {streak}
          </span>
        )}

        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
};
