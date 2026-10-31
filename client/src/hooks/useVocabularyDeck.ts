import { useEffect, useState } from "react";
import {
  CURATED_CARDS,
  CURATED_STUDY_READY,
  loadVocabularyDeck,
  type VocabularyDeck,
} from "@/lib/vocabulary";

/**
 * Loads the full deck after mount. The curated cards render immediately so the
 * dashboard is never blank while the imported Essential 600 chunk downloads.
 */
export function useVocabularyDeck(): VocabularyDeck & { ready: boolean } {
  const [deck, setDeck] = useState<VocabularyDeck>({
    vocabulary: CURATED_CARDS,
    studyReady: CURATED_STUDY_READY,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadVocabularyDeck()
      .then((loaded) => {
        if (!active) return;
        setDeck(loaded);
        setReady(true);
      })
      .catch((error) => {
        console.error("Failed to load the imported vocabulary deck:", error);
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return { ...deck, ready };
}
