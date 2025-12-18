import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HomeTab } from "@/components/tabs/HomeTab";
import { CalendarTab } from "@/components/tabs/CalendarTab";
import { FriendsTab } from "@/components/tabs/FriendsTab";
import { ProfileTab } from "@/components/tabs/ProfileTab";
import { useChallenge } from "@/hooks/useChallenge";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type Tab = "home" | "calendar" | "friends" | "profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const challenge = useChallenge();
  const { signOut } = useAuth();

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab challenge={challenge} />;
      case "calendar":
        return <CalendarTab challenge={challenge} />;
      case "friends":
        return <FriendsTab challenge={challenge} />;
      case "profile":
        return <ProfileTab challenge={challenge} />;
      default:
        return <HomeTab challenge={challenge} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Logout button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          Log out
        </Button>
      </div>

      {renderTab()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
