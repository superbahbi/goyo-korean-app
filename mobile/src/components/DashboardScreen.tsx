import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "../primitives/react-native";
import { useGoyoMobile } from "../context/GoyoMobileContext";

/** Native dashboard: the same plan, forecast, practice modes, and categories as web. */
const palette = {
  light: {
    bg: "#f5f8f6",
    card: "#ffffff",
    text: "#0f1f1a",
    muted: "#64748b",
    border: "#e2e8e4",
    track: "#e8efeb",
    accent: "#047857",
    accentSoft: "#ecfdf5",
    hero: "#047857",
    heroSoft: "#d1fae5",
    warning: "#c2410c",
    warningSoft: "#fff7ed",
  },
  dark: {
    bg: "#0a1311",
    card: "#111c19",
    text: "#f1f5f4",
    muted: "#94a3a0",
    border: "#20302b",
    track: "#1b2a26",
    accent: "#34d399",
    accentSoft: "#052e26",
    hero: "#065f46",
    heroSoft: "#a7f3d0",
    warning: "#fb923c",
    warningSoft: "#2a1608",
  },
} as const;
type Palette = { [K in keyof (typeof palette)["light"]]: string };
type CardProps = { c: Palette; children: ReactNode };

function ProgressBar({
  percent,
  color,
  track,
}: {
  percent: number;
  color: string;
  track: string;
}) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <View style={[styles.track, { backgroundColor: track }]}>
      <View
        style={[styles.fill, { width: `${width}%`, backgroundColor: color }]}
      />
    </View>
  );
}
const Card = ({ c, children }: CardProps) => (
  <View
    style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
  >
    {children}
  </View>
);

