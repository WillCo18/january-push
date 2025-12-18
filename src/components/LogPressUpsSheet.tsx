import { useState } from "react";
import { Button } from "./ui/button";
import { Minus, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogPressUpsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (count: number) => void;
  currentCount: number;
  target: number;
}

export const LogPressUpsSheet = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentCount, 
  target 
}: LogPressUpsSheetProps) => {
  const [count, setCount] = useState(currentCount);

  const increment = (amount: number) => {
    setCount(prev => Math.max(0, prev + amount));
  };

  const handleSave = () => {
    onSave(count);
    onClose();
  };

  const quickAmounts = [5, 10, 25, 50];
  const remaining = Math.max(0, target - count);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 animate-slide-up pb-safe">
        <div className="p-6 max-w-md mx-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
          
          <h2 className="text-xl font-bold text-center mb-2">Log Press-Ups</h2>
          <p className="text-muted-foreground text-center text-sm mb-8">
            {remaining > 0 
              ? `${remaining} more to hit your daily target!` 
              : "You've hit your target! Keep going! 💪"}
          </p>
          
          {/* Counter */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full text-xl"
              onClick={() => increment(-1)}
              disabled={count <= 0}
            >
              <Minus className="h-6 w-6" />
            </Button>
            
            <div className="text-center min-w-[120px]">
              <span className="text-6xl font-bold text-foreground">{count}</span>
              <p className="text-sm text-muted-foreground mt-1">press-ups</p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full text-xl"
              onClick={() => increment(1)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Quick add buttons */}
          <div className="flex justify-center gap-3 mb-8">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="secondary"
                size="sm"
                onClick={() => increment(amount)}
                className="rounded-full"
              >
                +{amount}
              </Button>
            ))}
          </div>
          
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Daily progress</span>
              <span className={cn(
                "font-medium",
                count >= target ? "text-success" : "text-foreground"
              )}>
                {count}/{target}
              </span>
            </div>
            <div className="h-2 bg-inactive rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  count >= target ? "bg-success" : "bg-primary"
                )}
                style={{ width: `${Math.min((count / target) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Save button */}
          <Button
            variant={count >= target ? "success" : "default"}
            size="xl"
            className="w-full"
            onClick={handleSave}
          >
            <Check className="h-5 w-5 mr-2" />
            Save Progress
          </Button>
        </div>
      </div>
    </>
  );
};
