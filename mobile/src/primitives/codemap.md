# mobile/src/primitives/

## Responsibility
The app's platform-abstraction layer: a small, strictly typed React Native API
surface (`View`, `Text`, `Pressable`, `ScrollView`, `TextInput`, `SafeAreaView`,
`Modal`, `StyleSheet`, `Platform`) that renders RN host components on iOS/
Android and standards-compliant DOM on web/WKWebView, plus the RN→CSS style
translator that keeps layout identical across targets.

## Design
- **Adapter / facade**: screens depend on this module's interface, never on
  `react-native` or `react-native-web`. Each primitive chooses a backend per
  call in `nativeModule()`: `document` present → web; otherwise resolve
  `globalThis.require ?? __r("react-native")` once, cache it, and fall back to
  `Fragment`/`null` when no loader or no DOM exists.
- **Style translation** (`flattenStyle`, `rnStyleToCss`): nested style arrays
  merge left-to-right; `paddingHorizontal|Vertical` and
  `marginHorizontal|Vertical` expand to sides; numeric `lineHeight` becomes
  `px`; numeric `flex` maps to `flexGrow`/`flexShrink`/`flexBasis`; any positive
  `border*Width` implies `borderStyle: "solid"`; RN-only keys (shadows,
  `elevation`, `textAlignVertical`) are dropped.
- Web defaults come from `VIEW_BASE` (flex column, `alignItems: stretch`,
  `flexShrink: 0`, `boxSizing: border-box`), `TEXT_BASE`, and `BUTTON_BASE`.
  `Pressable` renders `<button>` with pressed state from pointer events, `Text`
  a `<span>` (`numberOfLines` → `-webkit-line-clamp`), `TextInput`
  `<input>`/`<textarea>`, `ScrollView` an outer scroller plus an inner track,
  and `SafeAreaView` a `View` padded with `env(safe-area-inset-*)`.
- **Modal** on web is a fixed overlay with a 640 px-max bottom sheet at `92dvh`;
  a backdrop click calls `onRequestClose`, `visible: false` renders `null`, and
  on native it delegates to RN `Modal`.
- Accessibility is translated: `accessibilityRole` → `role`,
  `accessibilityLabel` → `aria-label`, `accessibilityState` →
  `aria-disabled|selected|checked|busy|expanded`, `testID` → `data-testid`.
- `StyleSheet.create` is an identity registry plus `flatten`, `absoluteFill`,
  `hairlineWidth`. `Platform.OS` detects `iOS`/`Android` from the native
  `Platform`, else `navigator.product === "ReactNative"` or user agent, and
  `Platform.select(values)` picks by that result.
- Named exports: `flattenStyle`, `rnStyleToCss`, the seven components,
  `StyleSheet`, `Platform`, and types `PlatformName`, `ViewStyle`, `TextStyle`,
  `StyleProp`, `AccessibilityState`, `ViewProps`, `TextProps`,
  `PressableProps`, `PressableStateCallbackType`, `ScrollViewProps`,
  `TextInputProps`, `ModalProps`.

## Flow
- Props in → `flattenStyle(style)` → native: `createElement(hostComponent,
  {style, accessibility*, testID})`; web: `rnStyleToCss` merged over a base style
  → `createElement("div"|"span"|"button"|"input"|"textarea")`.
- Events: `onPress` → `onClick`; `pressed` via `onPointerDown/Up/Leave` and
  `onBlur`; `onChangeText` ← `event.target.value`; Enter on a non-multiline
  input calls `preventDefault()` then `onSubmitEditing`.
- Rendering state out: `Modal` gates the dialog host in `../../App.tsx`, and
  `SafeAreaView` keeps the shell's `flex: 1` root filling the viewport.

## Integration
- Depends only on `react` (`createElement`, `Fragment`, `useState`) and the
  ambient `require`/`__r` loader; no domain imports and no static React Native
  import — which is what lets Vite web builds and Vitest load it.
- Consumed by every screen in `../components/` and by `../../App.tsx`; all
  mobile styles are authored against these prop types rather than DOM CSS.
- Sibling maps: `../components/codemap.md`, `../context/codemap.md`.
