import { Button } from "@/components/ui/button";
import { BarChart2, BookOpen } from "lucide-react";

interface QuickLinksProps {
  onOpenBrowse: () => void;
  onOpenStats: () => void;
}

/** Deck browsing and full statistics entry points. */
export function QuickLinks({ onOpenBrowse, onOpenStats }: QuickLinksProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      <Button
        variant="outline"
        className="h-10 border-border bg-card/70 text-foreground/70 hover:bg-muted/60"
        onClick={onOpenBrowse}
      >
        <BookOpen className="mr-2" size={16} aria-hidden="true" />
        Browse Deck
      </Button>
      <Button
        variant="outline"
        className="h-10 border-border bg-card/70 text-foreground/70 hover:bg-muted/60"
        onClick={onOpenStats}
      >
        <BarChart2 className="mr-2" size={16} aria-hidden="true" />
        Full Stats
      </Button>
    </div>
  );
}
