import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from "../primitives/dom";
import {
  CATEGORIES,
  type VocabularyCard,
} from "../../../client/src/lib/vocabulary";
import {
  getMasteryState as classifyCardMastery,
  type CardState,
} from "../../../client/src/lib/mastery";
import { playVocabularyAudio } from "../../../client/src/lib/audioPlayer";
import {
  buildExportPayload as serializeExport,
  validateImportPayload as validateImport,
  type UserState,
  type UserSettings,
} from "../../../client/src/lib/savedState";
import type {
  StatsDialogStats,
  StatsDialogForecast,
} from "../../../client/src/components/stats/types";
import type { ThemePreference } from "../../../packages/shared/theme";

const theme = (darkMode: boolean) => ({
  bg: darkMode ? "#0f172a" : "#ffffff",
  card: darkMode ? "#1e293b" : "#f8fafc",
  line: darkMode ? "#334155" : "#e2e8f0",
  fg: darkMode ? "#f1f5f9" : "#0f172a",
  dim: darkMode ? "#94a3b8" : "#64748b",
  ok: "#059669",
  bad: "#dc2626",
});
type C = ReturnType<typeof theme>;

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
  const bg = tone === "ok" ? c.ok : tone === "bad" ? c.bad : "transparent";
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
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
const Section = ({ title, c }: { title: string; c: C }) => (
  <Text style={[S.section, { color: c.fg }]}>{title}</Text>
);