export function DashboardScreen() {
  const {
    state,
    view,
    vocabulary,
    studyReady,
    theme,
    notice,
    toggleTheme,
    dismissNotice,
    startDailySession,
    startWeakSession,
    startLearningSession,
    openDialog,
    openBrowse,
    openListening,
    openScenario,
    openShadowing,
  } = useGoyoMobile();
  const c = palette[theme];
  const plan = view.today.plan;
  const reviewed = view.today.cardsStudiedToday;
  const goal = state.settings.dailyGoal;
  const goalPercent = goal > 0 ? Math.round((reviewed / goal) * 100) : 0;
  const learnedPercent =
    studyReady.length > 0
      ? Math.round((state.stats.totalCardsLearned / studyReady.length) * 100)
      : 0;
  const cta = plan.firstRun
    ? "Start First Session"
    : view.today.dailyGoalReached
      ? "Repeat Practice"
      : "Start Daily Session";
  const practiceModes = [
    {
      key: "hangul",
      icon: "한",
      title: "Learn Hangul",
      meta: "40 characters & stroke order",
      onPress: () => openDialog({ kind: "alphabet" }),
    },
    {
      key: "grammar",
      icon: "📘",
      title: "Grammar Lessons",
      meta: `${state.grammar.completedLessonIds.length}/18 lessons`,
      onPress: () => openDialog({ kind: "grammar" }),
    },
    {
      key: "listening",
      icon: "🎧",
      title: "Listening Practice",
      meta: "Audio recognition",
      onPress: openListening,
    },
    {
      key: "scenarios",
      icon: "🗺️",
      title: "Survival Scenarios",
      meta: "Real-world conversations",
      onPress: openScenario,
    },
    {
      key: "shadowing",
      icon: "🎙️",
      title: "Shadowing Practice",
      meta: "Speaking & pronunciation",
      onPress: openShadowing,
    },
    {
      key: "weak",
      icon: "🧠",
      title: "Weak Words",
      meta: `${view.pools.weakCards.length} cards`,
      onPress: startWeakSession,
    },
    {
      key: "learning",
      icon: "🔁",
      title: "Learning Review",
      meta: `${view.pools.learningCards.length} cards`,
      onPress: startLearningSession,
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: c.card, borderBottomColor: c.border },
        ]}
      >
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>고요</Text>
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: c.text }]}>Goyo</Text>
            <Text style={[styles.brandSub, { color: c.muted }]}>
              iOS · Android · Web
            </Text>
          </View>
        </View>
        <View style={styles.headerStats}>
          <Text
            style={[
              styles.pill,
              { color: c.warning, backgroundColor: c.warningSoft },
            ]}
          >
            🔥 {state.stats.streak}d
          </Text>
          <Text
            style={[
              styles.pill,
              { color: c.accent, backgroundColor: c.accentSoft },
            ]}
          >
            ⚡ {state.stats.totalXp} XP
          </Text>
          <Pressable
            onPress={toggleTheme}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
            testID="toggle-theme"
            style={[
              styles.iconButton,
              { borderColor: c.border, backgroundColor: c.track },
            ]}
          >
            <Text style={styles.iconText}>
              {theme === "dark" ? "☀️" : "🌙"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => openDialog({ kind: "settings" })}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            testID="open-settings"
            style={[
              styles.iconButton,
              { borderColor: c.border, backgroundColor: c.track },
            ]}
          >
            <Text style={styles.iconText}>⚙️</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {notice && (
          <View
            style={[
              styles.notice,
              { backgroundColor: c.accentSoft, borderColor: c.accent },
            ]}
          >
            <Text style={[styles.noticeText, { color: c.accent }]}>
              {notice}
            </Text>
            <Pressable
              onPress={dismissNotice}
              accessibilityLabel="Dismiss notice"
              testID="dismiss-notice"
            >
              <Text style={[styles.noticeText, { color: c.accent }]}>✕</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.hero, { backgroundColor: c.hero }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={[styles.heroEyebrow, { color: c.heroSoft }]}>
                TODAY&apos;S PLAN
              </Text>
              <Text style={styles.heroTitle}>
                {plan.firstRun
                  ? "Your first session"
                  : view.today.dailyGoalReached
                    ? "Daily goal complete"
                    : "Ready to practice?"}
              </Text>
              <Text style={[styles.heroDetail, { color: c.heroSoft }]}>
                {plan.summary}
              </Text>
            </View>
            <View style={styles.heroProgressBox}>
              <Text style={styles.heroProgressValue}>
                {reviewed}/{goal}
              </Text>
              <Text style={[styles.heroProgressLabel, { color: c.heroSoft }]}>
                today
              </Text>
            </View>
          </View>
          <ProgressBar percent={goalPercent} color="#ffffff" track="#0f766e" />
          <View style={styles.heroActions}>
            <Pressable
              onPress={startDailySession}
              accessibilityRole="button"
              accessibilityLabel={cta}
              testID="start-session"
              style={styles.heroCta}
            >
              <Text style={styles.heroCtaText}>▶ {cta}</Text>
            </Pressable>
            <Pressable
              onPress={() => openDialog({ kind: "alphabet" })}
              accessibilityRole="button"
              accessibilityLabel="Learn Hangul"
              testID="hero-hangul"
              style={styles.heroSecondary}
            >
              <Text style={styles.heroSecondaryText}>Learn Hangul</Text>
            </Pressable>
          </View>
        </View>

        <Card c={c}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: c.text }]}>
              Level &amp; Mastery
            </Text>
            <Text
              style={[
                styles.badge,
                { color: c.accent, backgroundColor: c.accentSoft },
              ]}
            >
              Level {state.stats.level}
            </Text>
          </View>
          <Text style={[styles.cardValue, { color: c.text }]}>
            Level {state.stats.level} · {view.stats.levelTitle}
          </Text>
          <ProgressBar
            percent={view.stats.levelProgress}
            color={c.accent}
            track={c.track}
          />
          <Text style={[styles.cardMeta, { color: c.muted }]}>
            {state.stats.totalXp} / {view.stats.nextLevelXp} XP toward next
            level
          </Text>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Text style={[styles.cardMeta, { color: c.muted }]}>
            {state.stats.totalCardsLearned} / {studyReady.length} cards learned
          </Text>
          <ProgressBar
            percent={learnedPercent}
            color={c.accent}
            track={c.track}
          />
        </Card>

        <Card c={c}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: c.text }]}>
              Review Plan
            </Text>
            <Text
              style={[
                styles.badge,
                { color: c.warning, backgroundColor: c.warningSoft },
              ]}
            >
              {view.review.overdueCount} due · {plan.newCards} new
            </Text>
          </View>
          <View style={styles.forecastRow}>
            {view.review.forecast.map(day => (
              <View key={day.key} style={styles.forecastDay}>
                <Text style={[styles.forecastLabel, { color: c.muted }]}>
                  {day.label}
                </Text>
                <View
                  style={[
                    styles.forecastCount,
                    { backgroundColor: day.count > 0 ? c.accentSoft : c.track },
                  ]}
                >
                  <Text
                    style={[
                      styles.forecastCountText,
                      { color: day.count > 0 ? c.accent : c.muted },
                    ]}
                  >
                    {day.count}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={[styles.cardMeta, { color: c.muted }]}>
            {view.review.peak.count > 0
              ? `Next 7 days: ${view.review.total} scheduled reviews · peak ${view.review.peak.count} on ${view.review.peak.label}.`
              : "Complete a session to build your review plan."}
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Practice Modes
          </Text>
          <View style={styles.grid}>
            {practiceModes.map(mode => (
              <Pressable
                key={mode.key}
                onPress={mode.onPress}
                accessibilityRole="button"
                accessibilityLabel={mode.title}
                testID={`practice-${mode.key}`}
                style={[
                  styles.modeTile,
                  { backgroundColor: c.card, borderColor: c.border },
                ]}
              >
                <Text style={styles.modeIcon}>{mode.icon}</Text>
                <Text style={[styles.modeTitle, { color: c.text }]}>
                  {mode.title}
                </Text>
                <Text style={[styles.modeMeta, { color: c.muted }]}>
                  {mode.meta}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.quickRow}>
          <Pressable
            onPress={() => openBrowse()}
            accessibilityRole="button"
            accessibilityLabel="Browse deck"
            testID="browse-deck"
            style={[
              styles.quickLink,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <Text style={[styles.quickText, { color: c.text }]}>
              📚 Browse Deck ({vocabulary.length} cards)
            </Text>
          </Pressable>
          <Pressable
            onPress={() => openDialog({ kind: "stats" })}
            accessibilityRole="button"
            accessibilityLabel="Full stats and forecast"
            testID="open-stats"
            style={[
              styles.quickLink,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <Text style={[styles.quickText, { color: c.text }]}>
              📊 Full Stats &amp; Forecast
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Learn by Theme
          </Text>
          <View style={styles.grid}>
            {view.stats.categories.map(category => (
              <Pressable
                key={category.id}
                onPress={() => openBrowse(category.id)}
                accessibilityRole="button"
                accessibilityLabel={`Browse ${category.name}`}
                testID={`category-${category.id}`}
                style={[
                  styles.categoryTile,
                  { backgroundColor: c.card, borderColor: c.border },
                ]}
              >
                <View style={styles.categoryTop}>
                  <Text
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: c.accentSoft },
                    ]}
                  >
                    {category.icon}
                  </Text>
                  <View style={styles.categoryBody}>
                    <Text
                      style={[styles.categoryName, { color: c.text }]}
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                    <Text style={[styles.categoryMeta, { color: c.muted }]}>
                      {category.known}/{category.total} learned
                    </Text>
                  </View>
                </View>
                <ProgressBar
                  percent={category.coverage}
                  color={c.accent}
                  track={c.track}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#047857",
  },
  logoText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  brandTitle: { fontSize: 16, fontWeight: "bold" },
  brandSub: { fontSize: 10, marginTop: 1 },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pill: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 15 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeText: { fontSize: 13, fontWeight: "600" },
  hero: { borderRadius: 20, padding: 18, gap: 12 },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: { fontSize: 10, fontWeight: "bold", letterSpacing: 1.5 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 4,
  },
  heroDetail: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  heroProgressBox: { alignItems: "flex-end" },
  heroProgressValue: { fontSize: 22, fontWeight: "bold", color: "#ffffff" },
  heroProgressLabel: { fontSize: 10 },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heroCta: {
    flexGrow: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  heroCtaText: { color: "#047857", fontSize: 14, fontWeight: "bold" },
  heroSecondary: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  heroSecondaryText: { color: "#ecfdf5", fontSize: 13, fontWeight: "600" },
  track: { height: 7, borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
  card: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 8 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "bold" },
  badge: {
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardValue: { fontSize: 17, fontWeight: "bold" },
  cardMeta: { fontSize: 12, lineHeight: 17 },
  divider: { height: 1, marginVertical: 2 },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 3,
    marginTop: 4,
  },
  forecastDay: { flex: 1, alignItems: "center", gap: 3 },
  forecastLabel: { fontSize: 9, fontWeight: "600" },
  forecastCount: {
    width: "100%",
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  forecastCountText: { fontSize: 12, fontWeight: "bold" },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "bold" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modeTile: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 145,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 3,
  },
  modeIcon: { fontSize: 20 },
  modeTitle: { fontSize: 13, fontWeight: "bold", marginTop: 2 },
  modeMeta: { fontSize: 11, lineHeight: 15 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickLink: {
    flexGrow: 1,
    minWidth: 150,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  quickText: { fontSize: 12, fontWeight: "600" },
  categoryTile: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 145,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  categoryTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryIcon: {
    fontSize: 18,
    width: 34,
    height: 34,
    borderRadius: 10,
    textAlign: "center",
    lineHeight: 34,
    overflow: "hidden",
  },
  categoryBody: { flex: 1, minWidth: 0 },
  categoryName: { fontSize: 13, fontWeight: "bold" },
  categoryMeta: { fontSize: 10, marginTop: 1 },
});
