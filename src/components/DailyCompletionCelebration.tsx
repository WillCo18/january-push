import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import celebration01 from "@/assets/celebration-01.gif";
import celebration02 from "@/assets/celebration-02.gif";
import celebration03 from "@/assets/celebration-03.gif";
import celebration04 from "@/assets/celebration-04.gif";
import celebration05 from "@/assets/celebration-05.gif";
import celebration06 from "@/assets/celebration-06.gif";
import celebration07 from "@/assets/celebration-07.gif";
import celebration08 from "@/assets/celebration-08.gif";
import celebration09 from "@/assets/celebration-09.gif";

interface DailyCompletionCelebrationProps {
  day: number;
  isOpen: boolean;
  onClose: () => void;
}

// Array of all celebration GIFs
const celebrationGifs = [
  celebration01,
  celebration02,
  celebration03,
  celebration04,
  celebration05,
  celebration06,
  celebration07,
  celebration08,
  celebration09,
];

export const DailyCompletionCelebration = ({
  day,
  isOpen,
  onClose
}: DailyCompletionCelebrationProps) => {
  // Rotate through GIFs based on day (cycles through all 9)
  const gifIndex = (day - 1) % celebrationGifs.length;
  const selectedGif = celebrationGifs[gifIndex];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center p-0 overflow-hidden border-0">
        <DialogTitle className="sr-only">Daily Goal Complete!</DialogTitle>

        {/* Celebration GIF */}
        <div className="w-full">
          <img
            src={selectedGif}
            alt="Celebration"
            className="w-full h-auto"
          />
        </div>

        {/* Celebration message */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-4xl">💪</p>
            <h2 className="text-2xl font-bold text-foreground">
              100 Complete!
            </h2>
            <p className="text-muted-foreground">
              You crushed it today! Keep up the amazing work!
            </p>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-[#00A699] hover:bg-[#00A699]/90 text-white"
          >
            Let's Go! 🔥
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
