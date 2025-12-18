import { useState } from "react";
import { ProgressRing } from "@/components/ProgressRing";
import { AddRepsSheet } from "@/components/AddRepsSheet";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const HomeTab = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const {
    todayReps,
    loading,
    groupName,
    addReps,
    isComplete,
    remaining,
    progress,
    dailyTarget,
  } = useActivityLogs();

  const handleAddReps = async (reps: number, date?: string) => {
    const success = await addReps(reps, date);
    if (success) {
      toast.success(`Added ${reps} reps!`);
    } else {
      toast.error("Failed to add reps");
    }
    return success;
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
      <header className="pt-6 pb-8">
        <p className="text-sm text-muted-foreground mb-1">Your group</p>
        <h1 className="text-2xl font-semibold text-foreground">{groupName || "January 100"}</h1>
      </header>

      {/* Main Progress Card */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/50">
        <div className="flex flex-col items-center">
          <ProgressRing progress={progress} size={200} strokeWidth={14}>
            <div className="text-center">
              <p className="text-5xl font-bold text-foreground">{todayReps}</p>
              <p className="text-sm text-muted-foreground">/ {dailyTarget}</p>
            </div>
          </ProgressRing>

          <div className="mt-6 text-center">
            {isComplete ? (
              <div className="flex items-center gap-2 text-[#00A699]">
                <Check className="h-5 w-5" />
                <span className="font-medium">Complete!</span>
              </div>
            ) : (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{remaining}</span> to go
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Reps Button */}
      <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto">
        <Button
          className="w-full h-14 bg-[#00A699] hover:bg-[#00A699]/90 text-white text-lg shadow-lg"
          onClick={() => setIsSheetOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Reps
        </Button>
      </div>

      {/* Add Reps Sheet */}
      <AddRepsSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onAdd={handleAddReps}
      />
    </div>
  );
};
