import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from "../primitives/dom";
import {
  createStudySession,
  type StudyRating,
} from "../../../packages/domain/src/studySession";
import { previewIntervals } from "../../../packages/domain/src/srs";
import {
  playSentenceAudio,
  playVocabularyAudio,
  stopAudio,
} from "../../../packages/domain/src/audioPlayer";
import type { VocabularyCard } from "../../../packages/domain/src/vocabulary";
import type { CardState } from "../../../packages/domain/src/mastery";
import { FlashCardView } from "./FlashCardView";
import { useSentenceAudioIds } from "./useSentenceAudioIds";

export interface StudySessionScreenProps {
  queue: VocabularyCard[];
  cardStates: Record<string, CardState>;
  today: string;
  title: string;
  allowRepeat: boolean;
  autoPlayAudio: boolean;
  darkMode: boolean;
  onGrade: (
    cardId: string,
    rating: StudyRating,
    options?: { responseTimeMs?: number }
  ) => void;
  onClose: () => void;
}

const LIGHT = {
  bg: "#f8fafc",
  surface: "#ffffff",
  raised: "#f1f5f9",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  accent: "#047857",
  accentSoft: "#d1fae5",
  example: "#f0fdf4",
  onAccent: "#ffffff",
  again: "#b91c1c",
  good: "#047857",
  easy: "#1d4ed8",
  againSoft: "#fef2f2",
  goodSoft: "#ecfdf5",
  easySoft: "#eff6ff",
};

const DARK = {
  bg: "#0b1220",
  surface: "#111c2e",
  raised: "#0f172a",
  border: "#1e293b",
  text: "#f1f5f9",
  muted: "#94a3b8",
  accent: "#34d399",
  accentSoft: "#064e3b",
  example: "#0b1f1a",
  onAccent: "#052e22",
  again: "#fca5a5",
  good: "#6ee7b7",
  easy: "#93c5fd",
  againSoft: "#3f1d1d",
  goodSoft: "#052e22",
  easySoft: "#172554",
};

/**
 * One run through a queue of cards, driven by the same session machine as the
 * web app. Intro, recall, and summary all come from the machine's state, so
 * grading and progression cannot drift between platforms.
 */
