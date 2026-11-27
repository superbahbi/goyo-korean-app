import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "../primitives/dom";
import {
  playSentenceAudio,
  playVocabularyAudio,
} from "../../../packages/domain/src/audioPlayer";
import type { VocabularyCard } from "../../../packages/domain/src/vocabulary";

export interface FlashCardViewProps {
  card: VocabularyCard;
  revealed: boolean;
  autoPlayAudio: boolean;
  sentenceAudioReady: boolean;
  darkMode: boolean;
  onReveal: () => void;
}

const LIGHT = {
  surface: "#ffffff",
  raised: "#f8fafc",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  accent: "#047857",
  accentSoft: "#d1fae5",
  accentText: "#065f46",
  example: "#f0fdf4",
};

const DARK = {
  surface: "#111c2e",
  raised: "#0b1220",
  border: "#1e293b",
  text: "#f1f5f9",
  muted: "#94a3b8",
  accent: "#34d399",
  accentSoft: "#064e3b",
  accentText: "#a7f3d0",
  example: "#0b1f1a",
};

/**
 * Audio-first study card: the learner hears the word before seeing it. A text
 * toggle covers quiet places. The back adds romanization, meaning, context and
 * the sentence clip.
 */
export function FlashCardView({
  card,
  revealed,
  autoPlayAudio,
  sentenceAudioReady,
  darkMode,
  onReveal,
}: FlashCardViewProps) {
  const c = darkMode ? DARK : LIGHT;
  // Keyed by id so a new card starts with its Korean hidden again.
  const [koreanShownFor, setKoreanShownFor] = useState<string | null>(null);
  const autoPlayedFor = useRef<string | null>(null);
  const showKorean = koreanShownFor === card.id;

  useEffect(() => {
    if (!autoPlayAudio) {
      autoPlayedFor.current = null;
      return;
    }
    if (revealed || autoPlayedFor.current === card.id) return;
    autoPlayedFor.current = card.id;
    void playVocabularyAudio(card.id);
  }, [autoPlayAudio, card.id, revealed]);

  const wordAudio = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Hear the word ${card.front}`}
      onPress={() => void playVocabularyAudio(card.id)}
      style={[
        styles.pill,
        { borderColor: c.border, backgroundColor: c.raised },
      ]}
    >
      <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>
        🔊 Hear Word
      </Text>
    </Pressable>
  );

  if (!revealed) {
    return (
      <View style={styles.fill}>
        <View
          style={[
            styles.card,
            styles.centered,
            { borderColor: c.border, backgroundColor: c.surface },
          ]}
        >
          <View style={styles.row}>
            <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
              <Text
                style={{ color: c.accentText, fontSize: 12, fontWeight: "600" }}
              >
                {card.tag}
              </Text>
            </View>
            <Text style={{ color: c.muted, fontSize: 12, fontStyle: "italic" }}>
              {card.partOfSpeech}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play the pronunciation for ${card.front}`}
            onPress={() => void playVocabularyAudio(card.id)}
            style={[
              styles.circle,
              { borderColor: c.accent, backgroundColor: c.accentSoft },
            ]}
          >
            <Text style={{ fontSize: 44 }}>🔊</Text>
            <Text
              style={{
                color: c.accentText,
                fontSize: 14,
                fontWeight: "700",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Tap to Hear Korean
            </Text>
          </Pressable>

          {showKorean ? (
            <Text
              style={{
                color: c.text,
                fontSize: 34,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 8,
                wordBreak: "keep-all",
              }}
            >
              {card.front}
            </Text>
          ) : null}

          <Text
            style={{
              color: c.muted,
              fontSize: 15,
              lineHeight: 22,
              textAlign: "center",
              maxWidth: 280,
            }}
          >
            Listen closely and recall the meaning, then tap Reveal.
          </Text>

          <View style={[styles.row, styles.frontLinks]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setKoreanShownFor(showKorean ? null : card.id)}
              style={[styles.link]}
            >
              <Text style={{ color: c.muted, fontSize: 13, fontWeight: "600" }}>
                {showKorean ? "Hide Korean text" : "Show Korean text"}
              </Text>
            </Pressable>
            {showKorean ? (
              <Pressable
                accessibilityRole="button"
                onPress={onReveal}
                style={[styles.link]}
              >
                <Text
                  style={{ color: c.accent, fontSize: 13, fontWeight: "700" }}
                >
                  Reveal meaning →
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <ScrollView
        style={[
          styles.card,
          { borderColor: c.border, backgroundColor: c.surface },
        ]}
        contentContainerStyle={styles.revealedContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
            <Text
              style={{ color: c.accentText, fontSize: 12, fontWeight: "600" }}
            >
              {card.tag}
            </Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 12, fontStyle: "italic" }}>
            {card.partOfSpeech}
          </Text>
        </View>

        <Text
          style={{
            color: c.text,
            fontSize: 44,
            fontWeight: "700",
            textAlign: "center",
            marginTop: 18,
            wordBreak: "keep-all",
          }}
        >
          {card.front}
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
          {card.romanization}
        </Text>
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <Text
          style={{
            color: c.text,
            fontSize: 23,
            fontWeight: "700",
            lineHeight: 30,
            textAlign: "center",
          }}
        >
          {card.back}
        </Text>

        <View style={styles.wordAudio}>{wordAudio}</View>

        {card.example ? (
          <View
            style={[
              styles.box,
              { borderColor: c.border, backgroundColor: c.example },
            ]}
          >
            <Text style={[styles.label, { color: c.accent }]}>In context</Text>
            <Text
              style={{
                color: c.text,
                fontSize: 15,
                fontWeight: "500",
                lineHeight: 22,
                marginTop: 8,
                wordBreak: "keep-all",
              }}
            >
              {card.example}
            </Text>
            {card.exampleEnglish ? (
              <Text
                style={{
                  color: c.muted,
                  fontSize: 13,
                  lineHeight: 19,
                  marginTop: 6,
                }}
              >
                {card.exampleEnglish}
              </Text>
            ) : null}
            {sentenceAudioReady ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hear the example sentence for ${card.front}`}
                onPress={() => void playSentenceAudio(card.id)}
                style={[styles.sentence, { borderColor: c.accent }]}
              >
                <Text
                  style={{ color: c.accent, fontSize: 12, fontWeight: "700" }}
                >
                  🔊 Hear Sentence
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {card.usageNote ? (
          <View
            style={[
              styles.box,
              { borderColor: c.border, backgroundColor: c.raised },
            ]}
          >
            <Text style={[styles.label, { color: c.accent }]}>Usage note</Text>
            <Text
              style={{
                color: c.muted,
                fontSize: 13,
                lineHeight: 20,
                marginTop: 6,
              }}
            >
              {card.usageNote}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: "100%" },
  card: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 20 },
  centered: { alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  frontLinks: { justifyContent: "center", flexWrap: "wrap", marginTop: 18 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  circle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    padding: 16,
  },
  link: { paddingHorizontal: 10, paddingVertical: 8 },
  revealedContent: { alignItems: "center", paddingBottom: 8 },
  divider: { height: 1, width: "60%", marginVertical: 16 },
  wordAudio: { marginTop: 16 },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  box: {
    width: "100%",
    marginTop: 20,
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
  sentence: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