export function BrowseScreen({
  vocabulary,
  cardStates,
  initialCategory,
  darkMode,
  onClose,
}: {
  vocabulary: VocabularyCard[];
  cardStates: Record<string, CardState>;
  initialCategory?: string | null;
  darkMode: boolean;
  onClose: () => void;
}) {
  const c = theme(darkMode);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "all");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return vocabulary.filter(card => {
      if (category !== "all" && card.tag !== category) return false;
      if (!term) return true;
      return `${card.front} ${card.back} ${card.romanization}`
        .toLowerCase()
        .includes(term);
    });
  }, [vocabulary, query, category]);
  const shown = filtered.slice(0, 60);
  return (
    <View style={[S.screen, { backgroundColor: c.bg }]}>
      <Head
        title="Browse phrases"
        sub={`${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
        c={c}
        onClose={onClose}
      />
      <ScrollView contentContainerStyle={S.pad}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Korean or English"
          placeholderTextColor={c.dim}
          style={[
            S.input,
            { backgroundColor: c.card, borderColor: c.line, color: c.fg },
          ]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={S.chips}>
            {[{ id: "all", name: "All" }, ...CATEGORIES].map(item => {
              const active = item.id === category;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  style={[
                    S.chip,
                    {
                      backgroundColor: active ? c.ok : c.card,
                      borderColor: active ? c.ok : c.line,
                    },
                  ]}
                >
                  <Text style={{ color: active ? "#fff" : c.fg }}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        {shown.map(card => (
          <View
            key={card.id}
            style={[S.box, { backgroundColor: c.card, borderColor: c.line }]}
          >
            <View style={S.rowBetween}>
              <Text style={[S.korean, { color: c.fg }]}>{card.front}</Text>
              <Text style={[S.badge, { color: c.dim, borderColor: c.line }]}>
                {String(classifyCardMastery(cardStates[card.id]))}
              </Text>
            </View>
            <Text style={[S.small, { color: c.dim }]}>
              {card.romanization} · {card.back}
            </Text>
            {card.example ? (
              <Text style={[S.small, { color: c.dim }]}>{card.example}</Text>
            ) : null}
            <Btn
              label="🔊 Speak"
              onPress={() => void playVocabularyAudio(card.id)}
              c={c}
              tone="ghost"
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function StatsScreen({
  stats,
  forecast,
  darkMode,
  onClose,
}: {
  stats: StatsDialogStats;
  forecast: StatsDialogForecast;
  darkMode: boolean;
  onClose: () => void;
}) {
  const c = theme(darkMode);
  const tiles = [
    { label: "Streak", value: `${stats.streak} days` },
    { label: "Level & XP", value: `Lv ${stats.level} · ${stats.totalXp} XP` },
    {
      label: "Active days",
      value: `${stats.daysStudied7}/7 · ${stats.daysStudied30}/30`,
    },
    { label: "Total reviews", value: String(stats.totalReviews) },
  ];
  const mastery = [
    { label: "Known", value: stats.masteryCounts.known, color: c.ok },
    {
      label: "Learning",
      value: stats.masteryCounts.learning,
      color: "#2563eb",
    },
    { label: "Shaky", value: stats.masteryCounts.shaky, color: "#d97706" },
    { label: "New", value: stats.masteryCounts.new, color: c.dim },
  ];
  const days = forecast.days.slice(0, 7);
  return (
    <View style={[S.screen, { backgroundColor: c.bg }]}>
      <Head
        title="Your progress"
        sub={`${stats.levelTitle} · ${stats.overallAccuracy}% recall`}
        c={c}
        onClose={onClose}
      />
      <ScrollView contentContainerStyle={S.pad}>
        <View style={S.grid}>
          {tiles.map(tile => (
            <View
              key={tile.label}
              style={[S.tile, { backgroundColor: c.card, borderColor: c.line }]}
            >
              <Text style={[S.small, { color: c.dim }]}>{tile.label}</Text>
              <Text style={[S.tileValue, { color: c.fg }]}>{tile.value}</Text>
            </View>
          ))}
        </View>
        <Section title="Mastery" c={c} />
        <View style={S.grid}>
          {mastery.map(item => (
            <View
              key={item.label}
              style={[S.tile, { backgroundColor: c.card, borderColor: c.line }]}
            >
              <Text style={[S.tileValue, { color: item.color }]}>
                {item.value}
              </Text>
              <Text style={[S.small, { color: c.dim }]}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Section title="7-day forecast" c={c} />
        {days.map(day => {
          const width =
            forecast.peak.count > 0
              ? Math.max(4, (day.count / forecast.peak.count) * 100)
              : 4;
          return (
            <View key={day.key} style={S.forecastRow}>
              <Text style={[S.forecastLabel, { color: c.dim }]}>
                {day.label}
              </Text>
              <View style={[S.barTrack, { backgroundColor: c.card }]}>
                <View
                  style={[S.barFill, { width: `${width}%` as `${number}%` }]}
                />
              </View>
              <Text style={[S.small, { color: c.fg }]}>{day.count}</Text>
            </View>
          );
        })}
        <Section title="Category mastery" c={c} />
        {stats.categories.map(category => (
          <View
            key={category.id}
            style={[S.box, { backgroundColor: c.card, borderColor: c.line }]}
          >
            <View style={S.rowBetween}>
              <Text style={{ color: c.fg }}>
                {category.icon} {category.name}
              </Text>
              <Text style={[S.small, { color: c.dim }]}>
                {category.accuracy === null
                  ? "Not started"
                  : `${category.accuracy}% · ${category.reviewed}/${category.total}`}
              </Text>
            </View>
            <View style={[S.barTrack, { backgroundColor: c.bg }]}>
              <View style={[S.barFill, { width: `${category.coverage}%` }]} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function SettingsScreen({
  state,
  darkMode,
  themePreference,
  onUpdateSettings,
  onReplaceState,
  onResetProgress,
  onSetThemePreference,
  onClose,
}: {
  state: UserState;
  darkMode: boolean;
  themePreference: ThemePreference;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onReplaceState: (state: UserState) => void;
  onResetProgress: () => void;
  onSetThemePreference: (preference: ThemePreference) => void;
  onClose: () => void;
}) {
  const c = theme(darkMode);
  const [json, setJson] = useState(() =>
    JSON.stringify(serializeExport(state), null, 2)
  );
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState(false);
  const goals = [5, 10, 15, 20, 30],
    newCards = [1, 3, 5, 10];
  const themeOptions: Array<{ value: ThemePreference; label: string }> = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];
  const importProgress = () => {
    const result = validateImport(json);
    if (result.ok) {
      onReplaceState(result.state);
      setNotice("Progress imported.");
    } else setNotice(result.reason);
  };
  return (
    <View style={[S.screen, { backgroundColor: c.bg }]}>
      <Head title="Settings" c={c} onClose={onClose} />
      <ScrollView contentContainerStyle={S.pad}>
        <Section title="Daily goal" c={c} />
        <View style={S.chips}>
          {goals.map(goal => (
            <Pressable
              key={goal}
              onPress={() => onUpdateSettings({ dailyGoal: goal })}
              style={[
                S.chip,
                {
                  backgroundColor:
                    state.settings.dailyGoal === goal ? c.ok : c.card,
                  borderColor:
                    state.settings.dailyGoal === goal ? c.ok : c.line,
                },
              ]}
            >
              <Text
                style={{
                  color: state.settings.dailyGoal === goal ? "#fff" : c.fg,
                }}
              >
                {goal}
              </Text>
            </Pressable>
          ))}
        </View>
        <Section title="New cards per day" c={c} />
        <View style={S.chips}>
          {newCards.map(count => (
            <Pressable
              key={count}
              onPress={() => onUpdateSettings({ newCardsPerDay: count })}
              style={[
                S.chip,
                {
                  backgroundColor:
                    state.settings.newCardsPerDay === count ? c.ok : c.card,
                  borderColor:
                    state.settings.newCardsPerDay === count ? c.ok : c.line,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    state.settings.newCardsPerDay === count ? "#fff" : c.fg,
                }}
              >
                {count}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() =>
            onUpdateSettings({ autoPlayAudio: !state.settings.autoPlayAudio })
          }
          style={[S.row, { backgroundColor: c.card, borderColor: c.line }]}
        >
          <Text style={[S.f1, { color: c.fg }]}>Auto-play audio</Text>
          <Text style={{ color: state.settings.autoPlayAudio ? c.ok : c.dim }}>
            {state.settings.autoPlayAudio ? "On" : "Off"}
          </Text>
        </Pressable>
        <Section title="Theme" c={c} />
        <View style={S.chips}>
          {themeOptions.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => onSetThemePreference(value)}
              style={[
                S.chip,
                {
                  backgroundColor: themePreference === value ? c.ok : c.card,
                  borderColor: themePreference === value ? c.ok : c.line,
                },
              ]}
            >
              <Text
                style={{
                  color: themePreference === value ? "#fff" : c.fg,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Section title="Progress export" c={c} />
        <TextInput
          value={json}
          onChangeText={setJson}
          multiline
          style={[
            S.input,
            S.code,
            { backgroundColor: c.card, borderColor: c.line, color: c.fg },
          ]}
        />
        <Btn label="Import JSON" onPress={importProgress} c={c} tone="ghost" />
        {notice ? (
          <Text style={[S.small, { color: c.dim }]}>{notice}</Text>
        ) : null}
        <Section title="Danger zone" c={c} />
        {confirming ? (
          <View style={S.chips}>
            <Btn
              label="Confirm reset"
              onPress={() => {
                onResetProgress();
                setConfirming(false);
                setNotice("Progress reset.");
              }}
              c={c}
              tone="bad"
            />
            <Btn
              label="Cancel"
              onPress={() => setConfirming(false)}
              c={c}
              tone="ghost"
            />
          </View>
        ) : (
          <Btn
            label="Reset All Progress"
            onPress={() => setConfirming(true)}
            c={c}
            tone="bad"
          />
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  f1: { flex: 1 },
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
  small: { fontSize: 12, lineHeight: 18 },
  section: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  code: { minHeight: 140, textAlignVertical: "top", fontFamily: "monospace" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  tile: { width: "48%", padding: 14, borderRadius: 14, borderWidth: 1, gap: 4 },
  tileValue: { fontSize: 22, fontWeight: "700" },
  box: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  korean: { fontSize: 20, fontWeight: "700" },
  badge: {
    fontSize: 11,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  forecastRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  forecastLabel: { width: 42, fontSize: 12 },
  barTrack: { flex: 1, height: 8, borderRadius: 999, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 999, backgroundColor: "#059669" },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  btnT: { fontSize: 15, fontWeight: "600" },
});
