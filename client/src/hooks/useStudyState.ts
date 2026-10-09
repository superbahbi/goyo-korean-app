import { useState, useEffect, useCallback } from "react";
import { scheduleRecall } from "@/lib/srs";

export interface CardState {
  id: string;
  box: number;
  due: string;
  interval: number;
  timesReviewed: number;
  timesCorrect: number;
  lastReviewDate: string;
  easeFactor?: number;
  consecutiveCorrect?: number;
  lapseCount?: number;
  lastResponseTimeMs?: number;
}

export type MasteryState = "new" | "learning" | "shaky" | "known";

export function getMasteryState(cardState?: CardState): MasteryState {
  if (!cardState || cardState.timesReviewed === 0) return "new";
  const accuracy = cardState.timesCorrect / cardState.timesReviewed;
  const consecutiveCorrect = cardState.consecutiveCorrect ?? Math.min(2, cardState.timesCorrect);
  if (cardState.timesReviewed < 2 || accuracy < 0.5) return "learning";
  if (cardState.timesReviewed < 3 || accuracy < 0.75 || cardState.interval < 7 || consecutiveCorrect < 2) return "shaky";
  return "known";
}

export interface UserStats {
  totalXp: number;
  level: number;
  streak: number;
  lastStudyDate: string;
  highestStreak: number;
  cardsStudiedToday: number;
  totalCardsLearned: number;
}

export interface UserState {
  cardStates: Record<string, CardState>;
  stats: UserStats;
  settings: {
    dailyGoal: number;
    ttsEnabled: boolean;
    autoPlayAudio: boolean;
    audioSpeaker: "elevenlabs" | "elevenlabs-female";
  };
}

const STORAGE_KEY = "goyo-progress-v2";

function addDays(date: string, days: number): string {
  const nextDate = new Date(`${date}T12:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useStudyState() {
  const [state, setState] = useState<UserState | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getLocalDateKey();

    const initial: UserState = raw
      ? JSON.parse(raw)
      : {
          cardStates: {},
          stats: {
            totalXp: 0,
            level: 1,
            streak: 0,
            lastStudyDate: "",
            highestStreak: 0,
            cardsStudiedToday: 0,
            totalCardsLearned: 0,
          },
          settings: {
            dailyGoal: 10,
            ttsEnabled: true,
            autoPlayAudio: true,
            audioSpeaker: "elevenlabs",
          },
        };

    // Older saved progress may contain a removed system-voice preference.
    const savedSpeaker = initial.settings.audioSpeaker;
    initial.settings = {
      ...initial.settings,
      audioSpeaker: savedSpeaker === "elevenlabs-female" ? "elevenlabs-female" : "elevenlabs",
    };

    // Reset daily counter if it's a new day
    if (initial.stats.lastStudyDate !== today) {
      initial.stats.cardsStudiedToday = 0;
    }

    setState(initial);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const gradeCard = useCallback(
    (cardId: string, rating: "again" | "good" | "easy", options?: { countProgress?: boolean; responseTimeMs?: number }) => {
      if (!state) return;

      const countProgress = options?.countProgress !== false;
      const xpGain = countProgress ? (rating === "easy" ? 15 : rating === "good" ? 10 : 5) : 0;
      const today = getLocalDateKey();
      const yesterday = getLocalDateKey(new Date(Date.now() - 86400000));

      // Determine streak
      const lastDate = state.stats.lastStudyDate;
      let newStreak = state.stats.streak;

      if (!countProgress) {
        newStreak = state.stats.streak;
      } else if (lastDate === today) {
        newStreak = state.stats.streak;
      } else if (lastDate === yesterday) {
        newStreak = state.stats.streak + 1;
      } else {
        newStreak = 1;
      }

      const newHighestStreak = Math.max(
        state.stats.highestStreak,
        newStreak
      );

      const existingCard = state.cardStates[cardId];
      const schedule = scheduleRecall(existingCard, rating, options?.responseTimeMs);
      const newCardState: CardState = {
        id: cardId,
        box: schedule.box,
        due: addDays(today, schedule.interval),
        interval: schedule.interval,
        timesReviewed: (existingCard?.timesReviewed || 0) + 1,
        timesCorrect:
          (existingCard?.timesCorrect || 0) + (rating === "again" ? 0 : 1),
        lastReviewDate: today,
        easeFactor: schedule.easeFactor,
        consecutiveCorrect: schedule.consecutiveCorrect,
        lapseCount: schedule.lapseCount,
        lastResponseTimeMs: options?.responseTimeMs,
      };

      const isNewCard = !existingCard;

      const newState: UserState = {
        ...state,
        cardStates: {
          ...state.cardStates,
          [cardId]: newCardState,
        },
        stats: {
          totalXp: state.stats.totalXp + xpGain,
          level: Math.floor(
            Math.sqrt((state.stats.totalXp + xpGain) / 100)
          ) + 1,
          lastStudyDate: countProgress ? today : state.stats.lastStudyDate,
          streak: newStreak,
          highestStreak: newHighestStreak,
          cardsStudiedToday: countProgress ? state.stats.cardsStudiedToday + 1 : state.stats.cardsStudiedToday,
          totalCardsLearned: countProgress && isNewCard
            ? state.stats.totalCardsLearned + 1
            : state.stats.totalCardsLearned,
        },
      };

      setState(newState);
    },
    [state]
  );

  const updateSettings = useCallback(
    (settings: Partial<UserState["settings"]>) => {
      if (!state) return;
      setState({
        ...state,
        settings: { ...state.settings, ...settings },
      });
    },
    [state]
  );

  return { state, gradeCard, updateSettings };
}
