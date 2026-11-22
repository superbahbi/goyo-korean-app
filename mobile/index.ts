import GoyoMobileApp from "./App";

/**
 * Entry point for React Native (iOS & Android) and Expo Web.
 * When running inside a native React Native runtime, registers the root
 * component with AppRegistry; also exports GoyoMobileApp for universal web use.
 */
function registerNativeRoot(): void {
  const scope = globalThis as unknown as {
    require?: (id: string) => unknown;
  };
  if (typeof scope.require !== "function") return;
  try {
    const rn = scope.require("react-native") as {
      AppRegistry?: {
        registerComponent: (name: string, factory: () => unknown) => void;
      };
    };
    rn.AppRegistry?.registerComponent("main", () => GoyoMobileApp);
  } catch {
    // Running in web/Vite or Node test environment where AppRegistry is not needed.
  }
}

registerNativeRoot();

export { GoyoMobileApp };
export default GoyoMobileApp;
