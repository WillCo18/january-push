import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { HomeTab } from "@/components/tabs/HomeTab";
import { CalendarTab } from "@/components/tabs/CalendarTab";
import { FriendsTab } from "@/components/tabs/FriendsTab";
import { ProfileTab } from "@/components/tabs/ProfileTab";
import { useChallenge } from "@/hooks/useChallenge";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

type Tab = "home" | "calendar" | "friends" | "profile";

const Index = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "home";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const challenge = useChallenge();
  const navigate = useNavigate();

  // Update tab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get("tab") as Tab;
    if (tabParam && ["home", "calendar", "friends", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />;
      case "calendar":
        return <CalendarTab challenge={challenge} />;
      case "friends":
        return <FriendsTab />;
      case "profile":
        return <ProfileTab challenge={challenge} />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Settings button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/settings")}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {renderTab()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
