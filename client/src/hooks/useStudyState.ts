import { useState, useEffect, useCallback } from "react";

export interface CardState {
  id: string;
  box: number;
  due: string;
  interval: number;
  timesReviewed: number;
  timesCorrect: number;
  lastReviewDate: string;
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

export function useStudyState() {
  const [state, setState] = useState<UserState | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().slice(0, 10);

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
    (cardId: string, rating: "again" | "good" | "easy") => {
      if (!state) return;

      const xpGain = rating === "easy" ? 15 : rating === "good" ? 10 : 5;
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);

      // Determine streak
      const lastDate = state.stats.lastStudyDate;
      let newStreak = state.stats.streak;

      if (lastDate === today) {
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

      // Create/update card state. Reviews are scheduled forward so the daily
      // queue can prioritize overdue cards without repeatedly showing cards
      // that were just answered.
      const existingCard = state.cardStates[cardId];
      const interval = rating === "again"
        ? 1
        : rating === "easy"
          ? Math.min(365, Math.max(4, (existingCard?.interval || 1) * 3))
          : Math.min(365, Math.max(2, (existingCard?.interval || 1) * 2));
      const newCardState: CardState = {
        id: cardId,
        box: rating === "easy" ? 2 : rating === "good" ? 1 : 0,
        due: addDays(today, interval),
        interval,
        timesReviewed: (existingCard?.timesReviewed || 0) + 1,
        timesCorrect:
          (existingCard?.timesCorrect || 0) + (rating === "again" ? 0 : 1),
        lastReviewDate: today,
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
          lastStudyDate: today,
          streak: newStreak,
          highestStreak: newHighestStreak,
          cardsStudiedToday: state.stats.cardsStudiedToday + 1,
          totalCardsLearned: isNewCard
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
