import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import rockyGif from "@/assets/rocky-celebration.gif";

interface StreakCelebrationProps {
  streak: number;
  isOpen: boolean;
  onClose: () => void;
}

export const StreakCelebration = ({ streak, isOpen, onClose }: StreakCelebrationProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center p-0 overflow-hidden border-0">
        <DialogTitle className="sr-only">10-Day Streak Celebration</DialogTitle>
        
        {/* Rocky GIF */}
        <div className="w-full">
          <img 
            src={rockyGif} 
            alt="Rocky running celebration" 
            className="w-full h-auto"
          />
        </div>
        
        {/* Celebration message */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-4xl">🔥</p>
            <h2 className="text-2xl font-bold text-foreground">
              {streak} Day Streak!
            </h2>
            <p className="text-muted-foreground">
              You're unstoppable! Keep that momentum going!
            </p>
          </div>
          
          <Button 
            onClick={onClose}
            className="w-full bg-[#00A699] hover:bg-[#00A699]/90 text-white"
          >
            Keep Going! 💪
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
