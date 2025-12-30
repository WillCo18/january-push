import { format } from "date-fns";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DayProgress {
  date: string;
  reps: number;
  isComplete: boolean;
}

interface MemberProgress {
  userId: string;
  nickname: string;
  days: DayProgress[];
}

interface GroupProgressGridProps {
  members: MemberProgress[];
}

export const GroupProgressGrid = ({ members }: GroupProgressGridProps) => {
  const { user } = useAuth();

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No group members found
      </div>
    );
  }

  const days = members[0]?.days || [];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full inline-block">
        {/* Header Row */}
        <div className="flex gap-1 mb-2">
          <div className="w-28 flex-shrink-0 text-xs font-medium text-muted-foreground">
            Member
          </div>
          {days.map((day) => (
            <div
              key={day.date}
              className="w-16 flex-shrink-0 text-center text-xs font-medium text-muted-foreground"
            >
              {format(new Date(day.date), "EEE")}
              <br />
              {format(new Date(day.date), "d")}
            </div>
          ))}
        </div>

        {/* Member Rows */}
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex gap-1 items-center"
            >
              {/* Member Name */}
              <div className="w-28 flex-shrink-0 text-sm font-medium text-foreground truncate">
                {member.nickname}
                {member.userId === user?.id && (
                  <span className="text-xs text-muted-foreground ml-1">(you)</span>
                )}
              </div>

              {/* Day Cells */}
              {member.days.map((day) => (
                <div
                  key={day.date}
                  className={`w-16 h-12 flex-shrink-0 rounded-lg flex items-center justify-center text-sm font-semibold ${
                    day.isComplete
                      ? "bg-[#00A699] text-white"
                      : day.reps > 0
                      ? "bg-muted text-foreground"
                      : "bg-card border border-border/50 text-muted-foreground"
                  }`}
                >
                  {day.isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : day.reps > 0 ? (
                    day.reps
                  ) : (
                    "-"
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
