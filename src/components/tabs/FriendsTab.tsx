import { LeaderboardRow } from "@/components/LeaderboardRow";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export const FriendsTab = () => {
  const { members, groupName, inviteCode, loading } = useLeaderboard();

  const handleShare = async () => {
    if (!inviteCode) return;
    
    const link = `${window.location.origin}/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleMemberClick = (userId: string) => {
    // Will navigate to journey page in next prompt
    toast.info("Journey page coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-safe pb-24">
      {/* Header */}
      <header className="pt-6 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Leaderboard</p>
            <h1 className="text-2xl font-semibold text-foreground">{groupName || "Your Group"}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </div>
      </header>

      {/* Leaderboard */}
      {members.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No members yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Share the invite link to add friends
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member, index) => (
            <LeaderboardRow
              key={member.userId}
              rank={index + 1}
              nickname={member.nickname}
              todayReps={member.todayReps}
              todayComplete={member.todayComplete}
              streak={member.streak}
              isCurrentUser={member.isCurrentUser}
              onClick={() => handleMemberClick(member.userId)}
            />
          ))}
        </div>
      )}

      {/* Share CTA */}
      <div className="mt-8 p-6 bg-muted/50 rounded-2xl text-center">
        <h3 className="font-semibold text-foreground mb-2">
          Challenge your friends!
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Working out together keeps everyone accountable.
        </p>
        <Button 
          onClick={handleShare}
          className="bg-[#00A699] hover:bg-[#00A699]/90 text-white"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Invite Link
        </Button>
      </div>
    </div>
  );
};
