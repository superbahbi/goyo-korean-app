import { useMemo, useState, useSyncExternalStore } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "../primitives/react-native";
import {
  getAlphabetCategoryCards,
  ALPHABET_LEARNING_NOTE,
  ALPHABET_CATEGORY_DESCRIPTIONS,
  type AlphabetCard,
} from "../../../client/src/lib/alphabet";
import { getHangulStrokes as getStrokeOrder } from "../../../client/src/lib/hangulStrokes";
import {
  GRAMMAR_LESSONS,
  grammarExampleId,
  type GrammarLesson,
} from "../../../client/src/lib/grammar";
import type { GrammarProgress } from "../../../client/src/lib/grammarProgress";
import { createQuestionLoop } from "../../../client/src/lib/practiceQuestion";
import { pickDistractors } from "../../../client/src/lib/practiceDistractors";
import { shuffle } from "../../../client/src/lib/shuffle";
import { describeVerdict } from "../../../client/src/lib/practiceVerdict";
import { SCENARIOS } from "../../../client/src/components/practice/scenarios";
import {
  playAlphabetAudio,
  playVocabularyAudio,
  playSentenceAudio,
} from "../../../client/src/lib/audioPlayer";
import type { VocabularyCard } from "../../../client/src/lib/vocabulary";
const theme = (darkMode: boolean) => ({
  bg: darkMode ? "#0f172a" : "#ffffff",
  card: darkMode ? "#1e293b" : "#f8fafc",
  line: darkMode ? "#334155" : "#e2e8f0",
  fg: darkMode ? "#f1f5f9" : "#0f172a",
  dim: darkMode ? "#94a3b8" : "#64748b",
  ok: "#059669",
  good: "#d1fae5",
  bad: "#fee2e2",
});
type C = ReturnType<typeof theme>;
type Rating = "again" | "good";
const Head = ({
  title,
  sub,
  c,
  onClose,
}: {
  title: string;
  sub?: string;
  c: C;
  onClose: () => void;
}) => (
  <View style={[S.head, { borderColor: c.line }]}>
    <View style={S.f1}>
      <Text style={[S.h1, { color: c.fg }]}>{title}</Text>
      {sub ? <Text style={[S.sub, { color: c.dim }]}>{sub}</Text> : null}
    </View>
    <Pressable
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel="Close"
    >
      <Text style={[S.x, { color: c.dim }]}>✕</Text>
    </Pressable>
  </View>
);
const Btn = ({
  label,
  onPress,
  c,
  tone = "ok",
  off,
}: {
  label: string;
  onPress: () => void;
  c: C;
  tone?: "ok" | "ghost" | "bad";
  off?: boolean;
}) => {
  const bg = tone === "ok" ? c.ok : tone === "bad" ? "#dc2626" : "transparent";
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(off) }}
      style={[
        S.btn,
        {
          backgroundColor: bg,
          borderColor: tone === "ghost" ? c.line : bg,
          opacity: off ? 0.5 : 1,
        },
      ]}
    >
      <Text style={[S.btnT, { color: tone === "ghost" ? c.fg : "#fff" }]}>
        {label}
      </Text>
    </Pressable>
  );
};
const Bar = ({ at, total, c }: { at: number; total: number; c: C }) => (
  <View style={[S.track, { backgroundColor: c.card }]}>
    <View
      style={[
        S.fill,
        { width: `${total ? (at / total) * 100 : 0}%` as `${number}%` },
      ]}
    />
  </View>
);
const Done = ({
  title,
  score,
  note,
  c,
  onRestart,
  onClose,
}: {
  title: string;
  score: string;
  note: string;
  c: C;
  onRestart: () => void;
  onClose: () => void;
}) => (
  <View style={[S.screen, { backgroundColor: c.bg }]}>
    <Head title={title} c={c} onClose={onClose} />
    <View style={[S.pad, S.center]}>
      <Text style={[S.big, { color: c.fg }]}>{score}</Text>
      <Text style={[S.body, { color: c.dim }]}>{note}</Text>
      <Btn label="Play Again" onPress={onRestart} c={c} />
      <Btn label="Close" onPress={onClose} c={c} tone="ghost" />
    </View>
  </View>
);
function useLoop<T extends { answerId: string }>(build: () => readonly T[]) {
  const loop = useMemo(
    () => createQuestionLoop({ buildRound: build }),
    [build]
  );
  return {
    loop,
    state: useSyncExternalStore(loop.subscribe, loop.getState, loop.getState),
  };
}
const CONSONANTS = getAlphabetCategoryCards("basic-consonants"),
  VOWELS = getAlphabetCategoryCards("basic-vowels");
