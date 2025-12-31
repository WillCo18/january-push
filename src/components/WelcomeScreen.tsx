import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

interface WelcomeScreenProps {
  groupName: string;
  onContinue: () => void;
}

export const WelcomeScreen = ({ groupName, onContinue }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Flame className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to the 100 Day {groupName} Challenge
          </h1>
          
          <div className="text-muted-foreground text-sm leading-relaxed space-y-4">
            <p>
              Form isn't important, commitment is.
            </p>
            <p>
              Simply log the amount of push ups you do each set. Doesn't matter if it's 20 sets or 2 sets, the aim is for 100 total push ups a day.
            </p>
            <p className="font-medium text-foreground">
              Get through the first week and it will be plain sailing!
            </p>
          </div>
        </div>

        <Button
          onClick={onContinue}
          className="w-full bg-[#00A699] hover:bg-[#00A699]/90 text-white h-12"
        >
          Let's Go!
        </Button>
      </div>
    </div>
  );
};