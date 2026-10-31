import { useEffect, useState } from "react";
import { getLocalDateKey, msUntilNextLocalMidnight } from "@/lib/day";

/**
 * The current local day key, refreshed at midnight and whenever the tab wakes.
 * A dashboard left open overnight then shows today's count instead of
 * yesterday's, and grading after midnight lands on the new day's queue.
 */
export function useLocalDayKey(): string {
  const [dayKey, setDayKey] = useState(getLocalDateKey);

  useEffect(() => {
    let timer: number | undefined;

    const scheduleNextDay = () => {
      window.clearTimeout(timer);
      // A second of slack so a timer that fires slightly early still lands on
      // the new day rather than re-reading the old one.
      timer = window.setTimeout(() => {
        setDayKey(getLocalDateKey());
        scheduleNextDay();
      }, msUntilNextLocalMidnight() + 1000);
    };

    // A sleeping laptop or a background tab can miss the timer, so re-check on
    // wake as well.
    const sync = () => {
      setDayKey(getLocalDateKey());
      scheduleNextDay();
    };

    scheduleNextDay();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return dayKey;
}
