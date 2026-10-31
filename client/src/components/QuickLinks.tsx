import { Button } from "@/components/ui/button";
import { BarChart2, BookOpen } from "lucide-react";

interface QuickLinksProps {
  onOpenBrowse: () => void;
  onOpenStats: () => void;
}

/** Deck browsing and full statistics entry points. */
export function QuickLinks({ onOpenBrowse, onOpenStats }: QuickLinksProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="h-12 border-slate-200 text-slate-600 hover:bg-slate-50"
        onClick={onOpenBrowse}
      >
        <BookOpen className="mr-2" size={18} />
        Browse Deck
      </Button>
      <Button
        variant="outline"
        className="h-12 border-slate-200 text-slate-600 hover:bg-slate-50"
        onClick={onOpenStats}
      >
        <BarChart2 className="mr-2" size={18} />
        Full Stats
      </Button>
    </div>
  );
}
