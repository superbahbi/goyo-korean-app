import { repeatableSession } from "../packages/domain/src/gradeIntent";
import { DashboardScreen } from "./src/components/DashboardScreen";
import {
  BrowseScreen,
  SettingsScreen,
  StatsScreen,
} from "./src/components/DialogScreens";
import {
  AlphabetPracticeScreen,
  GrammarPracticeScreen,
  ListeningPracticeScreen,
  ScenarioPracticeScreen,
  ShadowingPracticeScreen,
} from "./src/components/PracticeScreens";
import { StudySessionScreen } from "./src/components/StudySessionScreen";
import {
  GoyoMobileProvider,
  useGoyoMobile,
} from "./src/context/GoyoMobileContext";
import { Modal, SafeAreaView, StyleSheet, View } from "./src/primitives/dom";

function GoyoMobileShell() {
  const {
    state,
    vocabulary,
    studyReady,
    view,
    activeDialog,
    isStudying,
    sessionQueue,
    sessionMode,
    recognitionSessionCards,
    theme,
    themePreference,
    closeStudySession,
    handleStudyGrade,
    closeDialog,
    handleListeningGrade,
    handleScenarioGrade,
    handleShadowingGrade,
    updateSettings,
    recordGrammarResult,
    replaceState,
    resetProgress,
    setThemePreference,
  } = useGoyoMobile();

  const darkMode = theme === "dark";
  const sessionTitle =
    sessionMode === "weak"
      ? "Weak Words"
      : sessionMode === "learning"
        ? "Learning Review"
        : "Daily Session";

  return (
    <SafeAreaView
      style={[
        styles.root,
        { backgroundColor: darkMode ? "#0a1311" : "#f5f8f6" },
      ]}
      testID="goyo-mobile-root"
    >
      {isStudying && sessionQueue.length > 0 ? (
        <StudySessionScreen
          queue={sessionQueue}
          cardStates={state.cardStates}
          title={sessionTitle}
          allowRepeat={repeatableSession(
            sessionMode,
            view.today.dailyGoalReached
          )}
          autoPlayAudio={state.settings.autoPlayAudio}
          darkMode={darkMode}
          onGrade={handleStudyGrade}
          onClose={closeStudySession}
        />
      ) : (
        <DashboardScreen />
      )}

      <Modal
        visible={activeDialog !== null}
        animationType="slide"
        onRequestClose={closeDialog}
        testID="goyo-mobile-modal"
      >
        <View style={styles.modalBody}>
          {activeDialog?.kind === "alphabet" && (
            <AlphabetPracticeScreen darkMode={darkMode} onClose={closeDialog} />
          )}
          {activeDialog?.kind === "grammar" && (
            <GrammarPracticeScreen
              progress={state.grammar}
              darkMode={darkMode}
              onCompleteLesson={recordGrammarResult}
              onClose={closeDialog}
            />
          )}
          {activeDialog?.kind === "listening" && (
            <ListeningPracticeScreen
              cards={recognitionSessionCards}
              darkMode={darkMode}
              onGrade={handleListeningGrade}
              onClose={closeDialog}
            />
          )}
          {activeDialog?.kind === "scenario" && (
            <ScenarioPracticeScreen
              cards={recognitionSessionCards}
              darkMode={darkMode}
              onGrade={handleScenarioGrade}
              onClose={closeDialog}
            />
          )}
          {activeDialog?.kind === "shadowing" && (
            <ShadowingPracticeScreen
              cards={studyReady}
              darkMode={darkMode}
              onGrade={handleShadowingGrade}
              onClose={closeDialog}
            />
          )}
          {activeDialog?.kind === "browse" && (
            <BrowseScreen
              vocabulary={vocabulary}
              cardStates={state.cardStates}
              initialCategory={activeDialog.category}
              darkMode={darkMode}
              onClose={closeDialog}
            />
          )}
          {activeDialog?.kind === "stats" && (
            <StatsScreen
              stats={view.dialog.stats}
              forecast={view.dialog.forecast}
              darkMode={darkMode}
              onClose={closeDialog}
            />
          )}
          {activeDialog?.kind === "settings" && (
            <SettingsScreen
              state={state}
              darkMode={darkMode}
              themePreference={themePreference}
              onUpdateSettings={updateSettings}
              onReplaceState={replaceState}
              onResetProgress={resetProgress}
              onSetThemePreference={setThemePreference}
              onClose={closeDialog}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Mobile app root for the `/mobile` route: the DOM screens iOS's WKWebView
 * shell serves, sharing the same domain data, SRS scheduler, study session
 * state machine, practice question loops, and saved-state format as the web
 * app.
 */
export function GoyoMobileApp() {
  return (
    <GoyoMobileProvider>
      <GoyoMobileShell />
    </GoyoMobileProvider>
  );
}

export default GoyoMobileApp;

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: "100vh" },
  modalBody: { flex: 1 },
});
