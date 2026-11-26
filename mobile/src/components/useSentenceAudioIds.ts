import { useEffect, useState } from "react";
import { getAvailableSentenceIds } from "../../../packages/domain/src/audioPlayer";

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Which sentence ids have a generated clip, resolved once per mount. Sentence
 * audio can lag a content edit (a rewritten line loses its clip until it is
 * regenerated), so screens use the set to hide a speaker that could not play
 * instead of offering it.
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
