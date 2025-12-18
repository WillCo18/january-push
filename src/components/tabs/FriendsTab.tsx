import { FriendCard } from "@/components/FriendCard";
import { Button } from "@/components/ui/button";
import { UserPlus, Share2 } from "lucide-react";
import { toast } from "sonner";

interface FriendsTabProps {
  challenge: ReturnType<typeof import("@/hooks/useChallenge").useChallenge>;
}

export const FriendsTab = ({ challenge }: FriendsTabProps) => {
  const { leaderboard } = challenge;

  const handleInvite = () => {
    toast.success("Invite link copied to clipboard!");
  };

  return (
    <div className="px-4 pt-safe">
      {/* Header */}
      <header className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">
              {leaderboard.length} participants
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleInvite}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </div>
      </header>

      {/* Leaderboard */}
      <div className="space-y-3">
        {leaderboard.map((participant, index) => (
          <FriendCard
            key={participant.id}
            name={participant.name}
            avatar={participant.avatar}
            totalCount={participant.totalCount}
            streak={participant.streak}
            rank={index + 1}
            isCurrentUser={participant.isCurrentUser}
          />
        ))}
      </div>

      {/* Share CTA */}
      <div className="mt-8 p-6 bg-primary/5 rounded-2xl text-center">
        <h3 className="font-semibold text-foreground mb-2">
          Challenge your friends!
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Working out with friends keeps you accountable and makes it more fun.
        </p>
        <Button onClick={handleInvite}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Challenge
        </Button>
      </div>
    </div>
  );
};
