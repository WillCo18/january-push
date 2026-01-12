import { useState } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Delete, Check, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isAfter, startOfDay } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import hulkHoganGif from "@/assets/hulk-hogan-celebration.gif";

interface AddRepsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (reps: number, date?: string) => Promise<boolean | undefined>;
}

// Check if today is January 12th, 2026
const isHulkHoganDay = () => {
  const now = new Date();
  return now.getFullYear() === 2026 && now.getMonth() === 0 && now.getDate() === 12;
};

export const AddRepsSheet = ({ isOpen, onClose, onAdd }: AddRepsSheetProps) => {
  const [display, setDisplay] = useState("");
  const [backfill, setBackfill] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showHulkCelebration, setShowHulkCelebration] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const januaryStart = new Date(today.getFullYear(), 0, 1);

  const handleKeyPress = (key: string) => {
    if (display.length >= 4) return; // Max 9999
    setDisplay(prev => prev + key);
  };

  const handleBackspace = () => {
    setDisplay(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDisplay("");
  };

  const handleAdd = async () => {
    const reps = parseInt(display, 10);
    if (isNaN(reps) || reps <= 0) return;

    setSubmitting(true);
    try {
      const dateToLog = backfill && selectedDate 
        ? format(selectedDate, "yyyy-MM-dd") 
        : undefined;
      
      const success = await onAdd(reps, dateToLog);
      if (success) {
        // Show Hulk Hogan celebration on Jan 12, 2026 only
        if (isHulkHoganDay()) {
          setShowHulkCelebration(true);
          setTimeout(() => {
            setShowHulkCelebration(false);
            setDisplay("");
            setBackfill(false);
            setSelectedDate(undefined);
            onClose();
          }, 2500);
        } else {
          setDisplay("");
          setBackfill(false);
          setSelectedDate(undefined);
          onClose();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

  if (!isOpen && !showHulkCelebration) return null;

  return (
    <>
      {/* Hulk Hogan Celebration Dialog */}
      <Dialog open={showHulkCelebration} onOpenChange={setShowHulkCelebration}>
        <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <img 
              src={hulkHoganGif} 
              alt="Hulk Hogan Celebration" 
              className="w-64 h-auto rounded-lg"
            />
            <p className="text-2xl font-bold text-white drop-shadow-lg text-center">
              BROTHER! 💪
            </p>
          </div>
        </DialogContent>
      </Dialog>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 pb-safe">
        <div className="p-6 max-w-md mx-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />

          <h2 className="text-xl font-bold text-center mb-6">Add Reps</h2>

          {/* Display */}
          <div className="bg-muted rounded-xl p-4 mb-6 text-center min-h-[72px] flex items-center justify-center">
            <span className={cn(
              "text-4xl font-bold transition-colors",
              display ? "text-foreground" : "text-muted-foreground"
            )}>
              {display || "0"}
            </span>
          </div>

          {/* Backfill toggle */}
          <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="backfill" className="text-sm text-muted-foreground cursor-pointer">
              Log for a different day
            </Label>
            <Switch
              id="backfill"
              checked={backfill}
              onCheckedChange={setBackfill}
            />
          </div>

          {/* Date picker when backfill is on */}
          {backfill && (
            <div className="mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "EEEE, d MMMM") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      isAfter(startOfDay(date), startOfDay(today)) ||
                      date < januaryStart
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {keys.map((key, index) => {
              if (key === "") {
                return <div key={index} />;
              }
              if (key === "back") {
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-14 text-xl"
                    onClick={handleBackspace}
                    onDoubleClick={handleClear}
                  >
                    <Delete className="h-6 w-6" />
                  </Button>
                );
              }
              return (
                <Button
                  key={index}
                  variant="secondary"
                  className="h-14 text-xl font-semibold"
                  onClick={() => handleKeyPress(key)}
                >
                  {key}
                </Button>
              );
            })}
          </div>

          {/* Add button */}
          <Button
            className="w-full h-14 bg-[#00A699] hover:bg-[#00A699]/90 text-white text-lg"
            onClick={handleAdd}
            disabled={!display || display === "0" || submitting || (backfill && !selectedDate)}
          >
            {submitting ? (
              "Adding..."
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};
