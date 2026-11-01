import { useEffect, useState } from "react";
import { getAvailableSentenceIds } from "@/lib/audioPlayer";

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Resolves once per mount which sentence ids have a generated clip. The audio
 * index is already prefetched by the player, so this rarely waits on the
 * network. Sentence audio ships in batches, so callers use the set to hide the
 * player instead of offering a button that cannot play.
 */
export function useSentenceAudioIds(): ReadonlySet<string> {
  const [ids, setIds] = useState<ReadonlySet<string>>(EMPTY);

  useEffect(() => {
    let active = true;
    void getAvailableSentenceIds().then(next => {
      if (active) setIds(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return ids;
}