const DOUBLE_CONSONANTS = getAlphabetCategoryCards("double-consonants"),
  COMPOUND_VOWELS = getAlphabetCategoryCards("compound-vowels");
const HANGUL_TIPS = [
  ALPHABET_LEARNING_NOTE,
  ALPHABET_CATEGORY_DESCRIPTIONS.consonants,
  ALPHABET_CATEGORY_DESCRIPTIONS.vowels,
];
const strokeCount = (card: AlphabetCard) => getStrokeOrder(card.id).length;
function audioId(
  example: GrammarLesson["examples"][number],
  lessonId: string,
  index: number
) {
  const r = example as unknown as Record<string, unknown>;
  return typeof r.audioId === "string"
    ? r.audioId
    : typeof r.id === "string"
      ? r.id
      : grammarExampleId(lessonId, index);
}
function buildListeningQuestions(cards: VocabularyCard[]) {
  return cards.slice(0, 10).map(card => {
    const ds = pickDistractors(cards, {
      count: 3,
      correctCardId: card.id,
      dedupeKey: c => c.back.trim().toLowerCase(),
    });
    return {
      card,
      answerId: card.id,
      choices: shuffle([
        { id: card.id, text: card.back },
        ...ds.map(c => ({ id: c.id, text: c.back })),
      ]),
    };
  });
}
function buildScenarioQuestions(
  scenarios: typeof SCENARIOS,
  cards: VocabularyCard[]
) {
  const byId = new Map(cards.map(card => [card.id, card]));
  return shuffle(scenarios).flatMap(scenario => {
    const card = byId.get(scenario.cardId);
    if (!card) return [];
    const ds = pickDistractors(cards, {
      count: 2,
      correctCardId: card.id,
      dedupeKey: c => c.front,
      preferTag: "survival",
    });
    return [
      { scenario, card, answerId: card.id, choices: shuffle([card, ...ds]) },
    ];
  });
}
const TABS = [
  { id: "cons", label: "Basic Consonants", cards: CONSONANTS },
  { id: "vowels", label: "Basic Vowels", cards: VOWELS },
  { id: "double", label: "Double Consonants", cards: DOUBLE_CONSONANTS },
  { id: "compound", label: "Compound Vowels", cards: COMPOUND_VOWELS },
] as const;
export function AlphabetPracticeScreen({
  darkMode,
  onClose,
}: {
  darkMode: boolean;
  onClose: () => void;
}) {
  const c = theme(darkMode);
  const [tabId, setTabId] = useState("cons");
  const [selected, setSelected] = useState<AlphabetCard | null>(null);
  const cards = TABS.find(t => t.id === tabId)?.cards;
  return (
    <View style={[S.screen, { backgroundColor: c.bg }]}>
      <Head
        title="Hangul alphabet"
        sub="Tap a letter to hear it and see how it is built."
        c={c}
        onClose={onClose}
      />
      <ScrollView contentContainerStyle={S.pad}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={S.chips}>
            {[...TABS, { id: "tips", label: "Tips" }].map(tab => {
              const active = tab.id === tabId;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => {
                    setTabId(tab.id);
                    setSelected(null);
                  }}
                  style={[
                    S.chip,
                    {
                      backgroundColor: active ? c.ok : c.card,
                      borderColor: active ? c.ok : c.line,
                    },
                  ]}
                >
                  <Text style={{ color: active ? "#fff" : c.fg }}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        {tabId === "tips" ? (
          HANGUL_TIPS.map((tip, index) => (
            <View
              key={`${index}-${tip}`}
              style={[S.box, { backgroundColor: c.card, borderColor: c.line }]}
            >
              <Text style={[S.body, { color: c.dim }]}>{tip}</Text>
            </View>
          ))
        ) : (
          <>
            <View style={S.grid}>
              {cards?.map(card => (
                <Pressable
                  key={card.id}
                  onPress={() => {
                    setSelected(card);
                    void playAlphabetAudio(card.id, card.type);
                  }}
                  style={[
                    S.tile,
                    {
                      backgroundColor: c.card,
                      borderColor: selected?.id === card.id ? c.ok : c.line,
                    },
                  ]}
                >
                  <Text style={[S.hangul, { color: c.fg }]}>{card.hangul}</Text>
                  <Text style={[S.small, { color: c.dim }]}>
                    {card.romanization}
                  </Text>
                </Pressable>
              ))}
            </View>
            {selected ? (
              <View
                style={[
                  S.box,
                  { backgroundColor: c.card, borderColor: c.line },
                ]}
              >
                <Text style={[S.huge, { color: c.fg }]}>{selected.hangul}</Text>
                <Text style={[S.boxT, { color: c.fg }]}>
                  {selected.romanization} · {selected.sound}
                </Text>
                <Text style={[S.body, { color: c.dim }]}>
                  {selected.example}
                </Text>
                <Text style={[S.body, { color: c.dim }]}>
                  {strokeCount(selected)} strokes
                </Text>
                <Btn
                  label="🔊 Hear it again"
                  onPress={() =>
                    void playAlphabetAudio(selected.id, selected.type)
                  }
                  c={c}
                  tone="ghost"
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
export function GrammarPracticeScreen({
  progress,
  darkMode,
  onCompleteLesson,
  onClose,
}: {
  progress: GrammarProgress;
  darkMode: boolean;
  onCompleteLesson: (id: string, correct: number, total: number) => void;
  onClose: () => void;
}) {
  const c = theme(darkMode);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const lesson = GRAMMAR_LESSONS.find(item => item.id === lessonId);
  if (!lesson) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg }]}>
        <Head
          title="Grammar practice"
          sub="TOPIK I · 18 lessons"
          c={c}
          onClose={onClose}
        />
        <ScrollView contentContainerStyle={S.pad}>
          {GRAMMAR_LESSONS.map(item => {
            const done = progress.completedLessonIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setLessonId(item.id);
                  setQi(0);
                  setPicked(null);
                  setCorrect(0);
                  setFinished(false);
                }}
                style={[
                  S.row,
                  { backgroundColor: c.card, borderColor: c.line },
                ]}
              >
                <View style={S.f1}>
                  <Text style={[S.rowT, { color: c.fg }]}>
                    {item.order}. {item.title}
                  </Text>
                  <Text style={[S.small, { color: c.dim }]}>
                    {item.subtitle}
                  </Text>
                </View>
                <Text style={{ color: done ? c.ok : c.dim }}>
                  {done ? "✓ Done" : "Start"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }
  const quiz = lesson.quiz[qi];
  const choose = (index: number) => {
    if (picked !== null || !quiz) return;
    const next = correct + (index === quiz.answerIndex ? 1 : 0);
    setPicked(index);
    setCorrect(next);
    if (qi === lesson.quiz.length - 1) {
      setFinished(true);
      onCompleteLesson(lesson.id, next, lesson.quiz.length);
    }
  };
  return (
    <View style={[S.screen, { backgroundColor: c.bg }]}>
      <Head
        title={lesson.title}
        sub={lesson.subtitle}
        c={c}
        onClose={onClose}
      />
      <ScrollView contentContainerStyle={S.pad}>
        <Btn
          label="← All lessons"
          onPress={() => setLessonId(null)}
          c={c}
          tone="ghost"
        />
        <Text style={[S.body, { color: c.dim }]}>{lesson.summary}</Text>
        {lesson.points.map(point => (
          <View key={point.heading}>
            <Text style={[S.boxT, { color: c.fg }]}>{point.heading}</Text>
            <Text style={[S.body, { color: c.dim }]}>{point.body}</Text>
          </View>
        ))}
        {lesson.examples.map((example, index) => (
          <Pressable
            key={`${lesson.id}-${index}`}
            onPress={() =>
              void playSentenceAudio(audioId(example, lesson.id, index))
            }
            style={[S.row, { backgroundColor: c.card, borderColor: c.line }]}
          >
            <View style={S.f1}>
              <Text style={[S.rowT, { color: c.fg }]}>{example.ko}</Text>
              <Text style={[S.small, { color: c.dim }]}>{example.en}</Text>
            </View>
            <Text style={{ color: c.ok }}>🔊</Text>
          </Pressable>
        ))}
        <View style={[S.box, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[S.boxT, { color: c.fg }]}>
            {finished
              ? "Lesson complete"
              : `Quiz · ${qi + 1}/${lesson.quiz.length}`}
          </Text>
          {finished ? (
            <>
              <Text style={[S.body, { color: c.dim }]}>
                You answered {correct} of {lesson.quiz.length} correctly.
              </Text>
              <Btn
                label="Retake quiz"
                onPress={() => {
                  setQi(0);
                  setPicked(null);
                  setCorrect(0);
                  setFinished(false);
                }}
                c={c}
              />
            </>
          ) : quiz ? (
            <>
              <Text style={[S.body, { color: c.fg }]}>{quiz.prompt}</Text>
              {quiz.options.map((option, index) => (
                <Pressable
                  key={option}
                  onPress={() => choose(index)}
                  style={[
                    S.row,
                    {
                      backgroundColor:
                        picked !== null && index === quiz.answerIndex
                          ? c.good
                          : picked === index
                            ? c.bad
                            : c.bg,
                      borderColor: c.line,
                    },
                  ]}
                >
                  <Text style={{ color: c.fg }}>{option}</Text>
                </Pressable>
              ))}
              {picked !== null ? (
                <>
                  <Text style={[S.small, { color: c.dim }]}>
                    {quiz.explanation}
                  </Text>
                  {!finished ? (
                    <Btn
                      label="Next question"
                      onPress={() => {
                        setPicked(null);
                        setQi(qi + 1);
                      }}
                      c={c}
                    />
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
export function ListeningPracticeScreen({
  cards,
  darkMode,
  onGrade,
  onClose,
}: {
  cards: VocabularyCard[];
  darkMode: boolean;
  onGrade: (id: string, rating: Rating) => void;
  onClose: () => void;
}) {
  const c = theme(darkMode);
  const build = useMemo(() => () => buildListeningQuestions(cards), [cards]);
  const { loop, state } = useLoop(build);
  const verdict = describeVerdict(state);
  const current = verdict.question;
  if (state.completed || !current)
    return (
      <Done
        title="Listening complete"
        score={`${state.correctCount} / ${state.questions.length}`}
        note="You recognized this many Korean recordings."
        c={c}
        onRestart={loop.restart}
        onClose={onClose}
      />
    );
  const choose = (id: string) => {
    if (verdict.answered) return;
    const result = loop.answer(id);
    onGrade(current.card.id, result.verdict === "correct" ? "good" : "again");
  };
  return (
    <View style={[S.screen, { backgroundColor: c.bg }]}>
      <Head
        title="What did you hear?"
        sub={`${state.index + 1} / ${state.questions.length}`}
        c={c}
        onClose={onClose}
      />
      <ScrollView contentContainerStyle={S.pad}>
        <Bar at={state.index} total={state.questions.length} c={c} />
        <Btn
          label="▶ Play word"
          onPress={() => void playVocabularyAudio(current.card.id)}
          c={c}
        />
        {current.choices.map(choice => {
          const shown = verdict.answered && choice.id === verdict.correctId;
          const wrong = state.selectedId === choice.id && !shown;
          return (
            <Pressable
              key={choice.id}
              onPress={() => choose(choice.id)}
              style={[
                S.row,
                {
                  backgroundColor: shown ? c.good : wrong ? c.bad : c.card,
                  borderColor: shown ? c.ok : c.line,
                },
              ]}
            >
              <Text style={{ color: c.fg }}>{choice.text}</Text>
            </Pressable>
          );
        })}
        {verdict.answered ? (
          <View
            style={[S.box, { backgroundColor: c.card, borderColor: c.line }]}
          >
            <Text style={[S.boxT, { color: c.fg }]}>
              {verdict.isCorrect ? "Correct" : `Answer: ${current.card.back}`}
            </Text>
            <Text style={[S.small, { color: c.dim }]}>
              {current.card.example}
            </Text>
            <Btn
              label={verdict.isLast ? "See results" : "Next recording"}
              onPress={loop.next}
              c={c}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
export function ScenarioPracticeScreen({
  cards,
  darkMode,
  onGrade,
  onClose,
}: {
  cards: VocabularyCard[];
  darkMode: boolean;
  onGrade: (id: string, rating: Rating) => void;
  onClose: () => void;
}) {
  const c = theme(darkMode);
  const build = useMemo(
    () => () => buildScenarioQuestions(SCENARIOS, cards),
    [cards]
  );
  const { loop, state } = useLoop(build);
  const verdict = describeVerdict(state);
  const current = verdict.question;
  if (state.questions.length === 0)
    return (
      <View style={[S.screen, { backgroundColor: c.bg }]}>
        <Head title="Nothing to practice yet" c={c} onClose={onClose} />
        <View style={[S.pad, S.center]}>
          <Text style={[S.body, { color: c.dim }]}>
            Scenarios use phrases you have already studied. Review a few
            survival cards first.
          </Text>
          <Btn label="Close" onPress={onClose} c={c} />
        </View>
      </View>
    );
  if (state.completed || !current)
    return (
      <Done
        title="Scenario complete"
        score={`${state.correctCount} / ${state.questions.length}`}
        note="situations answered with the right phrase."
        c={c}
        onRestart={loop.restart}
        onClose={onClose}
      />
    );
  const choose = (id: string) => {
    if (verdict.answered) return;
    const result = loop.answer(id);
    onGrade(current.card.id, result.verdict === "correct" ? "good" : "again");
  };
  return (
    <View style={[S.screen, { backgroundColor: c.bg }]}>
      <Head
        title="What would you say?"
        sub={`${current.scenario.place} · ${state.index + 1}/${state.questions.length}`}
        c={c}
        onClose={onClose}
      />
      <ScrollView contentContainerStyle={S.pad}>
        <Bar at={state.index} total={state.questions.length} c={c} />
        <Text style={[S.body, { color: c.fg }]}>{current.scenario.prompt}</Text>
        <Btn
          label="🔊 Hear the phrase"
          onPress={() => void playVocabularyAudio(current.card.id)}
          c={c}
          tone="ghost"
        />
        {current.choices.map(choice => {
          const shown = verdict.answered && choice.id === verdict.correctId;
          const wrong = state.selectedId === choice.id && !shown;
          return (
            <Pressable
              key={choice.id}
              onPress={() => choose(choice.id)}
              style={[
                S.row,
                {
                  backgroundColor: shown ? c.good : wrong ? c.bad : c.card,
                  borderColor: shown ? c.ok : c.line,
                },
              ]}
            >
              <Text style={{ color: c.fg }}>{choice.front}</Text>
            </Pressable>
          );
        })}
        {verdict.answered ? (
          <View
            style={[S.box, { backgroundColor: c.card, borderColor: c.line }]}
          >
            <Text style={[S.boxT, { color: c.fg }]}>
              {verdict.isCorrect
                ? "That fits the situation."
                : `A useful answer is “${current.card.front}”.`}
            </Text>
            <Text style={[S.small, { color: c.dim }]}>
              {current.card.back} · {current.card.example}
            </Text>
            <Btn
              label={verdict.isLast ? "See results" : "Next situation"}
              onPress={loop.next}
              c={c}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
export function ShadowingPracticeScreen({
  cards,
  darkMode,
  onGrade,
  onClose,
}: {
  cards: VocabularyCard[];
  darkMode: boolean;
  onGrade: (id: string, rating: Rating) => void;
  onClose: () => void;
}) {
  const c = theme(darkMode);
  const sample = useMemo(() => cards.slice(0, 8), [cards]);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const card = sample[index];
  if (done || !card)
    return (
      <Done
        title="Shadowing complete"
        score={`${sample.length} phrases`}
        note="You spoke each phrase aloud and judged how it felt."
        c={c}
        onRestart={() => {
          setIndex(0);
          setDone(false);
        }}
        onClose={onClose}
      />
    );
  const finish = (rating: Rating) => {
    onGrade(card.id, rating);
    if (index + 1 >= sample.length) setDone(true);
    else setIndex(index + 1);
  };
  return (
    <View style={[S.screen, { backgroundColor: c.bg }]}>
      <Head
        title="Shadowing"
        sub={`${index + 1} / ${sample.length}`}
        c={c}
        onClose={onClose}
      />
      <ScrollView contentContainerStyle={S.pad}>
        <Bar at={index} total={sample.length} c={c} />
        <View style={[S.box, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[S.huge, { color: c.fg }]}>{card.front}</Text>
          <Text style={[S.boxT, { color: c.fg }]}>{card.romanization}</Text>
          <Text style={[S.body, { color: c.dim }]}>{card.back}</Text>
          <Text style={[S.small, { color: c.dim }]}>{card.example}</Text>
          {card.exampleEnglish ? (
            <Text style={[S.small, { color: c.dim }]}>
              {card.exampleEnglish}
            </Text>
          ) : null}
          <Btn
            label="🔊 Word"
            onPress={() => void playVocabularyAudio(card.id)}
            c={c}
          />
          <Btn
            label="🔊 Sentence"
            onPress={() => void playSentenceAudio(card.id)}
            c={c}
            tone="ghost"
          />
        </View>
        <Text style={[S.body, { color: c.dim }]}>
          Listen, repeat aloud, then judge yourself.
        </Text>
        <Btn
          label="Needs practice"
          onPress={() => finish("again")}
          c={c}
          tone="bad"
        />
        <Btn label="Sounded natural" onPress={() => finish("good")} c={c} />
      </ScrollView>
    </View>
  );
}
const S = StyleSheet.create({
  screen: { flex: 1 },
  f1: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 14 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  h1: { fontSize: 22, fontWeight: "700" },
  sub: { fontSize: 13, marginTop: 2 },
  x: { fontSize: 22, padding: 4 },
  pad: { padding: 20, gap: 12 },
  chips: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tile: {
    width: "23%",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  hangul: { fontSize: 28, fontWeight: "700" },
  huge: { fontSize: 40, fontWeight: "700" },
  small: { fontSize: 12, lineHeight: 18 },
  body: { fontSize: 15, lineHeight: 22 },
  big: { fontSize: 38, fontWeight: "700" },
  box: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  boxT: { fontSize: 16, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowT: { fontSize: 15, fontWeight: "600" },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  btnT: { fontSize: 15, fontWeight: "600" },
  track: { height: 6, borderRadius: 999, overflow: "hidden" },
  fill: { height: 6, borderRadius: 999, backgroundColor: "#059669" },
});