export function StudySessionScreen({
  queue,
  cardStates,
  today,
  title,
  allowRepeat,
  autoPlayAudio,
  darkMode,
  onGrade,
  onClose,
}: StudySessionScreenProps) {
  const c = darkMode ? DARK : LIGHT;
  const latest = useRef({ cardStates, onGrade, onClose });
  const sentenceIds = useSentenceAudioIds();

  useEffect(() => {
    latest.current = { cardStates, onGrade, onClose };
  }, [cardStates, onGrade, onClose]);

  const session = useMemo(
    () =>
      createStudySession({
        queue,
        clock: () => Date.now(),
        isNewCard: cardId => !latest.current.cardStates[cardId],
        onGrade: (cardId, rating, options) =>
          latest.current.onGrade(cardId, rating, options),
        stopAudio,
        onClose: () => latest.current.onClose(),
      }),
    [queue]
  );

  const state = useSyncExternalStore(session.subscribe, session.getState);
  const currentCard = state.queue[state.index];
  const sentenceAudioReady = currentCard
    ? sentenceIds.has(currentCard.id)
    : false;
  const intervals = useMemo(
    () =>
      previewIntervals(
        state.revealed ? cardStates[currentCard?.id ?? ""] : undefined,
        today
      ),
    [state.revealed, cardStates, currentCard?.id, today]
  );

  useEffect(() => {
    session.cardShown();
  }, [session, state.index]);

  useEffect(() => () => session.dispose(), [session]);

  if (state.completed) {
    const { again, good, easy } = state.results;
    const total = again + good + easy;
    const remembered = good + easy;
    const accuracy = total === 0 ? 0 : Math.round((remembered / total) * 100);
    const rows = [
      ["Again", again, c.again],
      ["Good", good, c.good],
      ["Easy", easy, c.easy],
    ] as const;

    return (
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <ScrollView contentContainerStyle={styles.summaryContent}>
          <Text style={[styles.eyebrow, { color: c.accent }]}>
            Session complete
          </Text>
          <Text
            style={{
              color: c.text,
              fontSize: 34,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Well practiced
          </Text>
          <Text
            style={{
              color: c.muted,
              fontSize: 15,
              lineHeight: 22,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            You reviewed {total} {total === 1 ? "card" : "cards"} and remembered{" "}
            {remembered}.
          </Text>
          <Text
            style={{
              color: c.accent,
              fontSize: 52,
              fontWeight: "700",
              marginTop: 22,
            }}
          >
            {accuracy}%
          </Text>
          <Text style={[styles.eyebrow, { color: c.muted }]}>accuracy</Text>

          <View style={styles.resultRow}>
            {rows.map(([label, value, color]) => (
              <View
                key={label}
                style={[
                  styles.resultBox,
                  { borderColor: c.border, backgroundColor: c.raised },
                ]}
              >
                <Text style={{ color, fontSize: 24, fontWeight: "700" }}>
                  {value}
                </Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {state.retryCount > 0 ? (
            <Text
              style={{
                color: c.muted,
                fontSize: 13,
                lineHeight: 19,
                textAlign: "center",
                marginTop: 16,
              }}
            >
              {state.retryCount}{" "}
              {state.retryCount === 1 ? "card came" : "cards came"} back once
              for a second try.
            </Text>
          ) : null}

          {allowRepeat ? (
            <Pressable
              accessibilityRole="button"
              onPress={session.restart}
              style={[styles.primary, { backgroundColor: c.accent }]}
            >
              <Text
                style={{ color: c.onAccent, fontSize: 17, fontWeight: "700" }}
              >
                Practice Again
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={session.close}
            style={[
              styles.secondary,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
              Done
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (!currentCard) return null;

  const header = (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
          {title}
        </Text>
        <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
          {state.index + 1} / {state.queue.length}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close study session"
        onPress={session.close}
        style={[styles.close, { backgroundColor: c.raised }]}
      >
        <Text style={{ color: c.muted, fontSize: 18, fontWeight: "700" }}>
          ✕
        </Text>
      </Pressable>
    </View>
  );

  if (state.phase === "intro") {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        {header}
        <ScrollView contentContainerStyle={styles.introContent}>
          <View
            style={[
              styles.introCard,
              { borderColor: c.border, backgroundColor: c.surface },
            ]}
          >
            <View style={[styles.badge, { backgroundColor: c.accent }]}>
              <Text
                style={{
                  color: c.onAccent,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                New Word
              </Text>
            </View>
            <Text
              style={{
                color: c.text,
                fontSize: 42,
                fontWeight: "700",
                textAlign: "center",
                marginTop: 18,
              }}
            >
              {currentCard.front}
            </Text>
            <Text
              style={{
                color: c.accent,
                fontSize: 17,
                fontWeight: "600",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {currentCard.romanization}
            </Text>
            <Text
              style={{
                color: c.text,
                fontSize: 21,
                fontWeight: "700",
                lineHeight: 28,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              {currentCard.back}
            </Text>

            <View
              style={[
                styles.box,
                { borderColor: c.border, backgroundColor: c.example },
              ]}
            >
              <Text style={[styles.label, { color: c.accent }]}>
                In context
              </Text>
              <Text
                style={{
                  color: c.text,
                  fontSize: 15,
                  fontStyle: "italic",
                  lineHeight: 22,
                  marginTop: 8,
                }}
              >
                {currentCard.example}
              </Text>
              {currentCard.exampleEnglish ? (
                <Text
                  style={{
                    color: c.muted,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 6,
                  }}
                >
                  {currentCard.exampleEnglish}
                </Text>
              ) : null}
            </View>

            <View style={styles.audioRow}>
              <SpeakButton
                label="🔊 Hear Word"
                color={c.accent}
                onPress={() => void playVocabularyAudio(currentCard.id)}
              />
              {sentenceAudioReady ? (
                <SpeakButton
                  label="🔊 Hear Sentence"
                  color={c.accent}
                  onPress={() => void playSentenceAudio(currentCard.id)}
                />
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={session.dismissIntro}
              style={[styles.primary, { backgroundColor: c.accent }]}
            >
              <Text
                style={{
                  color: c.onAccent,
                  fontSize: 17,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Got it — Start Practising
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const progress = Math.min(
    100,
    ((state.index + (state.revealed ? 0.5 : 0)) / state.queue.length) * 100
  );
  const grades: Array<{
    id: StudyRating;
    label: string;
    color: string;
    bg: string;
    days: number;
  }> = [
    {
      id: "again",
      label: "Again",
      color: c.again,
      bg: c.againSoft,
      days: intervals.again,
    },
    {
      id: "good",
      label: "Good",
      color: c.good,
      bg: c.goodSoft,
      days: intervals.good,
    },
    {
      id: "easy",
      label: "Easy",
      color: c.easy,
      bg: c.easySoft,
      days: intervals.easy,
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {header}
      <View style={[styles.track, { backgroundColor: c.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(progress, 1)}%`, backgroundColor: c.accent },
          ]}
        />
      </View>

      {/* Keyed by position: a same-card retry must mount fresh to auto-play. */}
      <FlashCardView
        key={`${currentCard.id}-${state.index}`}
        card={currentCard}
        revealed={state.revealed}
        autoPlayAudio={autoPlayAudio}
        sentenceAudioReady={sentenceAudioReady}
        darkMode={darkMode}
        onReveal={() => session.setRevealed(true)}
      />

      {!state.revealed ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => session.setRevealed(true)}
          style={[styles.primary, { backgroundColor: c.accent }]}
        >
          <Text
            style={{
              color: c.onAccent,
              fontSize: 17,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Reveal Korean &amp; Meaning
          </Text>
        </Pressable>
      ) : (
        <View style={styles.gradeSection}>
          <Text style={[styles.eyebrow, { color: c.muted, marginBottom: 6 }]}>
            How did that feel?
          </Text>
          <View style={styles.gradeRow}>
            {grades.map(g => (
              <Pressable
                key={g.id}
                accessibilityRole="button"
                accessibilityLabel={`${g.label}, next review in ${g.days} days`}
                onPress={() => session.grade(g.id)}
                style={[
                  styles.gradeButton,
                  { backgroundColor: g.bg, borderColor: c.border },
                ]}
              >
                <Text
                  style={{ color: g.color, fontSize: 15, fontWeight: "700" }}
                >
                  {g.label}
                </Text>
                <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>
                  {g.days}d
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={session.toggleProduction}
            style={styles.prodToggle}
          >
            <Text style={{ color: c.muted, fontSize: 13, fontWeight: "600" }}>
              🗣 Say it in a new sentence
              {state.production.done
                ? " · tried ✓"
                : state.production.open
                  ? " ▲"
                  : " ▼"}
            </Text>
          </Pressable>

          {state.production.open ? (
            <View
              style={[
                styles.prodPanel,
                { borderColor: c.border, backgroundColor: c.raised },
              ]}
            >
              <TextInput
                value={state.production.attempt}
                onChangeText={session.setProductionAttempt}
                placeholder="Your Korean sentence (optional)"
                multiline
                style={[
                  styles.input,
                  {
                    borderColor: c.border,
                    backgroundColor: c.surface,
                    color: c.text,
                  },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                onPress={session.markProductionDone}
                style={[
                  styles.mark,
                  {
                    borderColor: c.accent,
                    backgroundColor: state.production.done
                      ? c.accentSoft
                      : "transparent",
                  },
                ]}
              >
                <Text
                  style={{ color: c.accent, fontSize: 13, fontWeight: "700" }}
                >
                  {state.production.done ? "Tried ✓" : "Mark tried"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function SpeakButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.speak, { borderColor: color }]}
    >
      <Text style={{ color, fontSize: 14, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  headerText: { flex: 1 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  track: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 12 },
  fill: { height: "100%", borderRadius: 3 },
  primary: {
    marginTop: 12,
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  secondary: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  gradeSection: { marginTop: 10 },
  gradeRow: { flexDirection: "row", gap: 8 },
  gradeButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 10,
    alignItems: "center",
  },
  prodToggle: { alignItems: "center", paddingVertical: 10 },
  prodPanel: { borderRadius: 16, borderWidth: 1, padding: 12 },
  input: {
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  mark: {
    marginTop: 8,
    alignSelf: "flex-end",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  introContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 12 },
  introCard: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  box: {
    width: "100%",
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  audioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  speak: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  resultRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    maxWidth: 420,
    marginTop: 22,
  },
  resultBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
});
