import { Home, Calendar, Users, User } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type Tab = "home" | "calendar" | "friends" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: "home" as Tab, icon: Home, label: "Today" },
    { id: "calendar" as Tab, icon: Calendar, label: "Calendar" },
    { id: "friends" as Tab, icon: Users, label: "Friends" },
    { id: "profile" as Tab, icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "navActive" : "nav"}
            size="nav"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 py-3",
              activeTab === tab.id && "text-primary"
            )}
          >
            <tab.icon className={cn(
              "h-6 w-6 transition-all duration-200",
              activeTab === tab.id && "scale-110"
            )} />
            <span className="text-xs font-medium">{tab.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
};
