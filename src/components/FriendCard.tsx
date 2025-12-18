import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface FriendCardProps {
  name: string;
  avatar: string;
  totalCount: number;
  streak: number;
  rank: number;
  isCurrentUser?: boolean;
}

export const FriendCard = ({ name, avatar, totalCount, streak, rank, isCurrentUser }: FriendCardProps) => {
  const getRankStyle = () => {
    if (rank === 1) return "text-warning";
    if (rank === 2) return "text-muted-foreground";
    if (rank === 3) return "text-amber-700";
    return "text-muted-foreground";
  };

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
      isCurrentUser ? "bg-primary/5 border-2 border-primary/20" : "bg-card"
    )}>
      <div className={cn(
        "flex items-center justify-center w-8 font-bold text-lg",
        getRankStyle()
      )}>
        {rank <= 3 ? <Trophy className="h-5 w-5" /> : rank}
      </div>
      
      <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden flex-shrink-0">
        <img 
          src={avatar} 
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold truncate",
          isCurrentUser && "text-primary"
        )}>
          {name} {isCurrentUser && "(You)"}
        </p>
        <p className="text-sm text-muted-foreground">
          {streak} day streak 🔥
        </p>
      </div>
      
      <div className="text-right">
        <p className="text-2xl font-bold text-foreground">{totalCount}</p>
        <p className="text-xs text-muted-foreground">total</p>
      </div>
    </div>
  );
};
