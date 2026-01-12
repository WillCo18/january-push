import { Button } from "./ui/button";
import { RefreshCw, X } from "lucide-react";
import { useState } from "react";

interface UpdateAvailableBannerProps {
  onRefresh: () => void;
}

export const UpdateAvailableBanner = ({ onRefresh }: UpdateAvailableBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#00A699] text-white px-4 py-3 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <RefreshCw className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">New update available!</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefresh}
            className="bg-white text-[#00A699] hover:bg-white/90 h-8 px-3 text-xs font-semibold"
          >
            Update Now
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
