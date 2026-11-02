import { useState } from "react";
import { toast } from "sonner";
import type { GradeOptions } from "@/hooks/useStudyState";
import { evaluateGrade } from "@/lib/gradeIntent";
import type { CardState } from "@/lib/mastery";
import type { VocabularyCard } from "@/lib/vocabulary";

export type SessionMode = "daily" | "weak" | "learning";

interface UseHomeSessionsOptions {
  cardStates: Record<string, CardState>;
  today: string;
  dailyGoal: number;
  cardsStudiedToday: number;
  queue: VocabularyCard[];
  weakCards: VocabularyCard[];
  learningCards: VocabularyCard[];
  recognitionCards: VocabularyCard[];
  gradeCard: (
    cardId: string,
    rating: "again" | "good" | "easy",
    options?: GradeOptions
  ) => void;
}

/**
 * Session state and the handlers that open or grade a practice session. The
 * dashboard only wires callbacks to the section components.
 */
export function useHomeSessions({
  cardStates,
  today,
  dailyGoal,
  cardsStudiedToday,
  queue,
  weakCards,
  learningCards,
  recognitionCards,
  gradeCard,
}: UseHomeSessionsOptions) {
  const [sessionQueue, setSessionQueue] = useState<VocabularyCard[]>([]);
  // Snapshot of the reviewed cards chosen when a recognition mode opens, so a
  // grade does not reshuffle the questions mid-session.
  const [recognitionSessionCards, setRecognitionSessionCards] = useState<
    VocabularyCard[]
  >([]);
  const [sessionMode, setSessionMode] = useState<SessionMode>("daily");
  const [isStudying, setIsStudying] = useState(false);

  const openRecognitionPractice = (open: () => void) => {
    if (recognitionCards.length < 4) {
      toast.info("Study a few cards first", {
        description:
          "Listening and scenarios use cards you have already reviewed, so nothing new is introduced.",
      });
      return;
    }
    setRecognitionSessionCards(recognitionCards);
    open();
  };

  const handleGrade = (
    cardId: string,
    rating: "again" | "good" | "easy",
    options?: { responseTimeMs?: number }
  ) => {
    // Same decision the save applies, computed from the same pre-grade state,
    // so the toast can only report XP that was actually awarded.
    const decision = evaluateGrade(
      {
        mode: sessionMode,
        existing: cardStates[cardId],
        today,
        dailyGoal,
        studiedToday: cardsStudiedToday,
      },
      rating,
      options?.responseTimeMs
    );

    gradeCard(cardId, rating, {
      responseTimeMs: options?.responseTimeMs,
      mode: sessionMode,
    });

    if (decision.goalJustReached) {
      setTimeout(() => {
        toast.success("Daily goal reached! 🎉", {
          description: `You've earned ${decision.xp} XP and maintained your streak!`,
        });
      }, 300);
    }
  };

  const startSession = () => {
    if (queue.length === 0) {
      toast.info("Your planned reviews are complete", {
        description: "Come back tomorrow for the next new-word batch.",
      });
      return;
    }
    setSessionQueue([...queue]);
    setSessionMode("daily");
    setIsStudying(true);
  };

  const startWeakSession = () => {
    if (weakCards.length === 0) {
      toast.info("Review a few cards first to unlock Weak Words");
      return;
    }
    setSessionQueue(weakCards);
    setSessionMode("weak");
    setIsStudying(true);
  };

  const startLearningSession = () => {
    if (learningCards.length === 0) {
      toast.info("No Learning or Shaky cards yet", {
        description: "Start a Daily Session to build your review path.",
      });
      return;
    }
    setSessionQueue(learningCards);
    setSessionMode("learning");
    setIsStudying(true);
  };

  const handleListeningGrade = (cardId: string, rating: "again" | "good") => {
    gradeCard(cardId, rating, { mode: "listening" });
  };

  const handleScenarioGrade = (cardId: string, rating: "again" | "good") => {
    gradeCard(cardId, rating, { mode: "scenario" });
  };

  const handleShadowingGrade = (cardId: string, rating: "again" | "good") => {
    gradeCard(cardId, rating, { mode: "shadowing" });
  };

  const closeSession = () => {
    setIsStudying(false);
    setSessionQueue([]);
  };

  return {
    sessionQueue,
    recognitionSessionCards,
    sessionMode,
    isStudying,
    openRecognitionPractice,
    handleGrade,
    startSession,
    startWeakSession,
    startLearningSession,
    handleListeningGrade,
    handleScenarioGrade,
    handleShadowingGrade,
    closeSession,
  };
}
